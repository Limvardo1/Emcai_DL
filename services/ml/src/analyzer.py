"""Orkestrasi analisis CV: validasi -> prediksi -> taksonomi -> skor -> feedback."""
from __future__ import annotations

from . import config
from .extract import extract
from .feedback import build_feedback
from .model_loader import load_model
from .scoring import compute_score
from .signals import action_verb_count, bullet_count, detect_sections, word_count
from .skills import detect_skills
from .taxonomy import (
    CLASS_TO_FAMILY,
    FAMILIES,
    FAMILY_ROLES,
    family_key_skills,
    refine_role,
    role_key_skills,
)
from .validate import ValidationResult, validate

# Bobot rekomendasi profesi: sinyal model dominan, kecocokan skill menajamkan.
FAMILY_SHARE_WEIGHT = 0.65
ROLE_SKILL_WEIGHT = 0.35
MAX_JOB_MATCHES = 3
MAX_JOBS_PER_FAMILY = 2


class ValidationFailed(Exception):
    def __init__(self, result: ValidationResult):
        super().__init__("; ".join(result.reasons))
        self.result = result


def _header(text: str) -> str:
    """Ambil baris pendek di awal CV sebagai kandidat job title."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    short = [line for line in lines[:6] if len(line) <= 60]
    return " \n ".join(short[:3])


def _should_override(base: str, target: str, confidence: float, skills: set[str]) -> bool:
    """Ganti keluarga hanya bila model belum yakin, atau bukti skill sangat kuat."""
    if target == base:
        return False
    if confidence < config.OVERRIDE_CONFIDENCE:
        return True
    hits = len(skills & set(family_key_skills(target)))
    return hits >= 4


def _job_candidates(family_scores: dict[str, float], skills: set[str]) -> list[dict]:
    """Bangun kandidat jabatan dengan skor gabungan probabilitas keluarga + skill."""
    total = sum(family_scores.values()) or 1.0
    candidates: list[dict] = []
    for family_key, value in family_scores.items():
        share = value / total
        roles = FAMILY_ROLES.get(family_key) or [FAMILIES[family_key]["label"]]
        for role in roles:
            key_skills = role_key_skills(role, family_key)
            matched = [s for s in key_skills if s in skills]
            fit = len(matched) / len(key_skills) if key_skills else 0.0
            candidates.append(
                {
                    "role": role,
                    "family_key": family_key,
                    "family_label": FAMILIES[family_key]["label"],
                    "score": FAMILY_SHARE_WEIGHT * share + ROLE_SKILL_WEIGHT * fit,
                    "matched_skills": matched,
                    "missing_skills": [s for s in key_skills if s not in skills],
                }
            )
    return candidates


def _take(pool: list[dict], used: set[str], per_family: dict[str, int]) -> dict | None:
    for item in sorted(pool, key=lambda c: c["score"], reverse=True):
        if item["role"] in used:
            continue
        if per_family.get(item["family_key"], 0) >= MAX_JOBS_PER_FAMILY:
            continue
        return item
    return None


def rank_job_matches(
    family_scores: dict[str, float],
    skills: set[str],
    family_key: str,
    preferred_role: str = "",
) -> list[dict]:
    """Tiga profesi paling cocok.

    Peringkat 1 selalu dari keluarga terpilih agar konsisten dengan
    ``predicted.family_label``; peringkat berikutnya boleh lintas keluarga,
    maksimal dua profesi dari keluarga yang sama.
    """
    candidates = _job_candidates(family_scores, skills)
    if not candidates:
        return []

    used: set[str] = set()
    per_family: dict[str, int] = {}

    primary = next(
        (
            c
            for c in candidates
            if c["role"] == preferred_role and c["family_key"] == family_key
        ),
        None,
    )
    if primary is None:
        primary = _take(
            [c for c in candidates if c["family_key"] == family_key], used, per_family
        )
    if primary is None:
        primary = _take(candidates, used, per_family)
    if primary is None:
        return []

    picked = [primary]
    used.add(primary["role"])
    per_family[primary["family_key"]] = 1

    while len(picked) < MAX_JOB_MATCHES:
        nxt = _take(candidates, used, per_family)
        if nxt is None:
            break
        picked.append(nxt)
        used.add(nxt["role"])
        per_family[nxt["family_key"]] = per_family.get(nxt["family_key"], 0) + 1

    # Kalau slot tersisa hanya terisi profesi tanpa satu pun skill cocok,
    # ganti dengan kandidat lain yang punya bukti skill. Aturan "maks 2 per
    # bidang" boleh dilanggar di sini: lebih baik sebidang daripada profesi
    # yang tidak didukung isi CV sama sekali.
    for index, item in enumerate(picked):
        if item["matched_skills"]:
            continue
        replacement = next(
            (
                c
                for c in sorted(candidates, key=lambda c: c["score"], reverse=True)
                if c["role"] not in used and c["matched_skills"]
            ),
            None,
        )
        if replacement is None:
            break
        used.discard(item["role"])
        used.add(replacement["role"])
        picked[index] = replacement

    # Persentase relatif terhadap peringkat 1, yang memakai probabilitas
    # keluarganya sendiri (bukan angka karangan). Profesi kedua dari bidang
    # yang sama diberi diskon kecil: sinyal keluarganya identik, jadi tanpa
    # ini dua profesi bisa tampil sama-sama 100%.
    base = picked[0]["score"] or 1.0
    top_share = family_scores.get(picked[0]["family_key"], 0.0)
    seen_family: dict[str, int] = {}
    for item in picked:
        family_rank = seen_family.get(item["family_key"], 0)
        seen_family[item["family_key"]] = family_rank + 1
        relative = (item["score"] / base) * (0.95 ** family_rank)
        item["match"] = round(relative * top_share * 100, 1)
        item.pop("score", None)
    return picked


def analyze_text(text: str) -> dict:
    bundle = load_model()
    skills_list = detect_skills(text)
    skills = set(skills_list)

    result = validate(text, skills_list, bundle)
    if not result.valid:
        raise ValidationFailed(result)

    ranked = bundle.ranked(text)
    top = ranked[0]
    confidence = top["probability"]
    base_family = CLASS_TO_FAMILY[top["category"]]

    # Agregasi probabilitas 24 kelas menjadi skor per keluarga karier
    family_scores: dict[str, float] = {}
    for item in ranked:
        key = CLASS_TO_FAMILY[item["category"]]
        family_scores[key] = family_scores.get(key, 0.0) + item["probability"]

    role, role_family = refine_role(base_family, skills, _header(text))
    final_family = base_family
    if _should_override(base_family, role_family, confidence, skills):
        final_family = role_family
        family_scores[base_family] = max(0.0, family_scores.get(base_family, 0.0) - confidence)
        family_scores[role_family] = family_scores.get(role_family, 0.0) + confidence

    job_matches = rank_job_matches(family_scores, skills, final_family, role)
    if job_matches:
        # Peringkat 1 menjadi role resmi agar UI dan skill gap tidak bertentangan.
        role = job_matches[0]["role"]

    career_matches = sorted(
        (
            {
                "family_key": key,
                "label": FAMILIES[key]["label"],
                "match": round(value * 100, 1),
                "description": FAMILIES[key]["description"],
            }
            for key, value in family_scores.items()
            if value > 0.005
        ),
        key=lambda x: x["match"],
        reverse=True,
    )[:5]

    sections = detect_sections(text)
    verbs = action_verb_count(text)
    bullets = bullet_count(text)
    words = word_count(text)

    score = compute_score(
        max_proba=confidence,
        skills=skills,
        key_skills=role_key_skills(role, final_family),
        sections=sections,
        verb_count=verbs,
        bullets=bullets,
        words=words,
        in_vocab_ratio=result.meta["in_vocab_ratio"],
    )

    gap = (ranked[0]["probability"] - ranked[1]["probability"]) if len(ranked) > 1 else 1.0
    low_confidence = gap < config.LOW_CONFIDENCE_GAP or confidence < 0.4

    family_label = FAMILIES[final_family]["label"]
    feedback = build_feedback(
        score=score,
        family_label=family_label,
        role=role,
        confidence=confidence,
        low_confidence=low_confidence,
        warnings=result.warnings,
    )

    return {
        "valid": True,
        "predicted": {
            "role": role,
            "family_key": final_family,
            "family_label": family_label,
            "category": top["category"],
            "confidence": round(confidence, 4),
        },
        "is_low_confidence": low_confidence,
        "career_matches": career_matches,
        "job_matches": job_matches,
        "overall_score": score["overall_score"],
        "grade": score["grade"],
        "breakdown": score["breakdown"],
        "max_scores": score["max_scores"],
        "skill_gap": score["skill_gap"],
        "details": score["details"],
        "skills_detected": skills_list,
        "raw_predictions": [
            {"category": r["category"], "probability": round(r["probability"], 4)}
            for r in ranked[:5]
        ],
        "extracted_text": text[:20000],
        "strengths": feedback["strengths"],
        "weaknesses": feedback["weaknesses"],
        "suggestions": feedback["suggestions"],
        "meta": result.meta,
        "model_version": config.MODEL_VERSION,
    }


def analyze_file(data: bytes, filename: str) -> dict:
    text = extract(data, filename)
    return analyze_text(text)


def rejection_payload(result: ValidationResult) -> dict:
    return {
        "valid": False,
        "reasons": result.reasons,
        "meta": result.meta,
    }
