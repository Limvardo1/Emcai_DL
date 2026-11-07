"""FastAPI ML service — ResumeAI."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config
from .analyzer import ValidationFailed, analyze_file, analyze_text, rejection_payload
from .extract import ExtractionError
from .model_loader import load_model
from .taxonomy import FAMILIES

app = FastAPI(
    title="ResumeAI ML Service",
    version="1.0.0",
    description="Analisis CV dengan TF-IDF + MLP (tanpa LLM).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextPayload(BaseModel):
    text: str = Field(..., min_length=1)


@app.get("/health")
def health() -> dict:
    bundle = load_model()
    return {
        "status": "ok",
        "model_version": config.MODEL_VERSION,
        "classes": len(bundle.classes),
    }


@app.get("/model-info")
def model_info() -> dict:
    return load_model().info()


@app.get("/taxonomy")
def taxonomy() -> dict:
    return {
        "families": [
            {"key": key, **{k: v for k, v in data.items()}}
            for key, data in FAMILIES.items()
        ]
    }


@app.post("/analyze")
async def analyze_upload(file: UploadFile = File(...)) -> dict:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Format tidak didukung. Gunakan PDF atau DOCX.",
        )
    data = await file.read()
    if len(data) > config.MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file melebihi {config.MAX_FILE_MB} MB.",
        )
    try:
        return analyze_file(data, file.filename or "")
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ValidationFailed as exc:
        raise HTTPException(status_code=422, detail=rejection_payload(exc.result)) from exc


@app.post("/analyze-text")
def analyze_raw(payload: TextPayload) -> dict:
    try:
        return analyze_text(payload.text)
    except ValidationFailed as exc:
        raise HTTPException(status_code=422, detail=rejection_payload(exc.result)) from exc
