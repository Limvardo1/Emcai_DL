import { config } from '../config.js';

const TIMEOUT_MS = 60_000;

export async function analyzeResumeFile(buffer, filename, mimetype) {
  const form = new FormData();
  form.append(
    'file',
    new Blob([buffer], { type: mimetype || 'application/octet-stream' }),
    filename,
  );

  let response;
  try {
    response = await fetch(`${config.mlServiceUrl}/analyze`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const err = new Error(
      'Layanan analisis (ML) tidak dapat dihubungi. Pastikan service ML berjalan di port 8001.',
    );
    err.status = 503;
    err.payload = { valid: false, reasons: [err.message], cause: String(error) };
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail;
    const err = new Error(
      typeof detail === 'string' ? detail : 'CV tidak lolos validasi.',
    );
    err.status = response.status;
    err.payload =
      typeof detail === 'object' && detail !== null
        ? detail
        : { valid: false, reasons: [err.message] };
    throw err;
  }
  return data;
}

export async function mlHealth() {
  try {
    const res = await fetch(`${config.mlServiceUrl}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? await res.json() : { status: 'down' };
  } catch {
    return { status: 'down' };
  }
}

export async function mlModelInfo() {
  const res = await fetch(`${config.mlServiceUrl}/model-info`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw Object.assign(new Error('Gagal mengambil informasi model.'), { status: 502 });
  }
  return res.json();
}
