"""Buat file DOCX contoh untuk uji upload.

    .venv\\Scripts\\python.exe -m scripts.make_samples
"""
from __future__ import annotations

import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.smoke_test import SAMPLES  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[3] / "samples"


def build(name: str, text: str) -> Path:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)

    for index, line in enumerate(text.splitlines()):
        stripped = line.strip()
        if not stripped:
            continue
        paragraph = doc.add_paragraph()
        run = paragraph.add_run(stripped)
        if index < 2:
            run.bold = True
            run.font.size = Pt(14 if index == 0 else 11)
        paragraph.paragraph_format.space_after = Pt(4)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = name.lower().replace(" ", "_")
    path = OUT_DIR / f"cv_{slug}.docx"
    doc.save(path)
    return path


def main() -> None:
    for name, text in SAMPLES.items():
        path = build(name, text)
        print("dibuat:", path)


if __name__ == "__main__":
    main()
