# Panduan Deploy — ResumeAI

Arsitektur produksi:

```
Pengguna
   │
   ▼
Vercel (apps/web, Next.js 15)
   │  rewrite /api/*  ->  API_URL
   ▼
Leapcell: emcai-api (Express, Node 22, serverless)
   │  ML_SERVICE_URL
   ▼
Leapcell: emcai-ml (FastAPI + model .pkl, Python, serverless)
   │
   ▼
Supabase (Postgres + Storage)
```

| Komponen | Host | Plan |
|---|---|---|
| Web | Vercel | Hobby (Rp0) |
| API | Leapcell | Hobby (Rp0) |
| ML | Leapcell | Hobby (Rp0) |
| Data | Supabase | Free (Rp0) |

**Kenapa bukan Render / Hugging Face / Northflank?**

| Platform | Alasan tidak dipakai |
|---|---|
| Render | pendaftaran free tier meminta kartu kredit |
| Hugging Face Space | Docker Space gratis sekarang wajib PRO (HTTP 402) |
| Northflank | "No card needed" di halaman harga, tetapi dokumentasi billing menyatakan **semua** pengguna wajib menambah metode pembayaran |
| Koyeb | tidak ada free tier |

Leapcell Hobby tidak meminta kartu dan mendukung Python + Node langsung dari
GitHub. Dockerfile di repo tetap dipertahankan agar mudah pindah host lain.

## 0. Prasyarat

- Repo GitHub: `https://github.com/Limvardo1/Emcai_DL` (branch `main`)
- Akun Leapcell (login GitHub): `https://leapcell.io/signup`
- Akun Vercel
- Project Supabase dengan `supabase/schema.sql` sudah dijalankan
- Release `v2.0-model` berisi `resume_analyzer_mlp_v2.pkl` (56,7 MB)

Model tidak disimpan di git. Dockerfile dan build command Leapcell sama-sama
mengunduhnya dari:

```
https://github.com/Limvardo1/Emcai_DL/releases/download/v2.0-model/resume_analyzer_mlp_v2.pkl
```

## 1. Deploy ML ke Leapcell

1. Buka `https://leapcell.io/dashboard` → **New Service** → **Connect to GitHub**
   → izinkan repo `Limvardo1/Emcai_DL`.
2. Pilih repo `Limvardo1/Emcai_DL`, branch `main`.
3. Isi form:

| Field | Nilai |
|---|---|
| Service name | `emcai-ml` |
| Root Directory | `services/ml` |
| Runtime | Python (pilih 3.11 bila tersedia) |
| Memory | `1024 MB` |
| Port | `8080` |
| Region | Asia / Singapore (bila tersedia) |

4. **Build Command** (satu baris, tempel apa adanya):

```bash
pip install -r requirements.txt && python -c "import urllib.request,os; os.makedirs('model',exist_ok=True); r=urllib.request.Request('https://github.com/Limvardo1/Emcai_DL/releases/download/v2.0-model/resume_analyzer_mlp_v2.pkl',headers={'User-Agent':'resumeai-build'}); open('model/resume_analyzer_mlp.pkl','wb').write(urllib.request.urlopen(r,timeout=300).read()); assert os.path.getsize('model/resume_analyzer_mlp.pkl')>50000000, 'model terpotong'"
```

5. **Start Command**:

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8080
```

6. **Environment Variables**: tidak ada yang wajib. (Opsional: `MAX_FILE_MB=5`.)
7. **Deploy** dan tunggu build ±3–6 menit (instal scikit-learn + unduh model).
8. Setelah status **Running**, catat domain yang diberikan, misalnya
   `https://emcai-ml-xxxx.leapcell.dev`. Uji:

```
https://<domain-ml>/kaithhealth   -> {"status":"ok"}
https://<domain-ml>/health        -> {"status":"ok","model_version":"mlp-tfidf-256-v2","classes":24}
```

`/health` pertama kali terasa lambat (±5 detik) karena model dimuat ke memori.

## 2. Deploy API ke Leapcell

1. **New Service** lagi, repo dan branch sama.
2. Isi form:

| Field | Nilai |
|---|---|
| Service name | `emcai-api` |
| Root Directory | `apps/api` |
| Runtime | Node.js (pilih 22 atau lebih baru) |
| Memory | `512 MB` |
| Port | `8080` |
| Region | Asia / Singapore (bila tersedia) |

3. **Build Command**: `npm ci --omit=dev`
4. **Start Command**: `node src/index.js`
5. **Environment Variables**:

| Key | Nilai |
|---|---|
| `PORT` | `8080` |
| `SUPABASE_URL` | `https://ofiwfjwuhszqqszhdjkr.supabase.co` |
| `SUPABASE_ANON_KEY` | dari `apps/api/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | dari `apps/api/.env` (secret, jangan dibagikan) |
| `SUPABASE_BUCKET` | `resumes` |
| `MAX_FILE_MB` | `5` |
| `ML_SERVICE_URL` | domain ML dari langkah 1, **tanpa** garis miring di akhir |
| `WEB_ORIGIN` | `http://localhost:3000` dulu, ganti setelah Vercel jadi |

`DEMO_MODE` **jangan** diisi, agar API memakai Supabase, bukan penyimpanan lokal.

6. **Deploy**, lalu uji:

```
https://<domain-api>/api/livez   -> {"status":"ok"}
https://<domain-api>/api/health  -> {"status":"ok","storage":"supabase","ml":{"status":"ok",...}}
```

Kalau `storage` masih `local` atau `ml.status` bukan `ok`, cek Environment Variables.

## 3. Deploy web ke Vercel

1. `vercel.com` → **Add New → Project** → import `Limvardo1/Emcai_DL`.
2. **Root Directory**: `apps/web`.
3. **Settings → General → Node.js Version**: `22.x`
   (`@supabase/supabase-js` meminta Node ≥ 22).
4. **Environment Variables**:

| Key | Nilai |
|---|---|
| `API_URL` | `https://<domain-api>` (tanpa `/api`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ofiwfjwuhszqqszhdjkr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key dari `apps/web/.env.local` |

5. **Deploy**.
6. Di Supabase → **Authentication → URL Configuration**, isi **Site URL**
   dengan URL Vercel dan tambahkan `https://<project>.vercel.app/**` ke
   **Redirect URLs**, agar tautan konfirmasi email tidak kembali ke localhost.
7. Kembali ke Leapcell → `emcai-api` → **Environment** → ubah `WEB_ORIGIN`
   menjadi `https://<project>.vercel.app`. Perubahan env langsung berlaku.

Catatan: `API_URL` dibaca **saat build** oleh `next.config.mjs`. Kalau URL API
berubah, ubah env lalu **Redeploy** di Vercel — bukan sekadar restart.

## 4. Verifikasi

| Uji | Cara | Hasil yang diharapkan |
|---|---|---|
| ML hidup | `/kaithhealth` ML | `{"status":"ok"}` |
| ML siap | `/health` ML | `model_version: mlp-tfidf-256-v2`, 24 kelas |
| API hidup | `/api/livez` | `{"status":"ok"}` |
| API + Supabase | `/api/health` | `storage: supabase`, `ml.status: ok` |
| Web | URL Vercel | halaman unggah tampil |
| Alur penuh | login → unggah `samples/cv_data_analyst.docx` | skor 0–100 + rekomendasi |
| Riwayat | dashboard | CV muncul dan bisa dihapus |
| Supabase | tabel `resumes` | baris baru bertambah |

## 5. Kuota & perawatan

- Leapcell Hobby (gratis, tanpa kartu):
  - **3 GB-jam/bulan** total compute serverless (dihitung hanya saat ada request,
    jadi puluhan unggahan CV masih jauh di bawah kuota),
  - **60 menit build/bulan**, maksimal **10 menit per build**,
  - 100.000 invokasi/bulan, payload ≤ 100 MB, timeout 900 detik.
- Service serverless **tidur setelah ±30 menit** tanpa trafik. Request berikutnya
  melakukan cold start beberapa detik (model 56,7 MB dimuat ulang). Sebelum demo,
  buka `/health` ML sekali untuk memanaskan service.
- **Redeploy**: push ke `main` memicu auto-deploy, atau **Manual Deploy** di dashboard.
- **Ubah env**: Leapcell → service → **Environment** (langsung berlaku).
- Filesystem hanya `/tmp` yang bisa ditulis; karena itu berkas CV disimpan di
  Supabase Storage, bukan di disk service.

## 6. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Build ML gagal `model terpotong` | unduhan dari Release terputus | **Redeploy**; cek URL Release masih aktif |
| Build gagal `No matching distribution` (numpy) | Runtime Python 3.13 tanpa wheel | pilih Python 3.11/3.12, atau pastikan `numpy==2.1.3` |
| `/health` 500 | model gagal dimuat | pastikan `scikit-learn==1.6.1` dan file model ada |
| API `storage: local` | `SUPABASE_URL`/service key kosong | isi Environment, deploy ulang |
| Upload pertama 503 | ML masih cold start | buka `/health` ML dulu, lalu ulangi |
| Web memanggil URL salah | `API_URL` berubah setelah build | Redeploy Vercel |
| CORS | `WEB_ORIGIN` belum diisi | isi dengan URL Vercel |
| 429 dari Leapcell | kuota bulanan habis | tunggu bulan berikutnya / kurangi build |

## 7. Kalau Leapcell meminta kartu

Beberapa akun kadang diminta verifikasi tambahan. Kalau itu terjadi, jangan
lanjutkan — alternatif tanpa kartu yang sudah disiapkan: **Modal**
(`modal.com`, Starter $0 dengan kredit $30/bulan), yang bisa menjalankan
FastAPI langsung dari requirements yang sama. Kabari saja, konfigurasinya
akan dibuatkan.
