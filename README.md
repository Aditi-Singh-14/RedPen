# RedPen – Layered DSA Diagnosis (P0 MVP)

## What it does
RedPen lets a student or interview‑prep candidate upload a **photo/screenshot** (or paste raw text) of a DSA problem attempt together with a free‑form description of their **approach**. The app then runs **Gemma 4** (via the Gemini API) through a thin FastAPI backend to:

1. **Ingest** the image/text and extract:
   - Problem statement
   - Code snippet
   - Stated approach
   - Programming language
   - Per‑line confidence scores
2. Run three **analysis layers** (Approach, Code, Alignment) that return structured JSON findings.
3. Display the results as red‑pen styled cards; a clean "no issues" result shows a green stamp.
4. If the Gemini API call fails, three **cached demo samples** are shown instead (greedy coin‑change, a clean solution, and an approach/code mismatch).

The UI mimics an exam paper with warm paper background, ink‑blue text, and red‑pen highlights.

## Stack
- **Frontend:** React built with Vite (`frontend/`).
- **Backend:** Python FastAPI (`backend/`).
- **Model:** **Gemma 4** accessed via the **Gemini API**. The model ID is read from the environment variable `GEMMA_MODEL` – it **must be set**, otherwise the server aborts on start with a clear error.
- **API Key:** Stored only on the server side in a `.env` file (`GEMINI_API_KEY`).

## Repository layout
```
RedPen/
├─ frontend/            # Vite + React UI
│   ├─ src/
│   │   ├─ App.jsx
│   │   ├─ index.css
│   │   ├─ components/
│   │   │   ├─ UploadPane.jsx
│   │   │   └─ ResultCard.jsx
│   │   └─ demoData.js   # three cached demo samples
│   ├─ index.html
│   ├─ vite.config.ts
│   └─ package.json
├─ backend/            # FastAPI thin wrapper
│   ├─ app/
│   │   └─ main.py
│   ├─ .env.example
│   └─ requirements.txt
├─ .gitignore
├─ README.md
└─ LICENSE (MIT)
```

## Setup & Run (local only)
```bash
# 1️⃣ Clone the repo
git clone https://github.com/your-username/RedPen.git
cd RedPen

# 2️⃣ Backend
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Copy the env template and fill in your Gemini credentials
cp backend/.env.example backend/.env
# Edit backend/.env → set GEMINI_API_KEY and **leave GEMMA_MODEL empty** to see the startup error.

# 3️⃣ Frontend
cd frontend
npm install
npm run dev   # serves at http://localhost:5173

# 4️⃣ Start the backend (in a separate terminal)
cd ../backend
uvicorn app.main:app --reload   # serves at http://localhost:8000
```
If you run the frontend **before** setting `GEMMA_MODEL`, the backend will exit with the message:
```
RuntimeError: GEMMA_MODEL is empty. Please set it in .env before starting the server.
```
This satisfies the requirement to have a clear startup error when the model ID is missing.

## How Gemma 4 is used
The backend builds **multimodal messages** (image + optional text) and sends them to the Gemini API endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/<GEMMA_MODEL>:generateContent
```
Each layer is a separate Gemini call, returning **only JSON** (no markdown). The server strips code fences and retries once with a repair prompt if parsing fails.

## Why multimodal input matters
Students often work on paper, whiteboards, or IDE screenshots. By sending the image directly to Gemma 4 we let the model **understand handwritten code, annotated sketches, or error screens** – something a pure‑text pipeline could not capture.

## Limitations
- The app never executes user code. All diagnoses are AI‑generated opinions.
- Findings are only as good as the model’s reasoning; the UI labels every verdict as **“the AI’s read”**.
- If the Gemini API is unavailable, the demo fallback data ensures the UI remains functional.

## License
MIT – see `LICENSE`.
```
