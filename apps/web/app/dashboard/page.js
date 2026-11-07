'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { formatDate, scoreTone } from '@/lib/format';

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function ScoreBadge({ score }) {
  if (typeof score !== 'number') {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const tone = scoreTone(score);
  return (
    <span className={`badge ${tone.bg} ${tone.text} border ${tone.border} tabular-nums`}>
      {score}
    </span>
  );
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, summary] = await Promise.all([api.listResumes(), api.stats()]);
      setResumes(list.resumes || []);
      setStats(summary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Hapus CV ini beserta hasil analisisnya?')) return;
    setBusyId(id);
    try {
      await api.deleteResume(id);
      setResumes((current) => current.filter((item) => item.id !== id));
      const summary = await api.stats();
      setStats(summary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Ringkasan CV dan hasil analisis Anda"
      actions={
        <Link href="/upload" className="btn-primary">
          Unggah CV
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total CV"
            value={loading ? '—' : stats?.total_resumes ?? 0}
            hint="CV yang pernah dianalisis"
          />
          <StatCard
            label="Rata-rata skor"
            value={loading ? '—' : stats?.average_score ?? 0}
            hint="Dari seluruh CV tersimpan"
          />
          <StatCard
            label="Role teratas"
            value={loading ? '—' : stats?.top_role ?? '—'}
            hint="Paling sering muncul"
          />
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Riwayat analisis</h2>
            <button onClick={load} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Muat ulang
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Belum ada CV</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Unggah CV berbahasa Inggris pertama Anda untuk melihat skor dan rekomendasi karier.
              </p>
              <Link href="/upload" className="btn-primary mt-6">
                Unggah CV
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">File</th>
                      <th className="px-5 py-3 font-medium">Tanggal</th>
                      <th className="px-5 py-3 font-medium">Skor</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Keluarga</th>
                      <th className="px-5 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resumes.map((resume) => (
                      <tr key={resume.id} className="hover:bg-slate-50/60">
                        <td className="max-w-[220px] truncate px-5 py-3 font-medium text-slate-800">
                          {resume.file_name}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(resume.created_at)}</td>
                        <td className="px-5 py-3">
                          <ScoreBadge score={resume.analysis?.overall_score} />
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {resume.analysis?.predicted_role || '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {resume.analysis?.family_label || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/dashboard/${resume.id}`}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                            >
                              Lihat
                            </Link>
                            <button
                              onClick={() => handleDelete(resume.id)}
                              disabled={busyId === resume.id}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            >
                              {busyId === resume.id ? '…' : 'Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {resumes.map((resume) => (
                  <li key={resume.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {resume.file_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(resume.created_at)} · {resume.analysis?.predicted_role || '—'}
                        </p>
                      </div>
                      <ScoreBadge score={resume.analysis?.overall_score} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/dashboard/${resume.id}`} className="btn-secondary flex-1 py-2 text-xs">
                        Lihat hasil
                      </Link>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={busyId === resume.id}
                        className="btn-ghost py-2 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
