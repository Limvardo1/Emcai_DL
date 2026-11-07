'use client';

import { getAccessToken } from './supabase';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.reasons?.[0] ||
      data?.error ||
      data?.detail?.reasons?.[0] ||
      `Permintaan gagal (${response.status}).`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  health: () => apiFetch('/health'),
  model: () => apiFetch('/model'),
  stats: () => apiFetch('/stats'),
  listResumes: () => apiFetch('/resumes'),
  getResume: (id) => apiFetch(`/resumes/${id}`),
  deleteResume: (id) => apiFetch(`/resumes/${id}`, { method: 'DELETE' }),
  uploadResume: (file) => {
    const body = new FormData();
    body.append('file', file);
    return apiFetch('/resumes', { method: 'POST', body });
  },
};
