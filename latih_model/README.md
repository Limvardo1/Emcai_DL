# Latih Model — ResumeAI MLP v2

Folder ini berisi proses training ulang classifier CV ResumeAI. Model v2 sudah
dipromosikan ke aplikasi (`services/ml/model/resume_analyzer_mlp.pkl`). Model v1
tidak lagi disimpan di dalam folder proyek; arsipnya dipindahkan ke penyimpanan
eksternal agar repositori tetap ringan.

## Isi folder

| Path | Keterangan |
|---|---|
| `Latih_model.ipynb` | Notebook training lengkap (sudah dieksekusi, 15 code cell) |
| `model/resume_analyzer_mlp_v2.pkl` | Bundle model v2, kompatibel dengan `model_loader.py` |
| `model/MODEL_CARD.md` | Ringkasan model, metrik, dan keterbatasan |
| `artifacts/final_metrics.json` | Metrik final + konfigurasi + hash dataset |
| `artifacts/split_manifest.csv` | Pemetaan ID → grup → split (bukti anti-leakage) |
| `artifacts/random_search_results.csv` | Hasil 8 kandidat hyperparameter |
| `artifacts/learning_curve.csv` | Kurva pembelajaran |
| `artifacts/per_class_metrics.csv` | Precision/recall/F1 per kelas |
| `artifacts/classification_report.txt` | Classification report test |
| `artifacts/*.png` | EDA, learning curve, loss curve, confusion matrix, reliability diagram |
| `data/Resume.csv` | Salinan dataset Kaggle `snehaanbhawal/resume-dataset` |

## Cara menjalankan

Dari root proyek:

```powershell
.\services\ml\.venv\Scripts\jupyter-nbconvert.exe `
  --to notebook --execute --inplace `
  --ExecutePreprocessor.kernel_name=resumeai-ml `
  --ExecutePreprocessor.timeout=3600 `
  "latih_model\Latih_model.ipynb"
```

Atau buka `Latih_model.ipynb` di VS Code/Jupyter dan pilih kernel
**Python (ResumeAI ML venv)**.

## Protokol anti-leakage

1. Dedup baris identik.
2. Near-duplicate clustering (cosine char n-gram ≥ 0.90) → `group_id`.
3. `StratifiedGroupKFold(5)` → train 1.487 / validasi 497 / test 497.
4. Tidak ada grup yang muncul di dua split.
5. TF-IDF hanya di-fit di dalam `Pipeline` pada train.
6. Hyperparameter dipilih hanya memakai validasi; test dievaluasi satu kali.

## Hasil

Model terpilih: `MLPClassifier(hidden_layer_sizes=(256,), alpha=0.001,
learning_rate_init=0.0005, batch_size=16, early_stopping=True)`.

| Metrik | Model lama (dilaporkan) | Model v2 — validasi | Model v2 — test (sealed) |
|---|---:|---:|---:|
| Accuracy | 0.6273 | 0.6881 | **0.6680** |
| Top-3 accuracy | 0.8043 | 0.8491 | **0.8773** |
| Precision macro | 0.5952 | 0.6939 | **0.6309** |
| Recall macro | 0.5975 | 0.6555 | **0.6199** |
| F1 macro | 0.5878 | 0.6531 | **0.6154** |
| F1 weighted | 0.6165 | 0.6769 | **0.6586** |

- ECE test (10 bin): **0.0586**
- Gap akurasi fit (train+val) vs test: **0.3053**
- Selisih akurasi validasi vs test: **0.0201** (test tidak lebih buruk dari validasi)

Catatan penting: model lama pernah dilatih pada seluruh `Resume.csv`. Jika model lama
diuji pada test split baru, ia mendapat accuracy 0.9296 — bukan karena lebih baik,
tetapi karena baris test tersebut sudah pernah dilihat saat training. Angka itu
**tidak sah** sebagai estimasi generalisasi. Model v2 tidak pernah melihat test.

## Promosi ke aplikasi

Model v2 sudah dipromosikan pada 7 November 2026:

```powershell
Copy-Item "latih_model\model\resume_analyzer_mlp_v2.pkl" `
          "services\ml\model\resume_analyzer_mlp.pkl"
```

`MODEL_VERSION` di `services/ml/src/config.py` sudah menjadi `mlp-tfidf-256-v2`.

### Rollback ke model lama

Model v1 tidak lagi berada di dalam folder proyek. Salin berkas arsip
`resume_analyzer_mlp_v1.pkl` dari lokasi penyimpanan eksternal ke:

```powershell
Copy-Item "<lokasi-arsip>\resume_analyzer_mlp_v1.pkl" `
          "services\ml\model\resume_analyzer_mlp.pkl"
```

Lalu kembalikan `MODEL_VERSION` ke `mlp-tfidf-256-128-v1` dan restart ML service.
