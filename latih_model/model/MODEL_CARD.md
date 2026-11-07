# Model Card — ResumeAI MLP v2

## Ringkasan

- **Algoritma**: TF-IDF (10.000 fitur, unigram+bigram) + MLPClassifier
- **Arsitektur**: (256,)
- **Regularisasi alpha**: 0.001
- **Batch size**: 16
- **Learning rate**: 0.0005
- **Early stopping**: ya (validation_fraction=0.1, n_iter_no_change=10)
- **Jumlah kelas**: 24
- **Seed**: 42

## Data

- Sumber: kaggle:snehaanbhawal/resume-dataset
- SHA-256: `816a7cd985a9a41e3ce8d1e83cb7e1beb1e854a89c1cf1fd0d75494faaa0559d`
- Baris setelah cleaning: 2481
- Split: train 1487 / validasi 497 / test 497
- Near-duplicate threshold: 0.9

## Hasil

| Metrik | Validasi (out-of-sample) | Test (sealed) |
|---|---:|---:|
| Accuracy | 0.6881 | 0.6680 |
| Top-3 accuracy | 0.8491 | 0.8773 |
| Precision macro | 0.6939 | 0.6309 |
| Recall macro | 0.6555 | 0.6199 |
| F1 macro | 0.6531 | 0.6154 |
| F1 weighted | 0.6769 | 0.6586 |

- ECE test (10 bin): 0.0586
- Mean confidence test: 0.6762
- Gap akurasi fit vs test: 0.3053

## Keterbatasan

- Dataset berbahasa Inggris; CV berbahasa Indonesia akan memiliki rasio token
  in-vocabulary lebih rendah. Aplikasi sudah punya gate validasi untuk kasus ini.
- Kelas minoritas (`BPO`, `AUTOMOBILE`, `AGRICULTURE`) memiliki F1 lebih rendah.
- Probabilitas model tidak dikalibrasi ulang (ECE dilaporkan apa adanya).
- Model memakai TF-IDF, bukan embedding semantik; parafrase yang tidak berbagi
  token bisa salah klasifikasi.

## Cara memakai

Model ini sudah menggantikan model aplikasi sejak 7 November 2026:

```powershell
Copy-Item "latih_model\model\resume_analyzer_mlp_v2.pkl" "services\ml\model\resume_analyzer_mlp.pkl"
```

`MODEL_VERSION` di `services/ml/src/config.py` sudah menjadi `mlp-tfidf-256-v2`.
Model lama (v1) tidak lagi disimpan di dalam folder proyek; arsipnya dipindahkan ke
penyimpanan eksternal. Instruksi rollback ada di `latih_model/README.md`.
