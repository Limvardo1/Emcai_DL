"""Kamus skill bilingual (Inggris + sinonim Indonesia).

Kamus ini adalah jembatan bahasa: CV berbahasa Indonesia dan CV berbahasa
Inggris yang menyebut keahlian sama akan menghasilkan vektor skill identik.
Karena itu dataset training berbahasa Inggris tetap valid.

Format: {nama_kanonik: [alias tambahan]}
Nama kanonik otomatis ikut dicocokkan.
"""
from __future__ import annotations

import re

SKILLS: dict[str, list[str]] = {
    # ---------------- Pemrograman & IT ----------------
    "python": ["phyton"],
    "java": ["java programming", "pemrograman java"],
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "php": ["php programming"],
    "ruby": ["ruby on rails"],
    "golang": ["go language"],
    "rust": [],
    "kotlin": [],
    "swift": ["swift ios"],
    "scala": [],
    "matlab": [],
    "bash": ["shell scripting", "bash scripting", "skrip shell"],
    "powershell": [],
    "sql": ["mysql query", "query sql", "basis data"],
    "nosql": ["no sql"],
    "html": ["html5"],
    "css": ["css3"],
    "sass": ["scss"],
    "react": ["reactjs", "react js"],
    "vue": ["vuejs", "vue js"],
    "angular": ["angularjs"],
    "svelte": [],
    "next.js": ["nextjs", "next js"],
    "node.js": ["nodejs", "node js"],
    "express": ["expressjs", "express js"],
    "django": [],
    "flask": [],
    "fastapi": [],
    "laravel": [],
    "spring boot": ["springboot"],
    "asp.net": ["aspnet"],
    "jquery": [],
    "bootstrap": [],
    "tailwind css": ["tailwindcss", "tailwind"],
    "redux": [],
    "graphql": [],
    "rest api": ["restful api", "restful", "api rest"],
    "microservices": ["microservice", "micro services"],
    "docker": ["containerization", "kontainerisasi"],
    "kubernetes": ["k8s"],
    "git": ["version control", "kontrol versi"],
    "github": [],
    "gitlab": [],
    "ci cd": ["cicd", "continuous integration", "continuous deployment"],
    "jenkins": [],
    "terraform": [],
    "ansible": [],
    "linux": ["ubuntu", "unix"],
    "aws": ["amazon web services"],
    "azure": ["microsoft azure"],
    "google cloud": ["gcp", "google cloud platform"],
    "firebase": [],
    "supabase": [],
    "mongodb": ["mongo db"],
    "postgresql": ["postgres"],
    "mysql": [],
    "redis": [],
    "elasticsearch": ["elastic search"],
    "kafka": ["apache kafka"],
    "rabbitmq": [],
    "hadoop": [],
    "spark": ["apache spark", "pyspark"],
    "airflow": ["apache airflow"],
    "etl": ["extract transform load"],
    "data pipeline": ["pipeline data", "data pipelines"],
    "web scraping": ["scraping", "scrapping", "scraper"],
    "selenium": [],
    "unit testing": ["pengujian unit", "testing"],
    "agile": ["agile methodology", "metodologi agile"],
    "scrum": [],
    "jira": [],
    "figma": [],
    "ui ux": ["ui/ux", "user experience", "user interface", "pengalaman pengguna"],
    "responsive design": ["desain responsif"],
    "wordpress": [],
    "seo": ["search engine optimization", "optimasi mesin pencari"],
    "google analytics": [],
    "machine learning": ["ml", "pembelajaran mesin"],
    "deep learning": ["pembelajaran mendalam"],
    "tensorflow": [],
    "pytorch": ["torch"],
    "keras": [],
    "scikit-learn": ["sklearn", "scikit learn"],
    "pandas": [],
    "numpy": [],
    "opencv": ["open cv"],
    "nlp": ["natural language processing", "pemrosesan bahasa alami"],
    "computer vision": ["visi komputer"],
    "data analysis": ["analisis data", "analisa data", "analytics", "analitik"],
    "data visualization": ["visualisasi data", "data visualisation"],
    "statistics": ["statistika", "statistik", "statistical analysis"],
    "excel": ["microsoft excel", "ms excel", "spreadsheet", "spreadsheets"],
    "power bi": ["powerbi"],
    "tableau": [],
    "google sheets": [],
    "looker": ["looker studio", "google data studio"],
    "sas": [],
    "spss": [],
    "a/b testing": ["ab testing", "split testing"],
    "forecasting": ["peramalan", "perkiraan"],
    "data mining": ["penambangan data"],
    "big data": [],
    "database administration": ["administrasi basis data", "dba"],
    "cybersecurity": ["keamanan siber"],
    "networking": ["jaringan", "computer networking"],
    "troubleshooting": ["pemecahan masalah teknis"],
    "helpdesk": ["help desk", "service desk", "it support"],
    "active directory": [],
    "hardware": ["perangkat keras"],
    "software installation": ["instalasi perangkat lunak"],
    "office 365": ["microsoft 365"],
    "microsoft office": ["ms office", "office suite"],
    "microsoft word": ["ms word"],
    "microsoft powerpoint": ["ms powerpoint", "powerpoint"],
    "google workspace": ["g suite", "google workspace"],

    # ---------------- Keuangan & Akuntansi ----------------
    "accounting": ["akuntansi", "akunting", "pembukuan"],
    "bookkeeping": ["pembukuan harian"],
    "financial reporting": ["pelaporan keuangan", "laporan keuangan"],
    "financial analysis": ["analisis keuangan", "analisa keuangan"],
    "auditing": ["audit", "internal audit", "audit internal"],
    "tax": ["taxation", "perpajakan", "pajak"],
    "payroll": ["penggajian", "gaji"],
    "budgeting": ["penganggaran", "anggaran", "budget"],
    "investment": ["investasi", "investment analysis"],
    "banking": ["perbankan", "bank"],
    "risk management": ["manajemen risiko", "manajemen resiko"],
    "insurance": ["asuransi"],
    "credit analysis": ["analisis kredit"],
    "reconciliation": ["rekonsiliasi", "bank reconciliation", "rekonsiliasi bank"],
    "general ledger": ["buku besar"],
    "accounts payable": ["hutang usaha", "utang usaha"],
    "accounts receivable": ["piutang usaha", "piutang"],
    "cost accounting": ["akuntansi biaya"],
    "financial modeling": ["pemodelan keuangan"],
    "valuation": ["penilaian"],
    "cpa": ["certified public accountant"],
    "acca": [],
    "journal entries": ["jurnal"],
    "cash flow": ["arus kas", "cashflow"],

    # ---------------- Pemasaran & Penjualan ----------------
    "marketing": ["pemasaran", "marketing strategy"],
    "digital marketing": ["pemasaran digital"],
    "social media": ["media sosial", "social media management"],
    "content marketing": ["konten marketing", "content creation"],
    "email marketing": ["pemasaran email"],
    "copywriting": ["copy writer", "penulisan iklan"],
    "branding": ["brand management", "merek"],
    "market research": ["riset pasar", "research pasar"],
    "public relations": ["hubungan masyarakat", "humas", "pr"],
    "sales": ["penjualan", "selling"],
    "business development": ["pengembangan bisnis"],
    "negotiation": ["negosiasi", "negotiating"],
    "crm": ["customer relationship management"],
    "salesforce": [],
    "lead generation": ["generasi leads", "prospek"],
    "b2b sales": ["b2b"],
    "retail": ["ritel"],
    "e-commerce": ["ecommerce", "e commerce", "toko online"],
    "customer service": ["layanan pelanggan", "pelayanan pelanggan", "customer support"],
    "cold calling": ["telemarketing"],
    "account management": ["manajemen akun", "key account"],
    "advertising": ["periklanan", "iklan"],
    "campaign management": ["manajemen kampanye"],
    "google ads": ["adwords", "google adwords"],
    "facebook ads": ["meta ads"],
    "marketplace": ["shopee", "tokopedia"],
    "customer satisfaction": ["kepuasan pelanggan"],

    # ---------------- SDM ----------------
    "human resources": ["hr", "sdm", "sumber daya manusia", "kepegawaian"],
    "recruitment": ["rekrutmen", "rekrut", "talent acquisition"],
    "onboarding": ["orientasi karyawan"],
    "performance management": ["manajemen kinerja", "penilaian kinerja"],
    "employee relations": ["hubungan karyawan"],
    "training and development": ["pelatihan dan pengembangan", "training"],
    "compensation and benefits": ["kompensasi dan benefit"],
    "hris": [],
    "labor law": ["hukum ketenagakerjaan", "ketenagakerjaan"],

    # ---------------- Desain & Kreatif ----------------
    "graphic design": ["desain grafis", "desainer grafis"],
    "adobe photoshop": ["photoshop"],
    "adobe illustrator": ["illustrator"],
    "indesign": ["adobe indesign"],
    "sketch": [],
    "adobe xd": ["xd"],
    "canva": [],
    "video editing": ["editing video", "video editor"],
    "adobe premiere": ["premiere pro"],
    "after effects": ["adobe after effects"],
    "photography": ["fotografi", "fotografer"],
    "typography": ["tipografi"],
    "3d modeling": ["3d modelling", "pemodelan 3d"],
    "autocad": ["auto cad"],
    "solidworks": ["solid works"],
    "sketchup": ["sketch up"],
    "interior design": ["desain interior"],
    "fashion design": ["desain fashion", "tata busana"],
    "motion graphics": ["animasi"],
    "illustration": ["ilustrasi"],

    # ---------------- Teknik & Manufaktur ----------------
    "mechanical engineering": ["teknik mesin"],
    "civil engineering": ["teknik sipil"],
    "electrical engineering": ["teknik elektro"],
    "industrial engineering": ["teknik industri"],
    "cad": ["computer aided design"],
    "manufacturing": ["manufaktur", "produksi"],
    "quality control": ["kontrol kualitas", "qc"],
    "quality assurance": ["jaminan mutu", "qa"],
    "lean manufacturing": ["lean"],
    "six sigma": ["6 sigma"],
    "preventive maintenance": ["perawatan preventif", "maintenance"],
    "hvac": [],
    "plc": ["programmable logic controller"],
    "project management": ["manajemen proyek", "project manager"],
    "construction management": ["manajemen konstruksi"],
    "safety": ["k3", "keselamatan kerja", "safety management"],
    "iso 9001": ["iso"],
    "structural analysis": ["analisis struktur"],
    "supply chain": ["rantai pasok", "supply chain management"],
    "procurement": ["pengadaan", "purchasing"],
    "inventory management": ["manajemen inventaris", "persediaan", "stok"],
    "logistics": ["logistik"],
    "operations management": ["manajemen operasional"],
    "warehouse": ["gudang", "pergudangan"],
    "scheduling": ["penjadwalan"],
    "welding": ["las"],
    "machining": ["permesinan"],

    # ---------------- Kesehatan ----------------
    "nursing": ["keperawatan", "perawat"],
    "patient care": ["perawatan pasien"],
    "clinical": ["klinis"],
    "pharmacy": ["farmasi", "apoteker"],
    "medical records": ["rekam medis"],
    "healthcare administration": ["administrasi rumah sakit"],
    "first aid": ["pertolongan pertama", "p3k"],
    "bls": ["basic life support"],
    "icu": ["intensive care"],
    "surgery": ["bedah"],

    # ---------------- Pendidikan ----------------
    "teaching": ["mengajar", "guru", "pengajaran"],
    "curriculum development": ["pengembangan kurikulum"],
    "lesson planning": ["rencana pembelajaran", "rpp"],
    "classroom management": ["manajemen kelas"],
    "tutoring": ["les", "bimbingan belajar"],
    "assessment": ["asesmen", "penilaian"],
    "elearning": ["e-learning", "lms"],

    # ---------------- Kuliner & Hospitality ----------------
    "cooking": ["memasak", "culinary"],
    "chef": ["koki", "head chef", "sous chef"],
    "kitchen management": ["manajemen dapur"],
    "menu planning": ["perencanaan menu"],
    "food safety": ["keamanan pangan", "haccp"],
    "baking": ["pastry", "roti"],
    "barista": ["coffee"],
    "food cost": ["food and beverage cost"],
    "hotel management": ["perhotelan"],
    "housekeeping": ["tata graha"],
    "event planning": ["perencanaan acara", "event organizer"],
    "tourism": ["pariwisata"],

    # ---------------- Hukum ----------------
    "legal drafting": ["drafting kontrak", "perancangan kontrak"],
    "litigation": ["litigasi"],
    "contract law": ["hukum kontrak"],
    "compliance": ["kepatuhan", "kepatuhan regulasi"],
    "legal research": ["riset hukum"],

    # ---------------- Soft skills ----------------
    "communication": ["komunikasi", "communicating"],
    "leadership": ["kepemimpinan", "memimpin", "team lead"],
    "teamwork": ["kerja sama tim", "kerjasama tim", "kerja tim", "team work", "kolaborasi", "collaboration"],
    "problem solving": ["pemecahan masalah", "problem solver", "pemecah masalah"],
    "time management": ["manajemen waktu"],
    "adaptability": ["adaptif", "fleksibel", "flexibility"],
    "critical thinking": ["berpikir kritis"],
    "creativity": ["kreativitas", "kreatif"],
    "attention to detail": ["teliti", "ketelitian", "detail oriented"],
    "organization": ["organisasi", "terorganisir"],
    "multitasking": ["multi tasking"],
    "presentation": ["presentasi", "public speaking"],
    "writing": ["penulisan", "menulis", "technical writing"],
    "research": ["penelitian", "riset"],
    "analytical skills": ["analitis", "analytical thinking"],
    "decision making": ["pengambilan keputusan"],
    "conflict resolution": ["resolusi konflik"],
    "mentoring": ["membimbing", "coaching"],
    "strategic planning": ["perencanaan strategis"],
    "documentation": ["dokumentasi"],
    "reporting": ["pelaporan"],
    "data entry": ["input data"],
    "administration": ["administrasi", "administrative"],
    "translation": ["penerjemahan", "translator"],
    "english": ["bahasa inggris"],
    "bahasa indonesia": ["indonesian language"],
    "mandarin": ["chinese language"],
    "japanese": ["bahasa jepang"],

    # ---------------- Agrikultur & lainnya ----------------
    "agronomy": ["agronomi", "pertanian"],
    "horticulture": ["hortikultura"],
    "livestock": ["peternakan"],
    "farming": ["bertani", "tani"],
    "automotive": ["otomotif", "otomasi kendaraan"],
    "mechanic": ["mekanik"],
    "driving license": ["sim", "surat izin mengemudi"],
    "aviation": ["penerbangan"],
    "flight operations": ["operasi penerbangan"],
    "fitness training": ["kebugaran", "personal trainer"],
    "sports coaching": ["pelatih olahraga"],
    "nutrition": ["nutrisi", "gizi"],
}

# Skill yang terlalu umum muncul di CV apa pun -> tidak dipakai untuk rekomendasi
GENERIC_SKILLS = {
    "communication", "teamwork", "problem solving", "time management",
    "adaptability", "critical thinking", "creativity", "attention to detail",
    "organization", "multitasking", "leadership", "decision making",
    "english", "bahasa indonesia", "microsoft office", "administration",
}

SKILL_KEYS: list[str] = sorted(SKILLS.keys())
SKILL_INDEX: dict[str, int] = {s: i for i, s in enumerate(SKILL_KEYS)}


def _alias_pattern(alias: str) -> re.Pattern[str]:
    """Bangun regex toleran terhadap variasi spasi/pemisah.

    'node.js' cocok dengan 'node.js', 'nodejs', 'node js'.
    Menggunakan lookaround agar 'excel' tidak cocok dengan 'excellent'.
    """
    parts = [p for p in re.split(r"[\s\-_./]+", alias) if p]
    if not parts:
        return re.compile(r"(?!x)x")
    core = r"[\s\-_./]*".join(re.escape(p) for p in parts)
    return re.compile(rf"(?<![a-z0-9]){core}(?![a-z0-9])", re.IGNORECASE)


_PATTERNS: list[tuple[str, re.Pattern[str]]] = []
for _canonical, _aliases in SKILLS.items():
    for _a in {_canonical, _canonical.replace("-", " "), *_aliases}:
        _PATTERNS.append((_canonical, _alias_pattern(_a)))


def detect_skills(text: str) -> list[str]:
    """Kembalikan daftar skill kanonik yang terdeteksi, urut sesuai kamus."""
    lowered = " " + re.sub(r"\s+", " ", text.lower()) + " "
    found: set[str] = set()
    for canonical, pattern in _PATTERNS:
        if canonical in found:
            continue
        if pattern.search(lowered):
            found.add(canonical)
    return [s for s in SKILL_KEYS if s in found]


def skill_vector(text: str) -> list[int]:
    found = set(detect_skills(text))
    return [1 if s in found else 0 for s in SKILL_KEYS]
