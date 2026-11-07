'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const FAMILY_OF = {
  ACCOUNTANT: 'Accounting & Finance',
  FINANCE: 'Accounting & Finance',
  BANKING: 'Accounting & Finance',
  ADVOCATE: 'Legal & Compliance',
  AGRICULTURE: 'Agriculture',
  APPAREL: 'Design & Creative',
  ARTS: 'Design & Creative',
  AUTOMOBILE: 'Automotive & Aviation',
  AVIATION: 'Automotive & Aviation',
  BPO: 'Customer Service & BPO',
  'BUSINESS-DEVELOPMENT': 'Sales & Business Dev',
  SALES: 'Sales & Business Dev',
  CHEF: 'Culinary & Hospitality',
  CONSTRUCTION: 'Engineering & Manufacturing',
  CONSULTANT: 'Consulting & Strategy',
  DESIGNER: 'Design & Creative',
  'DIGITAL-MEDIA': 'Marketing & Digital',
  ENGINEERING: 'Engineering & Manufacturing',
  FITNESS: 'Healthcare & Wellness',
  HEALTHCARE: 'Healthcare & Wellness',
  HR: 'Human Resources',
  'INFORMATION-TECHNOLOGY': 'Software & IT',
  'PUBLIC-RELATIONS': 'Marketing & Digital',
  TEACHER: 'Education',
};

function Sparkline({ values = [] }) {
  if (values.length < 2) return null;
  const width = 320;
  const height = 72;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const RUBRIC = [
  ['Keyakinan model', '25', 'Probabilitas tertinggi MLP, diskalakan dari rentang 0.15–1.0', 'MLP'],
  ['Kecocokan skill', '25', 'Skill CV yang beririsan dengan 8 skill kunci role terdeteksi', 'Kamus skill'],
  ['Keyword ATS', '20', 'Rasio kata CV yang ada di vocabulary TF-IDF', 'TF-IDF'],
  ['Kelengkapan bagian', '15', 'Contact, Summary, Experience, Education, Skills (3 poin masing-masing)', 'Regex'],
  ['Kualitas tulisan', '15', 'Action verb (5) + bullet poin (5) + panjang 250–900 kata (5)', 'Regex'],
];

export default function AboutModelPage() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .model()
      .then(setInfo)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const metrics = info?.metrics || {};
  const percent = (value) => (typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </span>
            <span className="text-base font-semibold tracking-tight">
              Resume<span className="text-brand-600">AI</span>
            </span>
          </Link>
          <div className="flex gap-2">
            <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
            <Link href="/upload" className="btn-primary">Unggah CV</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tentang model
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            ResumeAI memakai satu jaringan saraf <strong>Multi-Layer Perceptron</strong> di atas
            fitur <strong>TF-IDF</strong>. Tidak ada LLM, tidak ada API pihak ketiga — seluruh
            prediksi berjalan lokal dan deterministik.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error} Pastikan service ML berjalan di port 8001.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Akurasi (top-1)" value={percent(metrics.accuracy)} hint="24 kelas, test set" />
          <MetricCard label="Akurasi top-3" value={percent(metrics.top3_accuracy)} hint="peluang jawaban benar ada di 3 teratas" />
          <MetricCard label="Macro F1" value={percent(metrics.f1_macro)} hint="dirata-rata per kelas" />
          <MetricCard label="Precision (macro)" value={percent(metrics.precision_macro)} />
          <MetricCard label="Recall (macro)" value={percent(metrics.recall_macro)} />
          <MetricCard label="F1 weighted" value={percent(metrics.f1_weighted)} hint="terbobot jumlah sampel" />
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900">Arsitektur</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Input', 'Teks CV (bahasa Inggris)'],
              ['Fitur', `TF-IDF · ${info?.vocabulary_size?.toLocaleString('id-ID') ?? '—'} term`],
              [
                'MLP',
                info?.hidden_layer_sizes?.length
                  ? `hidden ${info.hidden_layer_sizes.join(' → ')} · ${info.activation ?? 'relu'}`
                  : '—',
              ],
            ].map(([label, value], index) => (
              <div key={label} className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {index + 1}. {label}
                </p>
                <p className="mt-1 text-sm text-slate-700">{value}</p>
              </div>
            ))}
          </div>          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Kelas output</dt>
                <dd className="font-medium text-slate-800">{info?.n_classes ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Solver</dt>
                <dd className="text-slate-800">{info?.solver ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Alpha (L2)</dt>
                <dd className="tabular-nums text-slate-800">{info?.alpha ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Learning rate awal</dt>
                <dd className="tabular-nums text-slate-800">{info?.learning_rate_init ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Epoch terlatih</dt>
                <dd className="tabular-nums text-slate-800">{info?.n_iter ?? '—'}</dd>
              </div>
            </dl>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kurva loss training
              </p>
              <Sparkline values={info?.loss_curve || []} />
              <p className="text-xs text-slate-500">
                Loss menurun konsisten; tidak ada divergensi.
              </p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900">Rubrik skor 0–100</h2>
          <p className="mt-1 text-xs text-slate-500">
            Skor adalah rubrik deterministik, bukan output jaringan saraf. Hanya komponen
            keyakinan yang berasal dari model.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Komponen</th>
                  <th className="px-3 py-2 font-medium">Bobot</th>
                  <th className="px-3 py-2 font-medium">Dasar perhitungan</th>
                  <th className="px-3 py-2 font-medium">Sumber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RUBRIC.map(([name, weight, basis, source]) => (
                  <tr key={name}>
                    <td className="px-3 py-2 font-medium text-slate-800">{name}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">{weight}</td>
                    <td className="px-3 py-2 text-slate-600">{basis}</td>
                    <td className="px-3 py-2 text-slate-500">{source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900">24 kelas model dan pemetaannya</h2>
          <p className="mt-1 text-xs text-slate-500">
            Label mentah dataset dipetakan ke keluarga karier agar mudah dibaca.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(info?.classes || Object.keys(FAMILY_OF)).map((name) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <span className="truncate text-xs font-medium text-slate-700">{name}</span>
                <span className="shrink-0 text-xs text-slate-500">{FAMILY_OF[name] || '—'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-sm font-semibold text-amber-900">Batasan yang jujur</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-amber-800">
            <li>
              Model dilatih pada 2.481 CV berbahasa Inggris dengan 24 kategori. Akurasi top-1
              {` ${percent(metrics.accuracy)}`} berarti sekitar 1 dari 3 prediksi peringkat pertama
              bisa keliru — karena itu sistem menampilkan top-3 dan skor kemiripan.
            </li>
            <li>
              CV berbahasa Indonesia ditolak. Kata-kata Indonesia tidak ada di vocabulary TF-IDF,
              sehingga prediksi akan acak.
            </li>
            <li>
              Kelas <em>ENGINEERING</em> pada dataset menyerap banyak CV software engineer. Lapisan
              taksonomi memperbaikinya dengan job title dan skill, dan prediksi mentah tetap
              ditampilkan untuk transparansi.
            </li>
            <li>
              Probabilitas softmax tidak dikalibrasi, jadi angka kecocokan dibaca sebagai skor
              kemiripan relatif, bukan peluang kebenaran.
            </li>
          </ul>
        </section>

        <div className="flex justify-center pb-4">
          <Link href="/upload" className="btn-primary px-6">
            Coba analisis CV Anda
          </Link>
        </div>
      </main>
    </div>
  );
}
