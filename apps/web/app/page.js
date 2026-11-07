import Link from "next/link";

const FEATURES = [
  {
    title: "Ekstraksi teks otomatis",
    body: "Unggah PDF atau DOCX, sistem membaca isi CV dan menyimpannya ke storage dengan aman.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z",
  },
  {
    title: "Skor CV 0–100",
    body: "Lima komponen terukur: keyakinan model, kecocokan skill, keyword ATS, kelengkapan bagian, dan kualitas tulisan.",
    icon: "M12 20V10m0 0V4m0 6-4-4m4 4 4-4M4 20h16",
  },
  {
    title: "Rekomendasi karier",
    body: "Model MLP memetakan CV ke 24 kategori profesi, lalu dirapikan menjadi keluarga karier dengan persentase kecocokan.",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a1 1 0 0 0 1-1V7H4v13a1 1 0 0 0 1 1Z",
  },
  {
    title: "Riwayat & dashboard",
    body: "Semua CV yang pernah dianalisis tersimpan, lengkap dengan skor, role, dan saran perbaikan.",
    icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Unggah CV",
    body: "Pastikan CV berbahasa Inggris, minimal 120 kata, dan punya bagian Skills yang eksplisit.",
  },
  {
    step: "02",
    title: "Analisis otomatis",
    body: "Service ML mengekstrak teks, memvalidasi kualitas input, lalu menjalankan TF-IDF + MLP.",
  },
  {
    step: "03",
    title: "Baca hasilnya",
    body: "Lihat skor, tiga rekomendasi karier teratas, skill yang kurang, dan saran perbaikan konkret.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </span>
            <span className="text-base font-semibold tracking-tight">
              Resume<span className="text-brand-600">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-slate-900">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-slate-900">
              Cara kerja
            </a>
            <Link href="/about-model" className="hover:text-slate-900">
              Tentang model
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              Masuk
            </Link>
            <Link href="/upload" className="btn-primary">
              Mulai analisis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,#eef2ff_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Analisis CV Anda, temukan karier yang{" "}
              <span className="text-brand-600">paling cocok</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              ResumeAI memberi skor kualitas CV, menunjukkan kekurangan yang
              sering dilewatkan, dan merekomendasikan bidang pekerjaan
              berdasarkan keahlian yang benar-benar tertulis di CV Anda.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/upload"
                className="btn-primary w-full px-6 sm:w-auto"
              >
                Unggah CV sekarang
              </Link>
              <Link
                href="/about-model"
                className="btn-secondary w-full px-6 sm:w-auto"
              >
                Lihat cara model bekerja
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              CV berbahasa Inggris · PDF/DOCX · maksimal 5 MB
            </p>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["24", "kategori profesi"],
              ["297", "skill dikenali"],
              ["87.7%", "akurasi top-3"],
              ["5", "komponen skor"],
            ].map(([value, label]) => (
              <div key={label} className="card px-4 py-5 text-center">
                <dt className="text-2xl font-bold text-slate-900">{value}</dt>
                <dd className="mt-1 text-xs text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section
        id="fitur"
        className="border-t border-slate-100 bg-slate-50/60 py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Empat fitur utama
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Semuanya berjalan lokal di mesin Anda: tidak ada data CV yang
              dikirim ke layanan AI pihak ketiga.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                  >
                    <path
                      d={feature.icon}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="cara-kerja" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cara kerjanya
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="card p-6">
                <span className="text-sm font-bold text-brand-600">
                  {item.step}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Batasan yang perlu diketahui
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Model dilatih pada CV berbahasa Inggris. CV berbahasa Indonesia
                akan ditolak dengan pesan yang jelas, bukan dianalisis
                asal-asalan.
              </p>
            </div>
            <Link
              href="/about-model"
              className="btn-secondary shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              Detail model
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>ResumeAI — proyek Deep Learning. Model: TF-IDF + MLPClassifier.</p>
          <p>Next.js · Express · FastAPI · Supabase</p>
        </div>
      </footer>
    </div>
  );
}
