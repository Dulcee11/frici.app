import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { getHabits, saveHabits, getMoodToday, saveMoodToday, getStats } from '../storage';

const MOODS = [
  { emoji: '😊', label: 'Bien' },
  { emoji: '😐', label: 'Regular' },
  { emoji: '😔', label: 'Cansada' },
  { emoji: '😰', label: 'Agotada' },
];

function getDateLabel() {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [mood, setMood] = useState(null);
  const [stats, setStats] = useState({ habitsCompleted: 5, sleepHours: 6, streakDays: 3 });

  useFocusEffect(
    useCallback(() => {
      getHabits().then(setHabits);
      getMoodToday().then(setMood);
      getStats().then(setStats);
    }, [])
  );

  async function toggleHabit(id) {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = !h.done;
      return { ...h, done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
    });
    setHabits(updated);
    await saveHabits(updated);
  }

  async function selectMood(idx) {
    setMood(idx);
    await saveMoodToday(idx);
  }

  const doneCount = habits.filter(h => h.done).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient colors={['#EDE9FE', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.topBar}>
            <View style={styles.avatar}><Text style={styles.avatarTxt}>CF</Text></View>
            <Text style={styles.bell}>🔔</Text>
          </View>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.greeting}>Hola, Cielo 🌿</Text>
          <Text style={styles.subGreeting}>Llevas 2h 40min frente a pantallas hoy</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Alert */}
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Pausa sugerida</Text>
              <Text style={styles.alertText}>Tu agenda tiene 6 actividades hoy. ¿Quieres un bloque de descanso?</Text>
            </View>
          </View>

          {/* Mood */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>¿Cómo te sientes ahora?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m, i) => (
                <TouchableOpacity key={i} style={[styles.moodBtn, mood === i && styles.moodBtnSel]} onPress={() => selectMood(i)}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Tu semana hasta hoy</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{doneCount}/{habits.length}</Text>
                <Text style={styles.statLbl}>Hábitos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats.sleepHours}h</Text>
                <Text style={styles.statLbl}>Sueño</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>🔥{stats.streakDays}</Text>
                <Text style={styles.statLbl}>Racha días</Text>
              </View>
            </View>
          </View>

          {/* Habits */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Hábitos de hoy</Text>
            {habits.map(h => (
              <TouchableOpacity key={h.id} style={styles.habitRow} onPress={() => toggleHabit(h.id)}>
                <View style={[styles.check, h.done && styles.checkDone]}>
                  {h.done && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.habitLabel, h.done && styles.habitDone]}>{h.label}</Text>
                <View style={styles.streakPill}>
                  <Text style={styles.streakTxt}>{h.streak > 0 ? `🔥${h.streak}` : '+1'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisSuave },
  header: { padding: 24, paddingTop: 48, paddingBottom: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lilaDark, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: colors.blanco, fontWeight: '600', fontSize: 14 },
  bell: { fontSize: 20, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 18, width: 36, height: 36, textAlign: 'center', lineHeight: 36 },
  dateLabel: { fontSize: 11, color: colors.lilaDark, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.texto, marginBottom: 4 },
  subGreeting: { fontSize: 12, color: colors.textoMedio },
  body: { padding: 16, gap: 12 },
  alertBox: {
    backgroundColor: colors.amarilloLight, borderRadius: radius.sm,
    padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 3, borderLeftColor: colors.amarillo, marginBottom: 4,
  },
  alertIcon: { fontSize: 18 },
  alertTitle: { fontWeight: '600', fontSize: 12, color: '#92400E', marginBottom: 2 },
  alertText: { fontSize: 11, color: '#92400E', lineHeight: 16 },
  card: { backgroundColor: colors.blanco, borderRadius: radius.md, padding: 16, ...shadow.md },
  cardLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, color: colors.textoSuave, textTransform: 'uppercase', marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, backgroundColor: colors.lilaLight, borderRadius: radius.xs, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  moodBtnSel: { borderColor: colors.lilaDark, transform: [{ scale: 1.05 }] },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 9, color: colors.textoMedio, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.lilaLight, borderRadius: radius.xs, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '700', color: colors.lilaDark },
  statLbl: { fontSize: 9, color: colors.textoMedio, marginTop: 3 },
  habitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 10 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.lila, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.lilaDark, borderColor: colors.lilaDark },
  checkMark: { color: colors.blanco, fontSize: 12, fontWeight: '700' },
  habitLabel: { flex: 1, fontSize: 13, color: colors.texto },
  habitDone: { textDecorationLine: 'line-through', color: colors.textoSuave },
  streakPill: { backgroundColor: colors.lilaLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  streakTxt: { fontSize: 10, color: colors.textoMedio },
});
