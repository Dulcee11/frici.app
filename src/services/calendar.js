/**
 * FRICI Calendar Service
 * Lee el calendario del usuario para detectar bloques de trabajo sin descanso.
 */
import * as Calendar from 'expo-calendar';

export async function requestCalendarPermission() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Analiza los eventos de hoy y detecta:
 * - Cuántas horas seguidas de trabajo lleva la persona
 * - Si hay bloques sin descanso (>90 min sin pausa de 15 min)
 * - Cuántos eventos tiene hoy en total
 */
export async function analyzeToday() {
  const granted = await requestCalendarPermission();
  if (!granted) return { granted: false, events: [], workHours: 0, noBreakWarning: false, longestBlock: 0 };

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map(c => c.id);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const events = await Calendar.getEventsAsync(calendarIds, start, end);

    // Ordena por hora de inicio
    const sorted = events
      .filter(e => e.startDate && e.endDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Calcula horas de trabajo total
    const totalMinutes = sorted.reduce((sum, e) => {
      const dur = (new Date(e.endDate) - new Date(e.startDate)) / 60000;
      return sum + Math.min(dur, 180); // máximo 3h por evento para evitar all-day
    }, 0);

    // Detecta el bloque más largo sin pausa de 15+ min
    let longestBlock = 0;
    let currentBlock = 0;
    for (let i = 0; i < sorted.length; i++) {
      const dur = (new Date(sorted[i].endDate) - new Date(sorted[i].startDate)) / 60000;
      currentBlock += dur;
      if (i < sorted.length - 1) {
        const gap = (new Date(sorted[i + 1].startDate) - new Date(sorted[i].endDate)) / 60000;
        if (gap >= 15) {
          longestBlock = Math.max(longestBlock, currentBlock);
          currentBlock = 0;
        }
      }
    }
    longestBlock = Math.max(longestBlock, currentBlock);

    // Tiempo de trabajo acumulado desde el primer evento hasta ahora
    const now = new Date();
    const passedEvents = sorted.filter(e => new Date(e.endDate) <= now);
    const workMinutesToday = passedEvents.reduce((sum, e) => {
      const dur = (new Date(e.endDate) - new Date(e.startDate)) / 60000;
      return sum + Math.min(dur, 180);
    }, 0);

    return {
      granted: true,
      events: sorted,
      eventCount: sorted.length,
      workHours: Math.round(workMinutesToday / 6) / 10, // 1 decimal
      longestBlock: Math.round(longestBlock),
      noBreakWarning: longestBlock >= 90,
      totalEvents: sorted.length,
    };
  } catch {
    return { granted: true, events: [], workHours: 0, noBreakWarning: false, longestBlock: 0 };
  }
}

/**
 * Retorna texto legible del tiempo sin descanso, ej: "2h 40min"
 */
export function formatWorkTime(hours) {
  if (!hours || hours === 0) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
