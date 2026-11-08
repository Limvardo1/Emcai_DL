# ResumeAI ML service — FastAPI + TF-IDF/MLP
# Port mengikuti env PORT (Render) atau default 7860 (Hugging Face Space).
FROM python:3.11-slim

RUN useradd -m -u 1000 user

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Model 56,7 MB tidak disimpan di repo; diunduh dari GitHub Release saat build.
ARG MODEL_URL=https://github.com/Limvardo1/Emcai_DL/releases/download/v2.0-model/resume_analyzer_mlp_v2.pkl
RUN mkdir -p model && python -c "import os, urllib.request; urllib.request.urlretrieve('$MODEL_URL', 'model/resume_analyzer_mlp.pkl'); size = os.path.getsize('model/resume_analyzer_mlp.pkl'); assert size > 50_000_000, f'model terlalu kecil: {size} byte'"

COPY --chown=user:user src ./src

USER user

EXPOSE 7860

# scikit-learn==1.6.1 harus tetap sama dengan versi saat model dilatih.
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
