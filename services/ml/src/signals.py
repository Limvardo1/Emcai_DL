"""Sinyal teks yang dipakai gate validasi dan rubrik skor."""
from __future__ import annotations

import re

WORD_RE = re.compile(r"[A-Za-z0-9+#.']+")

SECTION_PATTERNS: dict[str, re.Pattern[str]] = {
    "contact": re.compile(
        r"(@[\w.-]+\.\w+|\+?\d[\d\s().-]{7,}\d|linkedin\.com|github\.com)", re.I
    ),
    "summary": re.compile(r"\b(summary|profile|about me|objective|ringkasan)\b", re.I),
    "experience": re.compile(
        r"\b(work experience|professional experience|employment|work history|"
        r"experience|pengalaman kerja)\b", re.I,
    ),
    "education": re.compile(
        r"\b(education|universitas|university|bachelor|master|degree|diploma|"
        r"pendidikan|sarjana)\b", re.I,
    ),
    "skills": re.compile(
        r"\b(skills|competencies|technical skills|core skills|expertise|keahlian)\b", re.I
    ),
}

SECTION_POINTS = 3  # 5 section x 3 = 15

ACTION_VERBS = [
    "led", "build", "built", "develop", "developed", "design", "designed",
    "manage", "managed", "creat", "created", "improv", "improved", "increas",
    "increased", "reduc", "reduced", "deliver", "delivered", "implement",
    "implemented", "launch", "launched", "coordinat", "coordinated", "analy",
    "analyzed", "analysed", "achiev", "achieved", "optimiz", "optimized",
    "support", "supported", "train", "trained", "maintain", "maintained",
    "automat", "automated", "migrat", "migrated", "negotiat", "negotiated",
    "mentor", "mentored", "supervis", "supervised", "streamlin", "streamlined",
    "establish", "established", "collaborat", "collaborated", "resolv", "resolved",
]

_VERB_RE = re.compile(r"\b(" + "|".join(ACTION_VERBS) + r")\w*\b", re.I)
_BULLET_RE = re.compile(r"^\s*(?:[-*\u2022\u25cf\u2023]|\d+[.)])\s+", re.M)


def word_count(text: str) -> int:
    return len(WORD_RE.findall(text))


def detect_sections(text: str) -> dict[str, bool]:
    return {name: bool(p.search(text)) for name, p in SECTION_PATTERNS.items()}


def action_verb_count(text: str) -> int:
    return len(_VERB_RE.findall(text))


def bullet_count(text: str) -> int:
    return len(_BULLET_RE.findall(text))
