# Panduan Deploy — ResumeAI

Arsitektur produksi:

```
Pengguna
   │
   ▼
Vercel (apps/web, Next.js 15)
   │  rewrite /api/*  ->  API_URL
   ▼
Modal: resumeai-api (Express, Node 22, serverless)
   │  ML_SERVICE_URL
   ▼
Modal: resumeai-ml (FastAPI + model .pkl, Python 3.11, serverless)
   │
   ▼
Supabase (Postgres + Storage)
```

| Komponen | Host | URL |
|---|---|---|
| Web | Vercel | `https://<project>.vercel.app` |
| API | Modal | `https://limvardo1--resumeai-api-server.us-east.modal.run` |
| ML | Modal | `https://limvardo1--resumeai-ml-api.us-east.modal.run` |
| Data | Supabase | project yang sudah dipakai saat pengembangan |

**Kenapa Modal?** Render, Northflank, dan Hugging Face Space semuanya meminta
kartu/PRO untuk free tier. Modal mendaftar cukup dengan GitHub, tanpa kartu,
dan memberi kredit **$30/bulan**. Karena serverless, biaya hanya dihitung saat
ada request; proyek ini memakai jauh di bawah $1/bulan.

Dockerfile di `services/ml` dan `apps/api` tetap dipertahankan agar mudah
pindah ke host lain (Render/Leapcell/VPS) tanpa mengubah kode.

## 0. Prasyarat

- Akun Modal (login GitHub): `https://modal.com/signup`
- Akun Vercel
- Project Supabase dengan `supabase/schema.sql` sudah dijalankan
- Python 3.11 lokal untuk menjalankan CLI Modal
- Release `v2.0-model` berisi `resume_analyzer_mlp_v2.pkl` (56,7 MB)

```powershell
python -m pip install modal
python -m modal setup          # login lewat browser
```

## 1. Deploy ML

Dari root repo:

```powershell
python -m modal deploy deploy/modal/ml_app.py
```

Build pertama ±5–8 menit (scikit-learn + unduh model dari Release). Hasilnya URL
seperti `https://limvardo1--resumeai-ml-api.us-east.modal.run`.

Uji:

```
<url-ml>/livez    -> {"status":"ok"}
<url-ml>/health   -> {"status":"ok","model_version":"mlp-tfidf-256-v2","classes":24}
```

## 2. Buat secret API

Secret berisi kredensial Supabase + URL ML. Nilainya diambil dari
`apps/api/.env` (jangan commit file itu).

```powershell
python -m modal secret create resumeai-api --from-dotenv <file.env> --force
```

Isi `<file.env>` minimal:

```
SUPABASE_URL=https://ofiwfjwuhszqqszhdjkr.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ML_SERVICE_URL=https://limvardo1--resumeai-ml-api.us-east.modal.run
WEB_ORIGIN=https://<project>.vercel.app
```

`PORT`, `MAX_FILE_MB`, dan `SUPABASE_BUCKET` sudah diatur di
`deploy/modal/api_app.py`, jadi tidak perlu dimasukkan ke secret.

## 3. Deploy API

```powershell
python -m modal deploy deploy/modal/api_app.py
```

Uji:

```
<url-api>/api/livez    -> {"status":"ok"}
<url-api>/api/health   -> {"status":"ok","storage":"supabase","ml":{"status":"ok",...}}
```

Kalau `storage` bukan `supabase`, berarti secret belum terbaca.

## 4. Deploy web ke Vercel

1. `vercel.com` → **Add New → Project** → import `Limvardo1/Emcai_DL`.
2. **Root Directory**: `apps/web`.
3. **Settings → General → Node.js Version**: `22.x`.
4. **Environment Variables**:

| Key | Nilai |
|---|---|
| `API_URL` | `https://limvardo1--resumeai-api-server.us-east.modal.run` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ofiwfjwuhszqqszhdjkr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key dari `apps/web/.env.local` |

5. **Deploy**.
6. Supabase → **Authentication → URL Configuration**: **Site URL** = URL Vercel,
   **Redirect URLs** tambah `https://<project>.vercel.app/**`.

Catatan: `API_URL` dibaca **saat build** oleh `next.config.mjs`. Kalau URL API
berubah, ubah env lalu **Redeploy** — bukan sekadar restart.

## 5. Verifikasi

| Uji | Cara | Hasil yang diharapkan |
|---|---|---|
| ML hidup | `/livez` ML | `{"status":"ok"}` |
| ML siap | `/health` ML | 24 kelas, versi `mlp-tfidf-256-v2` |
| API hidup | `/api/livez` | `{"status":"ok"}` |
| API + Supabase | `/api/health` | `storage: supabase`, `ml.status: ok` |
| Web | URL Vercel | halaman unggah tampil |
| Alur penuh | login → unggah `samples/cv_data_analyst.docx` | skor 0–100 + rekomendasi |
| Riwayat | dashboard | CV muncul dan bisa dihapus |
| Supabase | tabel `resumes` | baris baru bertambah |

## 6. Perawatan

- **Cold start**: container berhenti setelah ±5 menit tanpa request
  (`scaledown_window=300`). Request berikutnya butuh 5–10 detik karena model
  56 MB dimuat ulang. Sebelum demo, buka `<url-ml>/health` sekali.
- **Redeploy ML**: `python -m modal deploy deploy/modal/ml_app.py`
- **Redeploy API**: `python -m modal deploy deploy/modal/api_app.py`
  (image di-cache, ±20 detik).
- **Ubah secret**: jalankan ulang `modal secret create resumeai-api ... --force`,
  lalu deploy ulang API agar container baru memakai nilainya.
- **Log**: `python -m modal app logs resumeai-ml` / `resumeai-api`.
- **Biaya**: lihat `https://modal.com/settings/usage`. Anggaran aman selama
  di bawah $30/bulan; turunkan `memory`/`cpu` di file deploy bila perlu.

## 7. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Function failed during startup` | import modul gagal di container | cek `modal app logs`, pastikan path lokal dibungkus `modal.is_local()` |
| `/health` 500 | model gagal dimuat | pastikan `scikit-learn==1.6.1` dan file model ada |
| API `storage: local` | secret tidak terbaca | buat ulang secret, deploy ulang API |
| `502`/timeout saat upload pertama | ML cold start | panggil `/health` ML dulu |
| Web memanggil URL salah | `API_URL` berubah setelah build | Redeploy Vercel |
| `An image tried to run a build step after add_local_*` | urutan build image | `add_local_dir(..., copy=True)` atau taruh `add_local_*` paling akhir |

## 8. Alternatif host

Kalau suatu saat ingin pindah:

| Host | Catatan |
|---|---|
| Leapcell Hobby | gratis tanpa kartu, tapi serverless dengan kuota 3 GB-jam/bulan; pakai Runtime + Build/Start Command (bukan Dockerfile) |
| Render | butuh kartu; `render.yaml` sudah dihapus dari repo |
| VPS / Docker | `docker build -f services/ml/Dockerfile` dan `docker build -f apps/api/Dockerfile` |

## 9. Biaya

- Vercel Hobby: Rp0
- Modal Starter: Rp0 (kredit $30/bulan; pemakaian proyek ini < $1/bulan)
- Supabase Free: Rp0
- GitHub: Rp0
