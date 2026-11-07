"""Pembuat umpan balik berbasis aturan (tanpa LLM)."""
from __future__ import annotations

SECTION_LABELS = {
    "contact": "Contact / kontak",
    "summary": "Summary",
    "experience": "Experience",
    "education": "Education",
    "skills": "Skills",
}


def build_feedback(
    score: dict,
    family_label: str,
    role: str,
    confidence: float,
    low_confidence: bool,
    warnings: list[str],
) -> dict:
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []

    details = score["details"]
    gap = score["skill_gap"]
    matched, missing = gap["matched"], gap["missing"]
    words = details["word_count"]
    verbs = details["action_verbs"]
    bullets = details["bullets"]
    found = details["sections_found"]
    absent = details["sections_missing"]

    # ---------------- Kekuatan ----------------
    if confidence >= 0.75:
        strengths.append(
            f"Model mengenali CV Anda dengan keyakinan tinggi pada bidang "
            f"{family_label} ({confidence*100:.0f}%)."
        )
    if matched:
        total_key = len(matched) + len(missing)
        strengths.append(
            f"{len(matched)} dari {total_key} skill kunci {role} sudah tercantum "
            f"({', '.join(matched[:4])})."
        )
    if len(found) >= 4:
        labels = ", ".join(SECTION_LABELS[s] for s in found)
        strengths.append(f"Struktur CV rapi: bagian {labels} tersedia.")
    if verbs >= 5:
        strengths.append(f"CV memakai action verb yang kuat ({verbs} ditemukan), "
                         "bagus untuk keterbacaan ATS.")
    if 250 <= words <= 900:
        strengths.append(f"Panjang CV ideal ({words} kata).")
    if bullets >= 8:
        strengths.append(f"Pengalaman dijabarkan dalam {bullets} poin ringkas.")

    # ---------------- Kelemahan ----------------
    if low_confidence:
        weaknesses.append(
            f"Keyakinan model rendah ({confidence*100:.0f}%). Isi CV tampak umum atau "
            "mencampur beberapa bidang sekaligus."
        )
    if absent:
        labels = ", ".join(SECTION_LABELS[s] for s in absent)
        weaknesses.append(f"Bagian berikut belum terdeteksi: {labels}.")
    if missing:
        weaknesses.append(
            f"{len(missing)} skill kunci untuk {role} belum terlihat: "
            f"{', '.join(missing[:5])}."
        )
    if words < 180:
        weaknesses.append(f"CV hanya {words} kata; terlalu ringkas untuk menilai pengalaman.")
    if verbs < 3:
        weaknesses.append(
            f"Hanya {verbs} action verb ditemukan. Banyak deskripsi masih bersifat pasif."
        )
    if bullets < 3:
        weaknesses.append("Pengalaman belum dipecah menjadi bullet poin.")
    for w in warnings:
        weaknesses.append(w)

    # ---------------- Saran ----------------
    if missing:
        suggestions.append(
            f"Tambahkan skill berikut ke bagian Skills bila Anda menguasainya: "
            f"{', '.join(missing[:6])}."
        )
    if verbs < 5:
        suggestions.append(
            "Awali setiap poin pengalaman dengan action verb yang terukur "
            "(Developed, Led, Improved, Reduced)."
        )
    if bullets < 8:
        suggestions.append(
            "Pecah paragraf pengalaman menjadi 3-5 bullet per posisi agar ATS mudah memindai."
        )
    if words < 220:
        suggestions.append(
            "Perluas deskripsi: sebutkan konteks, tindakan, dan hasil (angka/metrik) untuk "
            "tiap pengalaman."
        )
    if "summary" in absent:
        suggestions.append(
            "Tambahkan Summary 2-3 baris di bagian atas: role target, pengalaman, dan "
            "kekuatan utama Anda."
        )
    if "contact" in absent:
        suggestions.append(
            "Sertakan email, nomor telepon, dan tautan LinkedIn/GitHub agar perekrut mudah menghubungi."
        )
    if low_confidence:
        suggestions.append(
            f"Pertegas posisi yang dilamar. Pilih satu arah karier (misalnya {role}) dan "
            "susun skill serta pengalaman agar konsisten dengan arah itu."
        )

    return {
        "strengths": strengths[:5],
        "weaknesses": weaknesses[:5],
        "suggestions": suggestions[:6],
    }
