import 'dotenv/config';

const bool = (value, fallback = false) =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(String(value).toLowerCase());

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const explicitDemo = bool(process.env.DEMO_MODE);

/**
 * Gagal cepat saat kredensial Supabase tidak valid.
 *
 * Tanpa validasi ini, salah tempel (mis. API key masuk ke SUPABASE_URL)
 * membuat `demoMode` bernilai true diam-diam: aplikasi tetap jalan, tapi
 * data tersimpan lokal dan login dilewati — bug yang sulit dilacak.
 */
function assertSupabaseConfig() {
  const configured = Boolean(supabaseUrl || supabaseServiceKey);
  if (!configured || explicitDemo) return;

  const fail = (message) => {
    throw new Error(`[config] ${message}`);
  };

  if (!supabaseUrl) {
    fail('SUPABASE_URL kosong padahal SUPABASE_SERVICE_ROLE_KEY terisi.');
  }
  if (/^(sb_publishable_|sb_secret_|eyJ)/.test(supabaseUrl)) {
    fail(
      'SUPABASE_URL berisi API key, bukan URL project. ' +
        'Gunakan https://<project-ref>.supabase.co',
    );
  }
  if (/xxxx/i.test(supabaseUrl)) {
    fail('SUPABASE_URL masih placeholder dari .env.example. Isi URL project asli.');
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    fail(`SUPABASE_URL tidak valid: "${supabaseUrl}". Format: https://<ref>.supabase.co`);
  }
  if (!supabaseServiceKey) {
    fail(
      'SUPABASE_SERVICE_ROLE_KEY kosong. Tanpa key ini aplikasi akan jatuh ke mode demo.',
    );
  }
  if (supabaseServiceKey.includes('xxxxxxxx')) {
    fail('SUPABASE_SERVICE_ROLE_KEY masih placeholder. Isi secret key project asli.');
  }
  if (!supabaseAnonKey) {
    console.warn(
      '[config] SUPABASE_ANON_KEY kosong; verifikasi token memakai service role key.',
    );
  }
}

assertSupabaseConfig();

export const config = {
  port: Number(process.env.PORT || 4000),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001',
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
  bucket: process.env.SUPABASE_BUCKET || 'resumes',
  maxFileMb: Number(process.env.MAX_FILE_MB || 5),
  demoMode: explicitDemo || !(supabaseUrl && supabaseServiceKey),
};

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
