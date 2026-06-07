import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { saveCheckIn, updateStats } from '../storage';

const SLEEP_OPTIONS = ['Muy bien 😴', 'Bien', 'Regular', 'Mal 😞'];
const EMOTIONS = ['Cansancio', 'Ansiedad', 'Motivación', 'Estrés', 'Tristeza', 'Calma 🌿', 'Alegría', 'Irritabilidad'];

export default function CheckInScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [carga, setCarga] = useState(50);
  const [sleep, setSleep] = useState(null);
  const [emotions, setEmotions] = useState([]);

  function toggleEmotion(e) {
    setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  async function handleSave() {
    if (sleep === null) { Alert.alert('Falta un dato', 'Selecciona cómo dormiste.'); return; }
    await saveCheckIn({ carga, sleep: SLEEP_OPTIONS[sleep], emotions });
    const sleepMap = { 0: 8, 1: 7, 2: 6, 3: 4 };
    await updateStats({ sleepHours: sleepMap[sleep] });
    Alert.alert('¡Check-in guardado! 💚', `Carga: ${carga}%\nSueño: ${SLEEP_OPTIONS[sleep]}\nEmociones: ${emotions.join(', ') || 'ninguna'}`, [
      { text: 'Ver resumen', onPress: () => navigation.navigate('Home') },
    ]);
  }

  const dots = [0, 1, 2];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#D1FAE5', '#EDE9FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.title}>Check-in diario 💚</Text>
          <Text style={styles.sub}>3 preguntas rápidas · 2 minutos</Text>
        </LinearGradient>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {dots.map(i => (
            <View key={i} style={[styles.dot, i < step && styles.dotDone, i === step && styles.dotCurrent]} />
          ))}
        </View>

        <View style={styles.body}>
          {/* Q1: carga */}
          <View style={styles.section}>
            <Text style={styles.qLabel}>PREGUNTA 1 DE 3</Text>
            <Text style={styles.question}>¿Qué tan cargada sientes tu agenda hoy?</Text>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLbl}>Tranquila 🌿</Text>
              <Text style={styles.sliderLbl}>Al límite 🔥</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={carga}
              onValueChange={v => { setCarga(Math.round(v)); if (step < 1) setStep(1); }}
              minimumTrackTintColor={colors.lilaDark}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={colors.lilaDark}
            />
            <Text style={styles.sliderVal}>{carga}%</Text>
          </View>

          {/* Q2: sleep */}
          <View style={styles.section}>
            <Text style={styles.qLabel}>PREGUNTA 2 DE 3</Text>
            <Text style={styles.question}>¿Cómo dormiste anoche?</Text>
            <View style={styles.optionsRow}>
              {SLEEP_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.optChip, sleep === i && styles.optChipSel]}
                  onPress={() => { setSleep(i); if (step < 2) setStep(2); }}
                >
                  <Text style={[styles.optTxt, sleep === i && styles.optTxtSel]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Q3: emotions */}
          <View style={styles.section}>
            <Text style={styles.qLabel}>PREGUNTA 3 DE 3</Text>
            <Text style={styles.question}>¿Qué emociones sientes ahora? (elige varias)</Text>
            <View style={styles.emotionsWrap}>
              {EMOTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emotionChip, emotions.includes(e) && styles.emotionChipSel]}
                  onPress={() => toggleEmotion(e)}
                >
                  <Text style={[styles.emotionTxt, emotions.includes(e) && styles.emotionTxtSel]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.cta} onPress={handleSave}>
            <Text style={styles.ctaTxt}>Guardar y ver mi resumen →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisSuave },
  header: { padding: 24, paddingTop: 48, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: colors.texto, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.textoMedio },
  progressRow: { flexDirection: 'row', gap: 6, padding: 16, paddingBottom: 0 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  dotDone: { backgroundColor: colors.lilaDark },
  dotCurrent: { backgroundColor: colors.lila },
  body: { padding: 16, gap: 8 },
  section: { backgroundColor: colors.blanco, borderRadius: radius.md, padding: 16, marginBottom: 8, ...shadow.sm },
  qLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.lilaDark, marginBottom: 8 },
  question: { fontSize: 15, fontWeight: '600', color: colors.texto, marginBottom: 14, lineHeight: 22 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLbl: { fontSize: 11, color: colors.textoSuave },
  slider: { width: '100%', height: 40 },
  sliderVal: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.lilaDark },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip: {
    backgroundColor: colors.blanco, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  optChipSel: { backgroundColor: colors.lilaDark, borderColor: colors.lilaDark },
  optTxt: { fontSize: 13, color: colors.texto },
  optTxtSel: { color: colors.blanco },
  emotionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: {
    backgroundColor: colors.blanco, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7,
  },
  emotionChipSel: { backgroundColor: colors.verdeLight, borderColor: colors.verdeDark },
  emotionTxt: { fontSize: 13, color: colors.texto },
  emotionTxtSel: { color: colors.verdeDark },
  cta: {
    backgroundColor: colors.lilaDark, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: colors.lilaDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  ctaTxt: { color: colors.blanco, fontWeight: '600', fontSize: 15 },
});
