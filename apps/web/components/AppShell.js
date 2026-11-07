'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: '/upload',
    label: 'Unggah CV',
    icon: (
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: '/about-model',
    label: 'Tentang Model',
    icon: (
      <path
        d="M12 8v.01M12 12v4m0 5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        strokeLinecap="round"
      />
    ),
  },
];

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      {children}
    </svg>
  );
}

export default function AppShell({ title, subtitle, actions, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
      else setUser(session.user);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Memuat sesi…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Resume<span className="text-brand-600">AI</span>
            </span>
          </Link>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon>{item.icon}</Icon>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 p-3">
          {isSupabaseConfigured ? (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <button onClick={handleLogout} className="mt-2 text-xs font-semibold text-slate-600 hover:text-rose-600">
                Keluar
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">Mode demo</p>
              <p className="mt-0.5 text-amber-700">Supabase belum dikonfigurasi.</p>
            </div>
          )}
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
          >
            <Icon>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </Icon>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
