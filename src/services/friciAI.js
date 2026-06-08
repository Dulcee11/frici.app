/**
 * FRICI AI Service
 * En desarrollo: apunta a localhost:8000
 * En producción: apunta al servidor en Railway (definido en app.config.js)
 */
import Constants from 'expo-constants';

// Usa la URL del servidor configurada en app.config.js
// Si no está definida, cae a localhost (desarrollo local)
const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || 'http://localhost:8000';

export async function sendMessage(message, history = [], userContext = {}) {
  const response = await fetch(`${SERVER_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, user_context: userContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error del servidor: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function checkServerHealth() {
  try {
    const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
