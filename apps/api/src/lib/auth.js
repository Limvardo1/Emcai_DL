import { createSupabaseClient } from './supabase.js';
import { config, DEMO_USER_ID } from '../config.js';

let client = null;

function authClient() {
  if (!client) {
    client = createSupabaseClient(
      config.supabaseUrl,
      config.supabaseAnonKey || config.supabaseServiceKey,
    );
  }
  return client;
}

export async function requireUser(req, res, next) {
  if (config.demoMode) {
    req.user = { id: DEMO_USER_ID, email: 'demo@resumeai.local' };
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
  }

  try {
    const { data, error } = await authClient().auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = { id: data.user.id, email: data.user.email };
    return next();
  } catch (error) {
    return next(error);
  }
}
