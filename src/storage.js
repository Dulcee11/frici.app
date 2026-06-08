import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS: 'frici_habits',
  CHECKIN: 'frici_checkin',
  MOOD_TODAY: 'frici_mood_today',
  STATS: 'frici_stats',
  USER: 'frici_user',       // perfil permanente (nunca se borra)
  SESSION: 'frici_session', // sesión activa (se borra al cerrar sesión)
  HISTORY: 'frici_history',
};

const DEFAULT_HABITS = [
  { id: '1', label: 'Tomar agua (2L)', done: false, streak: 0 },
  { id: '2', label: 'Descanso de pantalla', done: false, streak: 0 },
  { id: '3', label: 'Meditar 5 min', done: false, streak: 0 },
  { id: '4', label: 'Dormir antes de 11pm', done: false, streak: 0 },
];

// ── Usuario ──────────────────────────────────────────────────────────────────

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveUser(user) {
  // Guarda el perfil Y abre la sesión
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
}

// Devuelve el usuario si hay sesión activa (login)
export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Cierra sesión sin borrar el perfil
export async function logout() {
  await AsyncStorage.removeItem(KEYS.SESSION);
}

// Solo para migraciones — no usar en logout
export async function deleteUser() {
  await AsyncStorage.multiRemove([KEYS.USER, KEYS.SESSION]);
}

// ── Hábitos ──────────────────────────────────────────────────────────────────

export async function getHabits() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HABITS);
    return raw ? JSON.parse(raw) : DEFAULT_HABITS;
  } catch { return DEFAULT_HABITS; }
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
}

export function getSuggestedHabits() {
  return [
    { id: 's1', label: 'Tomar agua (2L)' },
    { id: 's2', label: 'Descanso de pantalla' },
    { id: 's3', label: 'Meditar 5 min' },
    { id: 's4', label: 'Dormir antes de 11pm' },
    { id: 's5', label: 'Salir a caminar 15 min' },
    { id: 's6', label: 'Leer 20 min sin pantallas' },
    { id: 's7', label: 'No revisar redes antes de dormir' },
    { id: 's8', label: 'Desayunar sin teléfono' },
    { id: 's9', label: 'Ejercicio 30 min' },
    { id: 's10', label: 'Tiempo en naturaleza' },
  ];
}

// ── Check-in ─────────────────────────────────────────────────────────────────

export async function getCheckIn() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHECKIN);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Solo vale si es de hoy
    if (data.date !== new Date().toDateString()) return null;
    return data;
  } catch { return null; }
}

export async function saveCheckIn(data) {
  const today = new Date().toDateString();
  const entry = { ...data, date: today };
  await AsyncStorage.setItem(KEYS.CHECKIN, JSON.stringify(entry));

  // Guarda en historial
  await addHistoryEntry({ ...entry, type: 'checkin' });

  // Actualiza racha si los hábitos también están completos
  await maybeUpdateStreak();
}

// ── Ánimo ─────────────────────────────────────────────────────────────────────

export async function getMoodToday() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MOOD_TODAY);
    if (!raw) return null;
    const { mood, date } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return null;
    return mood;
  } catch { return null; }
}

export async function saveMoodToday(mood) {
  await AsyncStorage.setItem(KEYS.MOOD_TODAY, JSON.stringify({ mood, date: new Date().toDateString() }));
}

// ── Estadísticas y racha ──────────────────────────────────────────────────────

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    return raw ? JSON.parse(raw) : { sleepHours: 0, streakDays: 0, lastStreakDate: null };
  } catch { return { sleepHours: 0, streakDays: 0, lastStreakDate: null }; }
}

export async function updateStats(patch) {
  const current = await getStats();
  await AsyncStorage.setItem(KEYS.STATS, JSON.stringify({ ...current, ...patch }));
}

/**
 * Incrementa la racha si hoy se completaron hábitos Y check-in.
 * Resetea si se saltó un día.
 */
export async function maybeUpdateStreak() {
  const [habits, checkin, stats] = await Promise.all([getHabits(), getCheckIn(), getStats()]);
  const allDone = habits.length > 0 && habits.every(h => h.done);
  const checkinDone = !!checkin;
  if (!allDone || !checkinDone) return;

  const today = new Date().toDateString();
  if (stats.lastStreakDate === today) return; // ya contado hoy

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const consecutive = stats.lastStreakDate === yesterday;

  const newStreak = consecutive ? stats.streakDays + 1 : 1;
  await updateStats({ streakDays: newStreak, lastStreakDate: today });
}

// ── Historial diario ──────────────────────────────────────────────────────────

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addHistoryEntry(entry) {
  const history = await getHistory();
  const today = new Date().toDateString();
  // Reemplaza entrada de hoy si ya existe
  const filtered = history.filter(e => e.date !== today);
  const habits = await getHabits();
  const newEntry = {
    date: today,
    mood: entry.mood ?? null,
    carga: entry.carga ?? null,
    sleep: entry.sleep ?? null,
    sleepHours: entry.sleepHours ?? null,
    emotions: entry.emotions ?? [],
    habitsCompleted: habits.filter(h => h.done).length,
    totalHabits: habits.length,
    checkinDone: true,
  };
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify([...filtered, newEntry].slice(-30))); // últimos 30 días
}

export async function resetDailyHabits() {
  const habits = await getHabits();
  const reset = habits.map(h => ({ ...h, done: false }));
  await saveHabits(reset);
}
