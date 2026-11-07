"""Ekstraksi teks dari PDF/DOCX."""
from __future__ import annotations

import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader


class ExtractionError(Exception):
    pass


def _clean(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as exc:  # pragma: no cover
                raise ExtractionError("PDF terproteksi password.") from exc
        pages = [page.extract_text() or "" for page in reader.pages]
    except ExtractionError:
        raise
    except Exception as exc:
        raise ExtractionError(f"Gagal membaca PDF: {exc}") from exc
    return _clean("\n".join(pages))


def extract_docx(data: bytes) -> str:
    try:
        document = Document(io.BytesIO(data))
    except Exception as exc:
        raise ExtractionError(f"Gagal membaca DOCX: {exc}") from exc

    chunks: list[str] = [p.text for p in document.paragraphs if p.text.strip()]
    for table in document.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                chunks.append(" | ".join(cells))
    return _clean("\n".join(chunks))


def extract(data: bytes, filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix == ".pdf":
        return extract_pdf(data)
    if suffix == ".docx":
        return extract_docx(data)
    raise ExtractionError("Format tidak didukung. Gunakan PDF atau DOCX.")
