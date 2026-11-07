/**
 * Lapisan penyimpanan. Dua driver:
 *  - supabase : Postgres + Storage (produksi, sesuai spesifikasi)
 *  - local    : JSON file + folder lokal (mode demo tanpa setup Supabase)
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from './supabase.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

/* ------------------------------------------------------------------ local */
class LocalStore {
  constructor() {
    this.mode = 'local';
    this.queue = Promise.resolve();
  }

  async ensure() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify({ resumes: [], analyses: [] }, null, 2));
    }
  }

  async read() {
    await this.ensure();
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
  }

  /** Serialisasi penulisan agar tidak saling menimpa. */
  async write(mutator) {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await mutator(db);
      await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async saveFile(buffer, filename) {
    const ext = path.extname(filename).toLowerCase() || '.bin';
    const key = `${newId()}${ext}`;
    await this.ensure();
    await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
    return { path: key };
  }

  async removeFile(key) {
    if (!key) return;
    await fs.rm(path.join(UPLOAD_DIR, key), { force: true });
  }

  async readFilePath(resume) {
    return path.join(UPLOAD_DIR, resume.file_path);
  }

  async signedUrl() {
    return null;
  }

  async createResume(record) {
    const resume = { id: record.id || newId(), created_at: now(), ...record };
    await this.write((db) => db.resumes.push(resume));
    return resume;
  }

  async listResumes(userId) {
    const db = await this.read();
    return db.resumes
      .filter((r) => r.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({
        ...r,
        analysis: db.analyses
          .filter((a) => a.resume_id === r.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null,
      }));
  }

  async getResume(id, userId) {
    const db = await this.read();
    const resume = db.resumes.find((r) => r.id === id && r.user_id === userId);
    if (!resume) return null;
    const analysis = db.analyses
      .filter((a) => a.resume_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
    return { ...resume, analysis };
  }

  async deleteResume(id, userId) {
    const resume = await this.getResume(id, userId);
    if (!resume) return null;
    await this.write((db) => {
      db.resumes = db.resumes.filter((r) => r.id !== id);
      db.analyses = db.analyses.filter((a) => a.resume_id !== id);
    });
    await this.removeFile(resume.file_path);
    return resume;
  }

  async saveAnalysis(record) {
    const analysis = { id: newId(), created_at: now(), ...record };
    await this.write((db) => db.analyses.push(analysis));
    return analysis;
  }

  async getStats(userId) {
    const resumes = await this.listResumes(userId);
    const scored = resumes.map((r) => r.analysis?.overall_score).filter((n) => typeof n === 'number');
    const roles = {};
    for (const r of resumes) {
      const role = r.analysis?.predicted_role;
      if (role) roles[role] = (roles[role] || 0) + 1;
    }
    const topRole = Object.entries(roles).sort((a, b) => b[1] - a[1])[0];
    return {
      mode: this.mode,
      total_resumes: resumes.length,
      average_score: scored.length
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : 0,
      best_score: scored.length ? Math.max(...scored) : 0,
      top_role: topRole ? topRole[0] : null,
    };
  }
}

/* --------------------------------------------------------------- supabase */
class SupabaseStore {
  constructor() {
    this.mode = 'supabase';
    this.client = createSupabaseClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  async saveFile(buffer, filename, userId, resumeId) {
    const ext = path.extname(filename).toLowerCase() || '.bin';
    const key = `${userId}/${resumeId}${ext}`;
    const { error } = await this.client.storage
      .from(config.bucket)
      .upload(key, buffer, { contentType: mimeFor(ext), upsert: false });
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return { path: key };
  }

  async removeFile(key) {
    if (!key) return;
    await this.client.storage.from(config.bucket).remove([key]);
  }

  async signedUrl(key) {
    const { data } = await this.client.storage
      .from(config.bucket)
      .createSignedUrl(key, 60 * 10);
    return data?.signedUrl || null;
  }

  async createResume(record) {
    const { data, error } = await this.client
      .from('resumes')
      .insert(record)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data;
  }

  async listResumes(userId) {
    const { data, error } = await this.client
      .from('resumes')
      .select('*, analysis_results(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return (data || []).map(({ analysis_results, ...resume }) => ({
      ...resume,
      analysis: (analysis_results || []).sort((a, b) =>
        String(b.created_at).localeCompare(String(a.created_at)),
      )[0] || null,
    }));
  }

  async getResume(id, userId) {
    const { data, error } = await this.client
      .from('resumes')
      .select('*, analysis_results(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    if (!data) return null;
    const { analysis_results, ...resume } = data;
    return {
      ...resume,
      analysis: (analysis_results || [])[0] || null,
    };
  }

  async deleteResume(id, userId) {
    const resume = await this.getResume(id, userId);
    if (!resume) return null;
    await this.removeFile(resume.file_path);
    const { error } = await this.client.from('resumes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return resume;
  }

  async saveAnalysis(record) {
    const { data, error } = await this.client
      .from('analysis_results')
      .insert(record)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data;
  }

  async getStats(userId) {
    const resumes = await this.listResumes(userId);
    const scored = resumes.map((r) => r.analysis?.overall_score).filter((n) => typeof n === 'number');
    const roles = {};
    for (const r of resumes) {
      const role = r.analysis?.predicted_role;
      if (role) roles[role] = (roles[role] || 0) + 1;
    }
    const topRole = Object.entries(roles).sort((a, b) => b[1] - a[1])[0];
    return {
      mode: this.mode,
      total_resumes: resumes.length,
      average_score: scored.length
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : 0,
      best_score: scored.length ? Math.max(...scored) : 0,
      top_role: topRole ? topRole[0] : null,
    };
  }
}

function mimeFor(ext) {
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/octet-stream';
}

export const store = config.demoMode ? new LocalStore() : new SupabaseStore();
export { mimeFor };
