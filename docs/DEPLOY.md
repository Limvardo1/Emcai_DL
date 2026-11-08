# Panduan Deploy — ResumeAI

Arsitektur produksi:

```
Pengguna
   │
   ▼
Vercel (apps/web, Next.js 15)
   │  rewrite /api/*  ->  API_URL
   ▼
Render: resumeai-api (Express, Docker)
   │  ML_SERVICE_URL
   ▼
Render: resumeai-ml (FastAPI + model .pkl, Docker)
   │
   ▼
Supabase (Postgres + Storage)
```

| Komponen | Host | URL |
|---|---|---|
| Web | Vercel | `https://<project>.vercel.app` |
| API | Render | `https://emcai-resumeai-api.onrender.com` |
| ML | Render | `https://emcai-resumeai-ml.onrender.com` |
| Data | Supabase | project yang sudah dipakai saat pengembangan |

## 0. Prasyarat

- Repo GitHub: `https://github.com/Limvardo1/Emcai_DL`
- Akun Render (login GitHub)
- Akun Vercel (login GitHub)
- Project Supabase dengan `supabase/schema.sql` sudah dijalankan
- **Release `v2.0-model`** berisi `resume_analyzer_mlp_v2.pkl` (56,7 MB)

Release wajib ada sebelum deploy, karena Dockerfile ML mengunduh model dari:

```
https://github.com/Limvardo1/Emcai_DL/releases/download/v2.0-model/resume_analyzer_mlp_v2.pkl
```

Cara membuat: repo GitHub → **Releases** → **Draft a new release** → tag
`v2.0-model` → unggah `latih_model/model/resume_analyzer_mlp_v2.pkl` →
**Publish release**.

## 1. Deploy backend ke Render

Blueprint `render.yaml` sudah ada di root repo dan membuat dua service sekaligus.

1. Buka `dashboard.render.com` → **New +** → **Blueprint**.
2. Hubungkan akun GitHub dan pilih repo `Limvardo1/Emcai_DL`.
3. Render membaca `render.yaml`; tekan **Apply**.
4. Saat diminta, isi nilai untuk variabel bertanda `sync: false`:

| Service | Key | Nilai |
|---|---|---|
| API | `SUPABASE_URL` | dari `apps/api/.env` |
| API | `SUPABASE_ANON_KEY` | dari `apps/api/.env` |
| API | `SUPABASE_SERVICE_ROLE_KEY` | dari `apps/api/.env` |
| API | `WEB_ORIGIN` | `https://<project>.vercel.app` (boleh diisi belakangan) |

Nilai lain sudah diatur di blueprint: `SUPABASE_BUCKET=resumes`,
`MAX_FILE_MB=5`, `ML_SERVICE_URL=https://emcai-resumeai-ml.onrender.com`.

5. Tunggu build pertama: ML ±5–10 menit (scikit-learn + model 56,7 MB),
   API ±2 menit.

### Jika membuat manual (tanpa Blueprint)

| Isi | `emcai-resumeai-ml` | `emcai-resumeai-api` |
|---|---|---|
| Type | Web Service | Web Service |
| Runtime | Docker | Docker |
| Root Directory | `services/ml` | `apps/api` |
| Dockerfile Path | `Dockerfile` | `Dockerfile` |
| Region | Singapore | Singapore |
| Plan | Free | Free |
| Health Check | `/livez` | `/api/livez` |

## 2. Deploy web ke Vercel

1. Buka `vercel.com` → **Add New → Project** → import `Limvardo1/Emcai_DL`.
2. Pada **Root Directory**, pilih `apps/web`.
3. Framework terdeteksi **Next.js**; biarkan build command default.
4. Isi **Environment Variables**:

| Key | Nilai |
|---|---|
| `API_URL` | `https://emcai-resumeai-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | dari `apps/web/.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari `apps/web/.env.local` |

5. **Deploy**.

Catatan: `API_URL` dibaca **saat build** oleh `next.config.mjs`.
Kalau URL API berubah, ubah env lalu **Redeploy**, bukan hanya restart.

Setelah URL Vercel jadi, kembali ke Render → `emcai-resumeai-api` → Environment →
ubah `WEB_ORIGIN` menjadi URL Vercel tersebut.

## 3. Verifikasi

| Uji | Cara | Hasil yang diharapkan |
|---|---|---|
| ML hidup | `/livez` | `{"status":"ok"}` |
| ML siap | `/health` | `model_version: mlp-tfidf-256-v2` |
| API hidup | `/api/livez` | `{"status":"ok"}` |
| API + Supabase | `/api/health` | `storage: supabase`, `ml.status: ok` |
| Web | URL Vercel | halaman unggah tampil |
| Alur penuh | login → unggah CV | skor 0–100 + 3 rekomendasi |
| Riwayat | dashboard | CV muncul dan bisa dihapus |
| Supabase | tabel `resumes` | baris baru bertambah |

## 4. Perawatan

- **Service tidur setelah 15 menit** tanpa akses; bangunnya ±1 menit.
  Sebelum demo, buka `https://emcai-resumeai-ml.onrender.com/health` lalu tunggu.
- **750 jam instance/bulan** per workspace. Dua service yang hidup terus
  akan melewati kuota, jadi jangan pasang ping otomatis 24/7.
- **Redeploy**: push ke `main` (auto-deploy) atau **Manual Deploy** di Render.
- **Ubah env**: Render → service → Environment → Save (restart otomatis).

## 5. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Build ML gagal `HTTP 404` | Release `v2.0-model` belum ada / nama aset salah | buat Release sesuai nama di atas |
| Build ML gagal `model terlalu kecil` | unduhan terpotong | redeploy / cek URL Release |
| `/health` 500 | model gagal dimuat, versi scikit-learn beda | pastikan `scikit-learn==1.6.1` |
| API `storage: local` | `SUPABASE_URL`/service key kosong | isi env, restart |
| Upload pertama 503 | ML masih bangun (cold start) | buka `/health` ML dulu |
| Web memanggil URL salah | `API_URL` berubah setelah build | redeploy Vercel |
| CORS | `WEB_ORIGIN` belum diisi | isi dengan URL Vercel |

## 6. Biaya

- Render Free: Rp0 (0,1 CPU / 512 MB, tidur 15 menit, 750 jam/bulan)
- Vercel Hobby: Rp0 (proyek non-komersial)
- Supabase Free: Rp0
- GitHub: Rp0

> Catatan: Hugging Face Space tidak dipakai karena sejak 2026 Docker Space
> di akun gratis memerlukan langganan PRO.
