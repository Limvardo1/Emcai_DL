'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import CareerMatchList from '@/components/CareerMatchList';
import JobMatchList from '@/components/JobMatchList';
import ScoreGauge from '@/components/ScoreGauge';
import ScoreRadar from '@/components/ScoreRadar';
import SkillChips from '@/components/SkillChips';
import { api } from '@/lib/api';
import { BREAKDOWN_LABELS, formatBytes, formatDateTime, scoreTone } from '@/lib/format';

function FeedbackCard({ title, items, tone }) {
  const styles = {
    good: 'border-emerald-200 bg-emerald-50/40',
    bad: 'border-rose-200 bg-rose-50/40',
    idea: 'border-brand-200 bg-brand-50/40',
  };
  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  tone === 'good' ? 'bg-emerald-400' : tone === 'bad' ? 'bg-rose-400' : 'bg-brand-400'
                }`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Tidak ada catatan.</p>
      )}
    </div>
  );
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getResume(params.id)
      .then((data) => {
        if (active) setResume(data.resume);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleDelete() {
    if (!window.confirm('Hapus CV ini beserta hasil analisisnya?')) return;
    setDeleting(true);
    try {
      await api.deleteResume(params.id);
      router.push('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Hasil analisis" subtitle="Memuat…">
        <div className="space-y-4">
          <div className="skeleton h-28 w-full" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-72 lg:col-span-2" />
            <div className="skeleton h-72" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !resume) {
    return (
      <AppShell title="Hasil analisis">
        <div className="card p-8 text-center">
          <p className="text-sm text-rose-600">{error || 'CV tidak ditemukan.'}</p>
          <Link href="/dashboard" className="btn-secondary mt-4">
            Kembali ke dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const analysis = resume.analysis || {};
  const tone = scoreTone(analysis.overall_score ?? 0);

  return (
    <AppShell
      title={resume.file_name}
      subtitle={`Dianalisis ${formatDateTime(resume.created_at)}`}
      actions={
        <div className="flex items-center gap-2">
          {resume.file_url && (
            <a href={resume.file_url} target="_blank" rel="noreferrer" className="btn-secondary hidden sm:inline-flex">
              Unduh CV
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost text-rose-600 hover:bg-rose-50"
          >
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali ke dashboard
        </Link>

        {/* Header */}
        <section className="card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rekomendasi utama
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {analysis.predicted_role || '—'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {analysis.family_label || '—'} · keyakinan model{' '}
                {((analysis.confidence ?? 0) * 100).toFixed(1)}%
              </p>
              {analysis.is_low_confidence && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Keyakinan rendah — pertegas posisi dan skill utama
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-500">Kata</p>
                <p className="mt-0.5 font-semibold text-slate-800">{analysis.details?.word_count ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Skill</p>
                <p className="mt-0.5 font-semibold text-slate-800">
                  {analysis.skills_detected?.length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ukuran</p>
                <p className="mt-0.5 font-semibold text-slate-800">{formatBytes(resume.file_size)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 profesi paling cocok */}
        <section className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              3 Profesi yang Paling Cocok
            </h3>
            <span className="text-[11px] text-slate-400">
              Skor relatif — gabungan probabilitas model dan skill yang terdeteksi
            </span>
          </div>
          <div className="mt-4">
            <JobMatchList matches={analysis.job_matches || []} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Skor */}
          <section className="card p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">Skor keseluruhan</h3>
            <div className="mt-4">
              <ScoreGauge score={analysis.overall_score ?? 0} grade={analysis.grade} />
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rincian komponen
                </p>
                <ul className="space-y-2.5">
                  {Object.keys(BREAKDOWN_LABELS).map((key) => {
                    const value = analysis.breakdown?.[key] ?? 0;
                    const max = analysis.max_scores?.[key] ?? 25;
                    const percent = Math.round((value / max) * 100);
                    return (
                      <li key={key}>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">{BREAKDOWN_LABELS[key]}</span>
                          <span className="tabular-nums font-medium text-slate-800">
                            {value.toFixed(1)}/{max}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${percent}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Profil skor
                </p>
                <ScoreRadar breakdown={analysis.breakdown} maxScores={analysis.max_scores} />
              </div>
            </div>
          </section>

          {/* Rekomendasi */}
          <section className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Kecocokan bidang</h3>
            <p className="mt-1 text-xs text-slate-500">
              Diagregasi dari probabilitas 24 kelas model.
            </p>
            <div className="mt-4">
              <CareerMatchList matches={analysis.career_matches || []} />
            </div>
          </section>
        </div>

        {/* Skill gap */}
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Analisis skill</h3>
          <p className="mt-1 text-xs text-slate-500">
            Dibandingkan dengan skill kunci untuk role {analysis.predicted_role}.
          </p>
          <div className="mt-4">
            <SkillChips
              matched={analysis.skill_gap?.matched || []}
              missing={analysis.skill_gap?.missing || []}
            />
          </div>
        </section>

        {/* Feedback */}
        <section className="grid gap-4 lg:grid-cols-3">
          <FeedbackCard title="Kelebihan" items={analysis.strengths || []} tone="good" />
          <FeedbackCard title="Kekurangan" items={analysis.weaknesses || []} tone="bad" />
          <FeedbackCard title="Saran perbaikan" items={analysis.suggestions || []} tone="idea" />
        </section>

        {/* Transparansi model */}
        <section className="card p-6">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Detail teknis (prediksi mentah model)
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Top-5 kelas MLP
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {(analysis.raw_predictions || []).map((item) => (
                    <li key={item.category} className="flex justify-between gap-3">
                      <span className="truncate">{item.category}</span>
                      <span className="tabular-nums text-slate-500">
                        {(item.probability * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                  {!analysis.raw_predictions && (
                    <li className="text-slate-500">
                      Kelas mentah: {analysis.predicted_category || '—'}
                    </li>
                  )}
                </ul>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Rasio kosakata dikenal</dt>
                  <dd className="tabular-nums text-slate-700">
                    {((analysis.meta?.in_vocab_ratio ?? 0) * 100).toFixed(0)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Bahasa terdeteksi</dt>
                  <dd className="text-slate-700">{analysis.meta?.language ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Action verb</dt>
                  <dd className="tabular-nums text-slate-700">{analysis.details?.action_verbs ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Bullet poin</dt>
                  <dd className="tabular-nums text-slate-700">{analysis.details?.bullets ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Versi model</dt>
                  <dd className="text-slate-700">{analysis.model_version}</dd>
                </div>
              </dl>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
              Kelas mentah adalah prediksi asli jaringan saraf pada 24 label dataset. Nama role yang
              ditampilkan adalah hasil lapisan taksonomi yang menyempurnakan label tersebut dengan
              job title dan skill yang terdeteksi.
            </p>
          </details>
        </section>
      </div>
    </AppShell>
  );
}
