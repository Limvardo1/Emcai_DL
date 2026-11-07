'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            R
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Resume<span className="text-brand-600">AI</span>
          </span>
        </Link>

        <div className="card p-7">
          <h1 className="text-xl font-semibold text-slate-900">Masuk ke akun Anda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Akses riwayat CV dan hasil analisis sebelumnya.
          </p>

          {!isSupabaseConfigured ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Mode demo aktif</p>
                <p className="mt-1 text-amber-700">
                  Supabase belum dikonfigurasi, jadi autentikasi dilewati. Semua data disimpan
                  lokal di server API.
                </p>
              </div>
              <Link href="/dashboard" className="btn-primary w-full">
                Lanjut ke dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Memproses…' : 'Masuk'}
              </button>
            </form>
          )}

          {isSupabaseConfigured && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Daftar gratis
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
