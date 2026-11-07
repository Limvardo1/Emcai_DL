/**
 * Backfill `job_matches` (3 rekomendasi profesi) untuk analisis lama.
 *
 * CV yang sudah diunggah menyimpan `extracted_text` di tabel resumes, jadi
 * analisis bisa diulang lewat ML service tanpa meminta pengguna upload ulang.
 *
 * Jalankan (ML service harus hidup):
 *   npm run backfill:jobs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from '../src/lib/supabase.js';
import { config } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../data/db.json');

async function analyzeText(text) {
  const response = await fetch(`${config.mlServiceUrl}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  // 422 = CV ditolak gate validasi; tidak ada yang bisa diisi.
  if (response.status === 422) return null;

  if (!response.ok) {
    throw new Error(`ML service ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function ensureMlAlive() {
  try {
    const response = await fetch(`${config.mlServiceUrl}/health`);
    if (response.ok) return;
  } catch {
    /* jatuh ke pesan di bawah */
  }
  throw new Error(
    `ML service tidak merespons di ${config.mlServiceUrl}. ` +
      'Jalankan "npm run dev:ml" lebih dulu.',
  );
}

async function backfillSupabase() {
  const client = createSupabaseClient(config.supabaseUrl, config.supabaseServiceKey);

  const { data, error } = await client
    .from('analysis_results')
    .select('id, job_matches, resumes(extracted_text)')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Gagal membaca analysis_results: ${error.message}`);

  const pending = (data || []).filter(
    (row) => !Array.isArray(row.job_matches) || row.job_matches.length === 0,
  );

  const summary = { updated: 0, skipped: 0, failed: 0 };
  if (!pending.length) return summary;

  let index = 0;
  for (const row of pending) {
    index += 1;
    const rel = Array.isArray(row.resumes) ? row.resumes[0] : row.resumes;
    const text = rel?.extracted_text;
    if (!text) {
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await analyzeText(text);
      if (!result?.job_matches?.length) {
        summary.skipped += 1;
        continue;
      }
      const { error: updateError } = await client
        .from('analysis_results')
        .update({ job_matches: result.job_matches })
        .eq('id', row.id);
      if (updateError) throw new Error(updateError.message);
      summary.updated += 1;
      console.log(`  [${index}/${pending.length}] ${row.id} → ${result.job_matches[0].role}`);
    } catch (error) {
      summary.failed += 1;
      console.warn(`  [${index}/${pending.length}] ${row.id} gagal: ${error.message}`);
    }
  }

  return summary;
}

async function backfillLocal() {
  let db;
  try {
    db = JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
  } catch {
    throw new Error(`Database lokal tidak ditemukan di ${DB_FILE}.`);
  }

  const resumes = db.resumes || [];
  const analyses = db.analyses || [];
  const pending = analyses.filter(
    (row) => !Array.isArray(row.job_matches) || row.job_matches.length === 0,
  );

  const summary = { updated: 0, skipped: 0, failed: 0 };
  let index = 0;

  for (const row of pending) {
    index += 1;
    const resume = resumes.find((item) => item.id === row.resume_id);
    if (!resume?.extracted_text) {
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await analyzeText(resume.extracted_text);
      if (!result?.job_matches?.length) {
        summary.skipped += 1;
        continue;
      }
      row.job_matches = result.job_matches;
      summary.updated += 1;
      console.log(`  [${index}/${pending.length}] ${row.id} → ${result.job_matches[0].role}`);
    } catch (error) {
      summary.failed += 1;
      console.warn(`  [${index}/${pending.length}] ${row.id} gagal: ${error.message}`);
    }
  }

  if (summary.updated) {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
  }
  return summary;
}

async function main() {
  console.log(`Storage : ${config.demoMode ? 'local (demo)' : 'supabase'}`);
  console.log(`ML      : ${config.mlServiceUrl}`);
  await ensureMlAlive();

  const summary = config.demoMode ? await backfillLocal() : await backfillSupabase();
  console.log(
    `\nSelesai: ${summary.updated} diperbarui, ${summary.skipped} dilewati, ` +
      `${summary.failed} gagal.`,
  );
  if (summary.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n[backfill] ${error.message}`);
  process.exit(1);
});
