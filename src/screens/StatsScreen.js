import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { getHistory, getStats, getHabits } from '../storage';

const MOODS = ['😊 Bien', '😐 Regular', '😔 Cansada', '😰 Agotada'];
const MOOD_COLORS = ['#6EE7B7', '#C4B5FD', '#FCA5A5', '#F87171'];

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function WeekDot({ label, done, isToday }) {
  return (
    <View style={styles.weekDotCol}>
      <View style={[styles.weekDot, done && styles.weekDotDone, isToday && !done && styles.weekDotToday]} />
      <Text style={styles.weekDotLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ sleepHours: 0, streakDays: 0 });
  const [habits, setHabits] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
      getStats().then(setStats);
      getHabits().then(setHabits);
    }, [])
  );

  // Últimos 7 días
  const last7 = getLast7Days().map(d => {
    const entry = history.find(h => h.date === d.dateStr);
    return { ...d, entry };
  });

  const avgSleep = history.length
    ? (history.filter(h => h.sleepHours).reduce((s, h) => s + h.sleepHours, 0) / history.filter(h => h.sleepHours).length).toFixed(1)
    : '--';

  const checkinDays = last7.filter(d => d.entry?.checkinDone).length;
  const completionRate = last7.filter(d => d.entry).length > 0
    ? Math.round(last7.filter(d => d.entry?.habitsCompleted === d.entry?.totalHabits && d.entry?.totalHabits > 0).length / 7 * 100)
    : 0;

  // Emociones más frecuentes
  const emotionCount = {};
  history.forEach(h => h.emotions?.forEach(e => { emotionCount[e] = (emotionCount[e] || 0) + 1; }));
  const topEmotions = Object.entries(emotionCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Ánimo promedio
  const moodEntries = history.filter(h => h.mood !== null && h.mood !== undefined);
  const avgMood = moodEntries.length ? Math.round(moodEntries.reduce((s, h) => s + h.mood, 0) / moodEntries.length) : null;

  const todayEntry = history.find(h => h.date === new Date().toDateString());

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#EDE9FE', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.title}>Mis estadísticas 📊</Text>
          <Text style={styles.sub}>Tu bienestar de los últimos 7 días</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Check-in de hoy */}
          {todayEntry ? (
            <View style={[styles.card, styles.todayCard]}>
              <Text style={styles.cardLabel}>RESUMEN DE HOY</Text>
              <View style={styles.todayRow}>
                <View style={styles.todayStat}>
                  <Text style={styles.todayEmoji}>{MOODS[todayEntry.mood ?? 0]}</Text>
                  <Text style={styles.todayStatLbl}>Ánimo</Text>
                </View>
                <View style={styles.todayStat}>
                  <Text style={styles.todayVal}>{todayEntry.carga ?? '--'}%</Text>
                  <Text style={styles.todayStatLbl}>Carga</Text>
                </View>
                <View style={styles.todayStat}>
                  <Text style={styles.todayVal}>{todayEntry.sleepHours ?? '--'}h</Text>
                  <Text style={styles.todayStatLbl}>Sueño</Text>
                </View>
                <View style={styles.todayStat}>
                  <Text style={styles.todayVal}>{todayEntry.habitsCompleted}/{todayEntry.totalHabits}</Text>
                  <Text style={styles.todayStatLbl}>Hábitos</Text>
                </View>
              </View>
              {todayEntry.emotions?.length > 0 && (
                <View style={styles.emotionPills}>
                  {todayEntry.emotions.map(e => (
                    <View key={e} style={styles.ePill}><Text style={styles.ePillTxt}>{e}</Text></View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.card, { borderWidth: 1.5, borderColor: colors.lila, borderStyle: 'dashed' }]}>
              <Text style={{ textAlign: 'center', color: colors.lilaDark, fontWeight: '600' }}>💚 Aún no hiciste el check-in de hoy</Text>
              <Text style={{ textAlign: 'center', color: colors.textoMedio, fontSize: 12, marginTop: 4 }}>Ve a Bienestar para completarlo</Text>
            </View>
          )}

          {/* Racha y métricas clave */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, { backgroundColor: colors.lilaLight }]}>
              <Text style={styles.metricVal}>🔥 {stats.streakDays}</Text>
              <Text style={styles.metricLbl}>Racha días</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.verdeLight }]}>
              <Text style={styles.metricVal}>😴 {avgSleep}h</Text>
              <Text style={styles.metricLbl}>Sueño promedio</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.metricVal}>✅ {completionRate}%</Text>
              <Text style={styles.metricLbl}>Hábitos semana</Text>
            </View>
          </View>

          {/* Actividad semanal */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ACTIVIDAD ESTA SEMANA</Text>
            <View style={styles.weekRow}>
              {last7.map((d, i) => (
                <WeekDot key={i} label={d.short} done={!!d.entry?.checkinDone} isToday={d.isToday} />
              ))}
            </View>
            <Text style={styles.weekSub}>{checkinDays}/7 días con check-in completado</Text>
          </View>

          {/* Sueño últimos días */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SUEÑO — ÚLTIMOS 7 DÍAS</Text>
            {last7.map((d, i) => (
              <View key={i} style={styles.sleepRow}>
                <Text style={styles.sleepDay}>{d.short}</Text>
                <MiniBar value={d.entry?.sleepHours ?? 0} max={10} color={colors.lilaDark} />
                <Text style={styles.sleepVal}>{d.entry?.sleepHours ? `${d.entry.sleepHours}h` : '--'}</Text>
              </View>
            ))}
          </View>

          {/* Emociones frecuentes */}
          {topEmotions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>EMOCIONES MÁS FRECUENTES</Text>
              {topEmotions.map(([emotion, count]) => (
                <View key={emotion} style={styles.emotionRow}>
                  <Text style={styles.emotionName}>{emotion}</Text>
                  <MiniBar value={count} max={topEmotions[0][1]} color={colors.verde} />
                  <Text style={styles.emotionCount}>{count}x</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ánimo promedio */}
          {avgMood !== null && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>ÁNIMO PROMEDIO</Text>
              <View style={styles.moodAvgRow}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[styles.moodAvgItem, avgMood === i && styles.moodAvgItemSel]}>
                    <Text style={styles.moodAvgEmoji}>{MOODS[i].split(' ')[0]}</Text>
                    {avgMood === i && <Text style={styles.moodAvgLbl}>{MOODS[i].split(' ').slice(1).join(' ')}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {history.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTxt}>Completa tu primer check-in{'\n'}y aquí verás tu progreso</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return {
      dateStr: d.toDateString(),
      short: days[d.getDay()],
      isToday: i === 6,
    };
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisSuave },
  header: { padding: 24, paddingTop: 52, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: colors.texto, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.textoMedio },
  body: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.blanco, borderRadius: radius.md, padding: 16, ...shadow.sm },
  todayCard: { borderLeftWidth: 4, borderLeftColor: colors.verdeDark },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textoSuave, textTransform: 'uppercase', marginBottom: 12 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-around' },
  todayStat: { alignItems: 'center', gap: 4 },
  todayEmoji: { fontSize: 20 },
  todayVal: { fontSize: 18, fontWeight: '700', color: colors.lilaDark },
  todayStatLbl: { fontSize: 10, color: colors.textoMedio },
  emotionPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  ePill: { backgroundColor: colors.lilaLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  ePillTxt: { fontSize: 11, color: colors.lilaDark, fontWeight: '500' },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, borderRadius: radius.sm, padding: 12, alignItems: 'center', gap: 4 },
  metricVal: { fontSize: 16, fontWeight: '700', color: colors.texto },
  metricLbl: { fontSize: 9, color: colors.textoMedio, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDotCol: { alignItems: 'center', gap: 5 },
  weekDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB' },
  weekDotDone: { backgroundColor: colors.verdeDark },
  weekDotToday: { backgroundColor: colors.lila, borderWidth: 2, borderColor: colors.lilaDark },
  weekDotLabel: { fontSize: 10, color: colors.textoMedio, fontWeight: '600' },
  weekSub: { fontSize: 11, color: colors.textoMedio, textAlign: 'center' },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sleepDay: { width: 20, fontSize: 11, fontWeight: '600', color: colors.textoMedio },
  sleepVal: { width: 28, fontSize: 11, color: colors.lilaDark, fontWeight: '600', textAlign: 'right' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F0EEFF', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emotionName: { width: 90, fontSize: 12, color: colors.texto },
  emotionCount: { width: 24, fontSize: 11, color: colors.textoMedio, textAlign: 'right' },
  moodAvgRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  moodAvgItem: { padding: 10, borderRadius: radius.xs, alignItems: 'center' },
  moodAvgItemSel: { backgroundColor: colors.lilaLight, borderWidth: 2, borderColor: colors.lila },
  moodAvgEmoji: { fontSize: 24 },
  moodAvgLbl: { fontSize: 10, color: colors.lilaDark, fontWeight: '600', marginTop: 3 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { fontSize: 14, color: colors.textoMedio, textAlign: 'center', marginTop: 12, lineHeight: 22 },
});
