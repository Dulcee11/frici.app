/**
 * FRICI AI Service
 * Llama al servidor Python local que tiene el contexto del usuario.
 * El servidor corre en localhost:8000.
 */

const SERVER_URL = 'http://localhost:8000';

/**
 * Envía un mensaje al chatbot con el contexto completo del usuario.
 * @param {string} message - Mensaje del usuario
 * @param {Array<{role, text}>} history - Historial de la conversación
 * @param {object} userContext - Datos del usuario: mood, checkin, habits, stats
 * @returns {Promise<string>} Respuesta de FRICI
 */
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
