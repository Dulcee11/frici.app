import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS: 'frici_habits',
  CHECKIN: 'frici_checkin',
  MOOD_TODAY: 'frici_mood_today',
  STATS: 'frici_stats',
};

const DEFAULT_HABITS = [
  { id: '1', label: 'Tomar agua (2L)', done: false, streak: 3 },
  { id: '2', label: 'Descanso de pantalla', done: false, streak: 5 },
  { id: '3', label: 'Meditar 5 min', done: false, streak: 0 },
  { id: '4', label: 'Dormir antes de 11pm', done: false, streak: 0 },
];

export async function getHabits() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HABITS);
    return raw ? JSON.parse(raw) : DEFAULT_HABITS;
  } catch {
    return DEFAULT_HABITS;
  }
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
}

export async function getCheckIn() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHECKIN);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveCheckIn(data) {
  await AsyncStorage.setItem(KEYS.CHECKIN, JSON.stringify({ ...data, date: new Date().toDateString() }));
}

export async function getMoodToday() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MOOD_TODAY);
    if (!raw) return null;
    const { mood, date } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return null;
    return mood;
  } catch {
    return null;
  }
}

export async function saveMoodToday(mood) {
  await AsyncStorage.setItem(KEYS.MOOD_TODAY, JSON.stringify({ mood, date: new Date().toDateString() }));
}

export async function getStats() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    return raw ? JSON.parse(raw) : { habitsCompleted: 5, sleepHours: 6, streakDays: 3 };
  } catch {
    return { habitsCompleted: 5, sleepHours: 6, streakDays: 3 };
  }
}

export async function updateStats(patch) {
  const current = await getStats();
  await AsyncStorage.setItem(KEYS.STATS, JSON.stringify({ ...current, ...patch }));
}
