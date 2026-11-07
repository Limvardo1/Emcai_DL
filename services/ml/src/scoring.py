"""Rubrik skor CV 0-100.

Skor ini deterministik dan dapat dijelaskan, bukan output jaringan saraf.
Komponen confidence memakai probabilitas MLP; sisanya heuristik terukur.
"""
from __future__ import annotations

from . import config


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _length_points(words: int) -> float:
    if 250 <= words <= 900:
        return 5.0
    if words < 250:
        return 5.0 * words / 250
    return max(0.0, 5.0 - (words - 900) / 600 * 5.0)


def compute_score(
    max_proba: float,
    skills: set[str],
    key_skills: list[str],
    sections: dict[str, bool],
    verb_count: int,
    bullets: int,
    words: int,
    in_vocab_ratio: float,
) -> dict:
    target = key_skills[:8]
    matched = [s for s in target if s in skills]
    missing = [s for s in target if s not in skills]

    confidence = config.WEIGHT_CONFIDENCE * _clamp((max_proba - 0.15) / 0.85)
    skill_match = config.WEIGHT_SKILL_MATCH * _clamp(len(matched) / max(1, len(target)))
    ats = config.WEIGHT_ATS * _clamp((in_vocab_ratio - 0.30) / 0.45)
    section_ratio = sum(1 for v in sections.values() if v) / max(1, len(sections))
    section_score = config.WEIGHT_SECTIONS * section_ratio

    verb_pts = 5.0 * _clamp(verb_count / 5)
    bullet_pts = 5.0 * _clamp(bullets / 8)
    length_pts = _length_points(words)
    writing = verb_pts + bullet_pts + length_pts

    total = confidence + skill_match + ats + section_score + writing
    return {
        "overall_score": int(round(_clamp(total, 0, 100))),
        "grade": _grade(total),
        "breakdown": {
            "confidence": round(confidence, 1),
            "skill_match": round(skill_match, 1),
            "ats_keyword": round(ats, 1),
            "sections": round(section_score, 1),
            "writing": round(writing, 1),
        },
        "max_scores": {
            "confidence": config.WEIGHT_CONFIDENCE,
            "skill_match": config.WEIGHT_SKILL_MATCH,
            "ats_keyword": config.WEIGHT_ATS,
            "sections": config.WEIGHT_SECTIONS,
            "writing": config.WEIGHT_WRITING,
        },
        "skill_gap": {"matched": matched, "missing": missing},
        "details": {
            "action_verbs": verb_count,
            "bullets": bullets,
            "word_count": words,
            "sections_found": [k for k, v in sections.items() if v],
            "sections_missing": [k for k, v in sections.items() if not v],
        },
    }


def _grade(total: float) -> str:
    if total >= 85:
        return "Sangat baik"
    if total >= 70:
        return "Baik"
    if total >= 55:
        return "Cukup"
    if total >= 40:
        return "Perlu perbaikan"
    return "Kurang"
