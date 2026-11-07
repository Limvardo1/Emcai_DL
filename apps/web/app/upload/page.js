'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import UploadDropzone from '@/components/UploadDropzone';
import { api } from '@/lib/api';

const REQUIREMENTS = [
  'CV ditulis dalam bahasa Inggris',
  'Minimal 120 kata',
  'Ada bagian Skills dengan nama keahlian eksplisit',
  'PDF/DOCX berbasis teks (bukan hasil scan)',
  'Ukuran maksimal 5 MB',
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setReasons([]);

    try {
      const result = await api.uploadResume(file);
      router.push(`/dashboard/${result.resume.id}`);
    } catch (requestError) {
      const payloadReasons = requestError.payload?.reasons;
      if (Array.isArray(payloadReasons) && payloadReasons.length) {
        setReasons(payloadReasons);
      } else {
        setError(requestError.message);
      }
      setLoading(false);
    }
  }

  return (
    <AppShell title="Unggah CV" subtitle="Analisis CV berbahasa Inggris dengan model MLP">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900">Persyaratan CV</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {REQUIREMENTS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m6 10 2.5 2.5L14 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            Model dilatih pada CV berbahasa Inggris. CV berbahasa Indonesia akan ditolak agar Anda
            tidak menerima rekomendasi yang salah. Butuh contoh? Unduh{' '}
            <a
              href="/samples/cv_software_engineer.docx"
              className="font-semibold text-brand-600 hover:text-brand-700"
              download
            >
              CV contoh (DOCX)
            </a>
            .
          </p>
        </section>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <UploadDropzone file={file} onSelect={setFile} disabled={loading} />

          {reasons.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">CV belum bisa dianalisis</p>
              <ul className="mt-2 space-y-1.5">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm text-rose-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Analisis berjalan lokal dan biasanya selesai dalam hitungan detik.
            </p>
            <button type="submit" disabled={!file || loading} className="btn-primary">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menganalisis…
                </>
              ) : (
                'Analisis CV'
              )}
            </button>
          </div>

          {loading && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-4">
              {['Mengekstrak teks CV', 'Memvalidasi kualitas input', 'Menjalankan model MLP', 'Menyusun rekomendasi'].map(
                (step, index) => (
                  <div key={step} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-500"
                      style={{ opacity: 1 - index * 0.2 }}
                    />
                    {step}
                  </div>
                ),
              )}
            </div>
          )}
        </form>

        <p className="text-center text-xs text-slate-500">
          Ingin tahu bagaimana skor dihitung?{' '}
          <Link href="/about-model" className="font-semibold text-brand-600 hover:text-brand-700">
            Baca detail model
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
