import os
import subprocess
import sys
import tempfile
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    print("Starting step: call Gemini", flush=True)
    resp = requests.post(
        GEMINI_ENDPOINT,
        params={"key": GEMINI_API_KEY},
        json=payload,
        headers=headers,
        timeout=20,
    )
    if not resp.ok:
        raise RuntimeError("Gemini API error: " + resp.text)
    try:
        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        # Strip any markdown fences (```json or ```) before parsing
        cleaned = raw_text.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(cleaned)
        return result
    except (KeyError, IndexError, TypeError, ValueError):
        # Attempt a repair request using the raw_text we captured (if any)
        raw = raw_text if 'raw_text' in locals() else ''
        repair_msg = [{"text": f"Please output the previous response as valid JSON without any markdown fences. The content was: {raw}"}]
        resp2 = requests.post(
            GEMINI_ENDPOINT,
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"role": "user", "parts": repair_msg}]},
            headers=headers,
            timeout=20,
        )
        if resp2.ok:
            try:
                raw2 = resp2.json()["candidates"][0]["content"]["parts"][0]["text"]
                cleaned2 = raw2.strip().replace("```json", "").replace("```", "").strip()
                result = json.loads(cleaned2)
                return result
            except (KeyError, IndexError, TypeError, ValueError) as exc:
                raise RuntimeError("Failed to parse Gemini JSON response.") from exc
        else:
            raise RuntimeError("Gemini repair request failed.")


def call_gemini_step(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    try:
        return call_gemini(messages)
    finally:
        print("Completed step: call Gemini", flush=True)


def run_verifier(code: Optional[str], language: Optional[str]) -> Dict[str, Any]:
    print("Starting step: run verifier", flush=True)
    if not code or (language or "").lower() not in {"python", "python3"}:
        result = {"status": "skipped", "reason": "Verifier only runs extracted Python code."}
        print("Completed step: run verifier", flush=True)
        return result

    try:
        with tempfile.NamedTemporaryFile("w", suffix=".py", encoding="utf-8") as source:
            source.write(code)
            source.flush()
            compile(code, source.name, "exec")
            completed = subprocess.run(
                [sys.executable, source.name],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )
        result = {
            "status": "passed" if completed.returncode == 0 else "failed",
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "return_code": completed.returncode,
        }
    except SyntaxError as exc:
        result = {
            "status": "failed",
            "error": str(exc),
            "error_type": "SyntaxError",
        }
    except subprocess.TimeoutExpired:
        result = {
            "status": "failed",
            "error": "Code execution exceeded the 2-second timeout.",
            "error_type": "TimeoutExpired",
        }
    except OSError as exc:
        raise RuntimeError(f"Unable to execute verifier: {exc}") from exc
    print("Completed step: run verifier", flush=True)
    return result

@app.post("/analyze", response_model=Dict[str, Any])
async def analyze(request: Request):
    step = "parse input"
    try:
        print("Starting step: parse input", flush=True)
        req = AnalyzeRequest.parse_obj(await request.json())
        messages = []
        if req.image_base64:
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
        print("Completed step: parse input", flush=True)

        step = "call Gemini"
        layer0 = call_gemini_step(messages)
        approach_msg = [
            {"text": f"Problem: {layer0.get('problem_statement') or 'unknown'}"},
            {"text": f"Approach: {layer0.get('approach') or 'none'}"},
            {"text": "Check the approach for missing cases, wrong paradigm, or unjustified assumptions. Return JSON with fields: layer, findings (list of {layer, severity, location, claim, evidence, confidence, suggestion}), and status (\"done\" or \"no_issues\")."},
        ]
        layer1 = call_gemini_step(approach_msg)
        code_msg = [
            {"text": f"Language: {layer0.get('language') or 'unknown'}"},
            {"text": f"Code:\n{layer0.get('code') or ''}"},
            {"text": "Identify off-by-one, mutation bugs, missing edge cases, etc. Return JSON same schema as above."},
        ]
        layer2 = call_gemini_step(code_msg)
        align_msg = [
            {"text": f"Approach: {layer0.get('approach') or ''}"},
            {"text": f"Code:\n{layer0.get('code') or ''}"},
            {"text": "Does the code implement the described approach? Flag mismatches. Return JSON same schema."},
        ]
        layer3 = call_gemini_step(align_msg)

        step = "run verifier"
        verifier = run_verifier(layer0.get("code"), layer0.get("language"))

        step = "build response"
        print("Starting step: build response", flush=True)
        response = {"layer0": layer0, "layers": {"approach": layer1, "code": layer2, "alignment": layer3, "verifier": verifier}}
        print("Completed step: build response", flush=True)
        return response
    except Exception as exc:
        print(f"Failed step: {step}: {exc}", flush=True)
        return JSONResponse(status_code=502, content={"error": str(exc), "step": step})
