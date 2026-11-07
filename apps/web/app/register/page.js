'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.session) {
      router.push('/dashboard');
      return;
    }
    setNotice('Akun dibuat. Cek email Anda untuk konfirmasi sebelum masuk.');
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
          <h1 className="text-xl font-semibold text-slate-900">Buat akun baru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gratis. Riwayat analisis CV tersimpan otomatis.
          </p>

          {!isSupabaseConfigured ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Mode demo aktif</p>
                <p className="mt-1 text-amber-700">
                  Pendaftaran dilewati karena Supabase belum dikonfigurasi.
                </p>
              </div>
              <Link href="/dashboard" className="btn-primary w-full">
                Lanjut ke dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="name">Nama lengkap</label>
                <input
                  id="name"
                  required
                  className="input"
                  placeholder="Nama Anda"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
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
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
              )}
              {notice && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Memproses…' : 'Daftar'}
              </button>
            </form>
          )}

          {isSupabaseConfigured && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Masuk
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
