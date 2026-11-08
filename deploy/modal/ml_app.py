"""Deploy layanan ML ResumeAI ke Modal (serverless, tanpa kartu).

Jalankan dari root repo:

    modal deploy deploy/modal/ml_app.py

Model 56,7 MB diunduh dari GitHub Release saat image dibangun, jadi tidak
disimpan di git. Hasil deploy berupa URL publik:

    https://<workspace>--resumeai-ml-api.<region>.modal.run
"""
from __future__ import annotations

from pathlib import Path

import modal

MODEL_URL = (
    "https://github.com/Limvardo1/Emcai_DL/releases/download/"
    "v2.0-model/resume_analyzer_mlp_v2.pkl"
)

DOWNLOAD_MODEL = (
    "python -c \"import urllib.request as u;"
    f" req = u.Request('{MODEL_URL}', headers={{'User-Agent': 'resumeai-build'}});"
    " open('/root/model/resume_analyzer_mlp.pkl', 'wb')"
    ".write(u.urlopen(req, timeout=300).read())\""
)

CHECK_MODEL = (
    "python -c \"import os;"
    " s = os.path.getsize('/root/model/resume_analyzer_mlp.pkl');"
    " assert s > 50_000_000, f'model terpotong: {s} byte'\""
)


def _build_image() -> modal.Image:
    """Image lengkap hanya dibangun di mesin lokal saat `modal deploy`."""
    ml_dir = Path(__file__).resolve().parents[2] / "services" / "ml"
    return (
        modal.Image.debian_slim(python_version="3.11")
        .pip_install_from_requirements(str(ml_dir / "requirements.txt"))
        .run_commands("mkdir -p /root/model", DOWNLOAD_MODEL, CHECK_MODEL)
        .add_local_dir(
            str(ml_dir / "src"),
            remote_path="/root/src",
            ignore=["__pycache__", "**/__pycache__", "*.pyc", "*.pyo"],
        )
    )


# Modul ini juga di-import di dalam container; jangan sentuh path lokal di sana.
image = _build_image() if modal.is_local() else modal.Image.debian_slim(python_version="3.11")

app = modal.App("resumeai-ml")


@app.function(
    image=image,
    cpu=1.0,
    memory=2048,
    timeout=300,
    # Container dibiarkan hidup 5 menit setelah request terakhir supaya
    # demo tidak terus-terusan cold start (model 56 MB harus dimuat ulang).
    scaledown_window=300,
)
@modal.concurrent(max_inputs=8)
@modal.asgi_app()
def api():
    import sys

    sys.path.insert(0, "/root")
    from src.main import app as fastapi_app

    return fastapi_app
