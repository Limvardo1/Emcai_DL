"""Konfigurasi global ML service."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "resume_analyzer_mlp.pkl"

# --- Gate validasi input ---------------------------------------------------
MIN_WORDS = 120                 # CV terlalu pendek -> sinyal lemah
MIN_CHARS = 100                 # indikasi PDF hasil scan / ekstraksi gagal
MIN_IN_VOCAB_RATIO = 0.35       # rasio token yang dikenal vocabulary TF-IDF
MAX_INDONESIAN_RATIO = 0.05     # penanda bahasa Indonesia
MIN_SKILLS = 8                  # minimal skill terdeteksi

MAX_FILE_MB = 5
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# --- Ambang kualitas hasil -------------------------------------------------
LOW_CONFIDENCE_GAP = 0.15       # selisih top1-top2 di bawah ini -> ragu
OVERRIDE_CONFIDENCE = 0.75      # override skill hanya bila model belum yakin

# --- Bobot rubrik skor -----------------------------------------------------
WEIGHT_CONFIDENCE = 25
WEIGHT_SKILL_MATCH = 25
WEIGHT_ATS = 20
WEIGHT_SECTIONS = 15
WEIGHT_WRITING = 15

MODEL_VERSION = "mlp-tfidf-256-v2"
