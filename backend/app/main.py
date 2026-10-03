import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import requests
import json
from dotenv import load_dotenv

app = FastAPI()

# Load environment variables from .env
load_dotenv()

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load env vars
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMMA_MODEL = os.getenv("GEMMA_MODEL")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment. Create a .env file.")
if not GEMMA_MODEL:
    raise RuntimeError("GEMMA_MODEL is empty. Please set it in .env before starting the server.")

GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMMA_MODEL}:generateContent"

class AnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None  # e.g., "image/png" or "image/jpeg"
    fallback_text: Optional[str] = None
    approach_text: Optional[str] = None

class LayerResult(BaseModel):
    layer: str
    findings: List[Dict[str, Any]]
    status: str  # "done" or "no_issues"

def call_gemini(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Gemini prompt asks for JSON; no responseMimeType needed
    payload = {"contents": [{"role": "user", "parts": messages}]}
    headers = {"Content-Type": "application/json"}
    resp = requests.post(
        GEMINI_ENDPOINT,
        params={"key": GEMINI_API_KEY},
        json=payload,
        headers=headers,
        timeout=30,
    )
    if not resp.ok:
        raise HTTPException(status_code=502, detail="Gemini API error: " + resp.text)
    try:
        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        # Strip any markdown fences (```json or ```) before parsing
        cleaned = raw_text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception as e:
        # Attempt a repair request using the raw_text we captured (if any)
        raw = raw_text if 'raw_text' in locals() else ''
        repair_msg = [{"text": f"Please output the previous response as valid JSON without any markdown fences. The content was: {raw}"}]
        resp2 = requests.post(
            GEMINI_ENDPOINT,
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"role": "user", "parts": repair_msg}]},
            headers=headers,
            timeout=30,
        )
        if resp2.ok:
            try:
                raw2 = resp2.json()["candidates"][0]["content"]["parts"][0]["text"]
                cleaned2 = raw2.strip().replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned2)
            except Exception:
                raise HTTPException(status_code=502, detail="Failed to parse Gemini JSON response.")
        else:
            raise HTTPException(status_code=502, detail="Gemini repair request failed.")

@app.post("/analyze", response_model=Dict[str, Any])
async def analyze(req: AnalyzeRequest):
    # Build multimodal prompt for Layer 0
    messages = []
    if req.image_base64:
        # Use provided mime type, default to image/png if missing
        mime = req.image_mime_type or "image/png"
        messages.append({"inlineData": {"mimeType": mime, "data": req.image_base64}})
    if req.fallback_text:
        messages.append({"text": req.fallback_text})
    if req.approach_text:
        messages.append({"text": req.approach_text})
    prompt = (
        "You are a DSA diagnostic assistant. Extract the following fields from the provided image or text and output *only* valid JSON (no markdown):\n"
        "{\n  \"problem_statement\": string,\n  \"code\": string,\n  \"approach\": string,\n  \"language\": string,\n  \"per_line_confidence\": {\"line_number\": string (low|medium|high) ...}\n}\n"
        "If any field is missing, use null."
    )
    messages.append({"text": prompt})
    try:
        layer0 = call_gemini(messages)
    except HTTPException as exc:
        raise exc
    # Layer 1 – Approach
    approach_msg = [
        {"text": f"Problem: {layer0.get('problem_statement') or 'unknown'}"},
        {"text": f"Approach: {layer0.get('approach') or 'none'}"},
        {"text": "Check the approach for missing cases, wrong paradigm, or unjustified assumptions. Return JSON with fields: layer, findings (list of {layer, severity, location, claim, evidence, confidence, suggestion}), and status (\\\"done\\\" or \\\"no_issues\\\")."},
    ]
    layer1 = call_gemini(approach_msg)
    # Layer 2 – Code analysis
    code_msg = [
        {"text": f"Language: {layer0.get('language') or 'unknown'}"},
        {"text": f"Code:\n{layer0.get('code') or ''}"},
        {"text": "Identify off‑by‑one, mutation bugs, missing edge cases, etc. Return JSON same schema as above."},
    ]
    layer2 = call_gemini(code_msg)
    # Layer 3 – Alignment
    align_msg = [
        {"text": f"Approach: {layer0.get('approach') or ''}"},
        {"text": f"Code:\n{layer0.get('code') or ''}"},
        {"text": "Does the code implement the described approach? Flag mismatches. Return JSON same schema."},
    ]
    layer3 = call_gemini(align_msg)
    return {"layer0": layer0, "layers": {"approach": layer1, "code": layer2, "alignment": layer3}}
