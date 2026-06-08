import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { getHabits, saveHabits, getSuggestedHabits } from '../storage';

export default function HabitsEditScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [showSuggested, setShowSuggested] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getHabits().then(setHabits);
    }, [])
  );

  const suggested = getSuggestedHabits().filter(s => !habits.find(h => h.label === s.label));

  async function addHabit(label) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (habits.find(h => h.label.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Hábito duplicado', 'Ya tienes ese hábito en tu lista.');
      return;
    }
    const newH = { id: Date.now().toString(), label: trimmed, done: false, streak: 0 };
    const updated = [...habits, newH];
    setHabits(updated);
    await saveHabits(updated);
    setNewHabit('');
  }

  async function removeHabit(id) {
    Alert.alert('Eliminar hábito', '¿Segura que quieres eliminar este hábito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const updated = habits.filter(h => h.id !== id);
          setHabits(updated);
          await saveHabits(updated);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#EDE9FE', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mis hábitos ✏️</Text>
          <Text style={styles.sub}>Personaliza, agrega o elimina hábitos</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Hábitos actuales */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TUS HÁBITOS ACTUALES ({habits.length})</Text>
            {habits.length === 0 && (
              <Text style={{ color: colors.textoMedio, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                No tienes hábitos todavía. Agrega uno abajo.
              </Text>
            )}
            {habits.map(h => (
              <View key={h.id} style={styles.habitItem}>
                <View style={styles.habitDot} />
                <Text style={styles.habitLabel}>{h.label}</Text>
                {h.streak > 0 && (
                  <View style={styles.streakPill}>
                    <Text style={styles.streakTxt}>🔥{h.streak}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => removeHabit(h.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Agregar hábito propio */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>AGREGAR HÁBITO PROPIO</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newHabit}
                onChangeText={setNewHabit}
                placeholder="Escribe tu hábito..."
                placeholderTextColor={colors.textoSuave}
                returnKeyType="done"
                onSubmitEditing={() => addHabit(newHabit)}
                maxLength={60}
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => addHabit(newHabit)}>
                <Text style={styles.addBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hábitos sugeridos */}
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setShowSuggested(!showSuggested)} style={styles.sugHeader}>
              <Text style={styles.cardLabel}>HÁBITOS SUGERIDOS ({suggested.length})</Text>
              <Text style={styles.sugToggle}>{showSuggested ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showSuggested && (
              <View style={{ gap: 8, marginTop: 8 }}>
                {suggested.length === 0 && (
                  <Text style={{ color: colors.textoMedio, fontSize: 13 }}>Ya tienes todos los hábitos sugeridos.</Text>
                )}
                {suggested.map(s => (
                  <TouchableOpacity key={s.id} style={styles.sugItem} onPress={() => addHabit(s.label)}>
                    <Text style={styles.sugLabel}>{s.label}</Text>
                    <Text style={styles.sugAdd}>+ Agregar</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnTxt}>Listo — guardar cambios ✓</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisSuave },
  header: { padding: 24, paddingTop: 52, paddingBottom: 20 },
  backBtn: { marginBottom: 12 },
  backTxt: { color: colors.lilaDark, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: colors.texto, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.textoMedio },
  body: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.blanco, borderRadius: radius.md, padding: 16, ...shadow.sm },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textoSuave, textTransform: 'uppercase', marginBottom: 12 },
  habitItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  habitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lilaDark },
  habitLabel: { flex: 1, fontSize: 14, color: colors.texto },
  streakPill: { backgroundColor: colors.lilaLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  streakTxt: { fontSize: 10, color: colors.textoMedio },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  deleteTxt: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1, backgroundColor: colors.lilaLight, borderRadius: radius.xs,
    padding: 12, fontSize: 14, color: colors.texto,
    borderWidth: 1.5, borderColor: colors.lila,
  },
  addBtn: {
    width: 46, backgroundColor: colors.lilaDark, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnTxt: { color: colors.blanco, fontSize: 24, fontWeight: '300' },
  sugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sugToggle: { color: colors.lilaDark, fontWeight: '700' },
  sugItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.lilaLight, borderRadius: radius.xs, padding: 12 },
  sugLabel: { fontSize: 13, color: colors.texto, flex: 1 },
  sugAdd: { fontSize: 12, color: colors.lilaDark, fontWeight: '600' },
  doneBtn: {
    backgroundColor: colors.verdeDark, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: colors.verdeDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  doneBtnTxt: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
});
