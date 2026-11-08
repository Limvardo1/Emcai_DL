import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { requireUser } from './lib/auth.js';
import { mlHealth, mlModelInfo } from './lib/ml.js';
import { store } from './lib/store.js';
import resumesRouter from './routes/resumes.js';

const app = express();

app.use(cors({ origin: config.webOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/livez', (_req, res) => {
  res.json({ status: 'ok' });
});

// Leapcell mem-poll /kaithhealth pada port aplikasi saat start.
app.get('/kaithhealth', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', async (_req, res) => {
  const ml = await mlHealth();
  res.json({
    status: 'ok',
    storage: store.mode,
    demo_mode: config.demoMode,
    max_file_mb: config.maxFileMb,
    ml,
  });
});

app.get('/api/model', async (_req, res, next) => {
  try {
    res.json(await mlModelInfo());
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats', requireUser, async (req, res, next) => {  try {
    res.json(await store.getStats(req.user.id));
  } catch (error) {
    next(error);
  }
});

app.use('/api/resumes', resumesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      valid: false,
      reasons: [`Ukuran file melebihi ${config.maxFileMb} MB.`],
    });
  }
  if (error?.message?.startsWith('Format tidak didukung')) {
    return res.status(415).json({ valid: false, reasons: [error.message] });
  }
  console.error('[api]', error);
  return res.status(error.status || 500).json({
    error: error.message || 'Terjadi kesalahan pada server.',
  });
});

app.listen(config.port, () => {
  console.log(`ResumeAI API  : http://localhost:${config.port}`);
  console.log(`Storage mode  : ${store.mode}${config.demoMode ? ' (demo)' : ''}`);
  console.log(`ML service    : ${config.mlServiceUrl}`);
});
