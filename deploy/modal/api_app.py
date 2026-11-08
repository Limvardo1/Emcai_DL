"""Deploy API Express ResumeAI ke Modal (serverless, tanpa kartu).

Jalankan dari root repo setelah secret dibuat:

    modal secret create resumeai-api --from-dotenv <file.env>
    modal deploy deploy/modal/api_app.py
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import modal


def _build_image() -> modal.Image:
    """Image lengkap hanya dibangun di mesin lokal saat `modal deploy`."""
    api_dir = Path(__file__).resolve().parents[2] / "apps" / "api"
    return (
        modal.Image.from_registry("node:22-slim", add_python="3.11")
        .env(
            {
                "NODE_ENV": "production",
                "PORT": "8080",
                "MAX_FILE_MB": "5",
                "SUPABASE_BUCKET": "resumes",
            }
        )
        .add_local_dir(
            str(api_dir),
            remote_path="/app",
            # copy=True wajib: setelah ini masih ada build step `npm ci`.
            copy=True,
            # .env dan data lokal tidak ikut diunggah; rahasia lewat Modal Secret.
            ignore=[
                "node_modules",
                "node_modules/**",
                "data",
                "data/**",
                ".env",
                ".env.*",
                "npm-debug.log*",
            ],
        )
        .run_commands("cd /app && npm ci --omit=dev")
    )


# Modul ini juga di-import di dalam container; jangan sentuh path lokal di sana.
image = (
    _build_image()
    if modal.is_local()
    else modal.Image.from_registry("node:22-slim", add_python="3.11")
)

app = modal.App("resumeai-api")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("resumeai-api")],
    cpu=0.5,
    memory=1024,
    timeout=300,
    scaledown_window=300,
)
@modal.concurrent(max_inputs=20)
@modal.web_server(8080, startup_timeout=60)
def server():
    subprocess.Popen(["node", "src/index.js"], cwd="/app")
