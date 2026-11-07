import crypto from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { analyzeResumeFile } from '../lib/ml.js';
import { requireUser } from '../lib/auth.js';
import { mimeFor, store } from '../lib/store.js';

const ALLOWED = new Set(['.pdf', '.docx']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error('Format tidak didukung. Gunakan PDF atau DOCX.'));
    }
    return cb(null, true);
  },
});

const router = Router();
router.use(requireUser);

function toAnalysisRow(resumeId, userId, result) {
  return {
    resume_id: resumeId,
    user_id: userId,
    overall_score: result.overall_score,
    grade: result.grade,
    predicted_role: result.predicted.role,
    predicted_category: result.predicted.category,
    family_key: result.predicted.family_key,
    family_label: result.predicted.family_label,
    confidence: result.predicted.confidence,
    is_low_confidence: result.is_low_confidence,
    breakdown: result.breakdown,
    career_matches: result.career_matches,
    job_matches: result.job_matches,
    skill_gap: result.skill_gap,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    suggestions: result.suggestions,
    skills_detected: result.skills_detected,
    raw_predictions: result.raw_predictions,
    meta: result.meta,
    model_version: result.model_version,
  };
}

router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ valid: false, reasons: ['File CV tidak ditemukan.'] });
  }

  const resumeId = crypto.randomUUID();
  const originalName = req.file.originalname;
  let storedPath = null;

  try {
    const { path: key } = await store.saveFile(
      req.file.buffer,
      originalName,
      req.user.id,
      resumeId,
    );
    storedPath = key;

    const result = await analyzeResumeFile(
      req.file.buffer,
      originalName,
      req.file.mimetype,
    );

    const resume = await store.createResume({
      id: resumeId,
      user_id: req.user.id,
      file_name: originalName,
      file_path: key,
      file_size: req.file.size,
      mime_type: req.file.mimetype || mimeFor(path.extname(originalName)),
      extracted_text: (result.extracted_text || '').slice(0, 20000) || null,
    });

    const analysis = await store.saveAnalysis(
      toAnalysisRow(resume.id, req.user.id, result),
    );

    return res.status(201).json({ resume, analysis });
  } catch (error) {
    // CV ditolak: jangan tinggalkan file yatim di storage.
    if (storedPath) await store.removeFile(storedPath).catch(() => {});
    if (error.status === 422 || error.status === 415) {
      return res.status(422).json(error.payload || { valid: false, reasons: [error.message] });
    }
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const resumes = await store.listResumes(req.user.id);
    res.json({ resumes });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const resume = await store.getResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'CV tidak ditemukan.' });
    const file_url =
      store.mode === 'local'
        ? `/api/resumes/${resume.id}/file`
        : await store.signedUrl(resume.file_path);
    return res.json({ resume: { ...resume, file_url } });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/file', async (req, res, next) => {
  try {
    const resume = await store.getResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'CV tidak ditemukan.' });
    if (store.mode === 'supabase') {
      const url = await store.signedUrl(resume.file_path);
      if (!url) return res.status(404).json({ error: 'File tidak tersedia.' });
      return res.redirect(url);
    }
    const absolute = await store.readFilePath(resume);
    return res.sendFile(absolute, {
      headers: { 'Content-Type': resume.mime_type || 'application/octet-stream' },
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await store.deleteResume(req.params.id, req.user.id);
    if (!removed) return res.status(404).json({ error: 'CV tidak ditemukan.' });
    return res.json({ deleted: true, id: req.params.id });
  } catch (error) {
    return next(error);
  }
});

export default router;
