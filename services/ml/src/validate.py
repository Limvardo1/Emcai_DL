"""Gate kualitas input: hanya CV berbahasa Inggris yang layak dianalisis."""
from __future__ import annotations

import re
from dataclasses import dataclass

from . import config
from .model_loader import ModelBundle
from .signals import word_count

INDONESIAN_MARKERS = {
    "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "saya", "adalah",
    "pada", "akan", "tidak", "ini", "itu", "atau", "juga", "dalam", "sebagai",
    "oleh", "karena", "bisa", "sudah", "belum", "telah", "lebih", "kami",
    "kita", "anda", "mereka", "lulusan", "pengalaman", "keahlian", "pendidikan",
    "pekerjaan", "bulan", "tahun", "serta", "maupun", "tersebut", "melakukan",
    "membuat", "mengelola", "bertanggung", "jawab", "selama", "bidang",
    "perusahaan", "staff", "staf", "jurusan", "sekolah", "kemampuan",
    "menggunakan", "menyusun", "membantu", "menangani", "mahir", "terampil",
}

_TOKEN_RE = re.compile(r"[A-Za-z0-9+#.']+")


@dataclass
class ValidationResult:
    valid: bool
    reasons: list[str]
    warnings: list[str]
    meta: dict


def indonesian_ratio(text: str) -> float:
    tokens = [t.lower() for t in _TOKEN_RE.findall(text)]
    if not tokens:
        return 0.0
    hits = sum(1 for t in tokens if t in INDONESIAN_MARKERS)
    return hits / len(tokens)


def validate(text: str, skills: list[str], bundle: ModelBundle) -> ValidationResult:
    reasons: list[str] = []
    warnings: list[str] = []

    char_count = len(text.strip())
    words = word_count(text)
    ratio = bundle.in_vocab_ratio(text) if char_count else 0.0
    id_ratio = indonesian_ratio(text)
    skill_count = len(skills)

    if char_count < config.MIN_CHARS:
        reasons.append(
            "Teks CV hampir kosong. Kemungkinan PDF ini hasil scan atau berisi gambar. "
            "Mohon unggah PDF/DOCX berbasis teks."
        )
    else:
        if words < config.MIN_WORDS:
            reasons.append(
                f"CV terlalu pendek ({words} kata). Minimum {config.MIN_WORDS} kata "
                "agar analisis akurat."
            )
        if ratio < config.MIN_IN_VOCAB_RATIO:
            reasons.append(
                f"Kosakata CV tidak dikenali model (hanya {ratio*100:.0f}% kata yang dikenal). "
                "Model hanya mendukung CV berbahasa Inggris dengan istilah keahlian yang umum."
            )
        if id_ratio > config.MAX_INDONESIAN_RATIO:
            reasons.append(
                "CV terdeteksi berbahasa Indonesia. Model ini hanya mendukung CV "
                "berbahasa Inggris. Silakan terjemahkan CV terlebih dahulu."
            )
        if skill_count < config.MIN_SKILLS:
            reasons.append(
                f"Hanya {skill_count} skill yang terdeteksi (minimum {config.MIN_SKILLS}). "
                "Tambahkan bagian Skills dan sebutkan nama teknologi/keahlian secara eksplisit."
            )
        if ratio < 0.5:
            warnings.append(
                "Sebagian istilah CV tidak dikenali model; hasil bisa kurang akurat."
            )

    return ValidationResult(
        valid=not reasons,
        reasons=reasons,
        warnings=warnings,
        meta={
            "word_count": words,
            "char_count": char_count,
            "in_vocab_ratio": round(ratio, 3),
            "indonesian_ratio": round(id_ratio, 3),
            "skill_count": skill_count,
            "language": "id" if id_ratio > config.MAX_INDONESIAN_RATIO else "en",
        },
    )
