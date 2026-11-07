# ResumeAI — AI Resume Analyzer & Career Recommendation

Aplikasi web yang menganalisis CV berbahasa Inggris, memberi skor kualitas 0–100, menunjukkan
kekurangan, dan merekomendasikan bidang pekerjaan yang paling sesuai. Seluruh analisis berjalan
lokal memakai model **TF-IDF + Multi-Layer Perceptron (MLPClassifier)**, tanpa LLM atau API AI
pihak ketiga.

Proyek mata kuliah Deep Learning — Kelompok Emcai. Laporan lengkap: [`Laporan.docx`](Laporan.docx).

---

## Struktur

Aplikasi terdiri dari tiga layanan yang berjalan terpisah:

```
Next.js 15 (port 3000)  ->  Express.js API (port 4000)  ->  FastAPI ML service (port 8001)
      antarmuka              auth, upload, riwayat             model TF-IDF + MLP
                                     |
                                 Supabase (opsional)
```

```
ResumeAI/
|-- apps/
|   |-- web/                  Next.js App Router + Tailwind CSS
|   `-- api/                  Express.js: auth, upload, penyimpanan, proxy ke ML service
|-- services/ml/              FastAPI + model
|   |-- model/                resume_analyzer_mlp.pkl (tidak disertakan di repo)
|   |-- src/                  analyzer, validate, scoring, skills, taxonomy, feedback
|   `-- scripts/              smoke_test.py, make_samples.py
|-- latih_model/              notebook pelatihan + artefak evaluasi + model card
|-- supabase/schema.sql       tabel, RLS, dan storage policy
`-- samples/                  contoh CV (DOCX) untuk demo
```

## Menjalankan (mode demo)

Prasyarat: Node.js 20+ dan Python 3.11 (model membutuhkan `scikit-learn==1.6.1`).

```powershell
# 1. Dependency ML service
cd services/ml
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ../..

# 2. Dependency web & API
npm --prefix apps/api install
npm --prefix apps/web install

# 3. Tiga terminal
npm run dev:ml     # FastAPI       :8001
npm run dev:api    # Express API   :4000
npm run dev:web    # Next.js       :3000
```

Buka <http://localhost:3000>. Tanpa konfigurasi Supabase, aplikasi otomatis berjalan di mode demo:
login dilewati dan data disimpan di `apps/api/data/`.

Uji cepat tanpa browser:

```powershell
npm run smoke:ml
curl.exe -s http://localhost:4000/api/health
```

Untuk mode produksi dengan Supabase, salin `.env.example` menjadi `.env` pada `apps/api` dan
`.env.local` pada `apps/web`, lalu jalankan `supabase/schema.sql` di SQL Editor Supabase.

## Model

Dataset: [Resume Dataset](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset)
(2.484 baris, 24 kelas profesi). Split dilakukan dengan pengelompokan near-duplicate agar tidak
ada CV yang hampir identik tersebar di data latih dan data uji.

Arsitektur: TF-IDF 10.000 fitur (unigram + bigram) -> Dense 256 (ReLU) -> Dense 24 (Softmax),
total 2.566.424 parameter. Optimizer Adam, learning rate 5e-4, batch 16, regularisasi L2
alpha 0,001, early stopping pada epoch 56.

Hasil pada test set (497 CV):

| Metrik | Nilai |
|---|---:|
| Accuracy (top-1) | 0,6680 |
| Accuracy (top-3) | 0,8773 |
| Macro precision | 0,6309 |
| Macro recall | 0,6199 |
| Macro F1 | 0,6154 |
| Weighted F1 | 0,6586 |
| Expected calibration error | 0,0586 |

Detail pelatihan, evaluasi, dan analisis kesalahan ada di [`latih_model/Latih_model.ipynb`](latih_model/Latih_model.ipynb)
dan [`latih_model/model/MODEL_CARD.md`](latih_model/model/MODEL_CARD.md).

Berkas model tidak disimpan di repositori. Untuk menjalankan aplikasi, latih ulang lewat notebook
lalu salin hasilnya:

```powershell
Copy-Item "latih_model\model\resume_analyzer_mlp_v2.pkl" `
          "services\ml\model\resume_analyzer_mlp.pkl"
```

## Batasan

- Hanya menerima CV berbahasa Inggris. CV berbahasa Indonesia ditolak oleh gate validasi karena
  kosakatanya tidak ada di vocabulary TF-IDF.
- Akurasi top-1 66,8% pada 24 kelas, sehingga antarmuka menampilkan lima kandidat dan menandai
  prediksi dengan keyakinan rendah.
- Probabilitas softmax tidak dikalibrasi sempurna; angka kecocokan dibaca sebagai skor relatif.
- Skor 0–100 adalah rubrik lima komponen, dan tiga rekomendasi profesi adalah gabungan
  probabilitas bidang (65%) dengan kecocokan skill (35%), bukan keluaran langsung jaringan saraf.
- Seluruh umpan balik dihasilkan dari aturan dan templat, bukan model generatif.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev:ml` | jalankan ML service di port 8001 |
| `npm run dev:api` | jalankan Express API di port 4000 |
| `npm run dev:web` | jalankan Next.js di port 3000 |
| `npm run smoke:ml` | uji analisis empat CV contoh lewat terminal |
| `npm run samples` | buat ulang berkas DOCX contoh |
| `npm run build:web` | build produksi frontend |
