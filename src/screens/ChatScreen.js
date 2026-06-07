import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { getCheckIn, getMoodToday, getHabits, getStats } from '../storage';
import { sendMessage, checkServerHealth } from '../services/friciAI';

const SUGGESTIONS = [
  '🫁 Quiero hacer una respiración',
  '🧘 Necesito una pausa activa',
  '📅 ¿Cómo va mi día?',
  '😴 Tips para dormir mejor',
  '💡 ¿Qué hábito priorizo hoy?',
];

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

function Message({ msg }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);
  const isBot = msg.role === 'bot' || msg.role === 'assistant';
  return (
    <Animated.View style={[styles.msgWrap, isBot ? styles.msgWrapBot : styles.msgWrapUser, { opacity: fadeAnim }]}>
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        {msg.typing
          ? <TypingDots />
          : <Text style={[styles.bubbleTxt, !isBot && styles.bubbleTxtUser]}>{msg.text}</Text>
        }
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [serverOk, setServerOk] = useState(null);
  const [userContext, setUserContext] = useState({});
  const historyRef = useRef([]);
  const scrollRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadContextAndInit();
    }, [])
  );

  async function loadContextAndInit() {
    // Carga todo el contexto del usuario
    const [checkin, mood, habits, stats] = await Promise.all([
      getCheckIn(), getMoodToday(), getHabits(), getStats(),
    ]);
    const ctx = { checkin, mood, habits, stats };
    setUserContext(ctx);

    // Verifica que el servidor esté corriendo
    const health = await checkServerHealth();
    setServerOk(!!health?.api_key_configured);

    if (!health) {
      setMessages([{
        id: 1, role: 'bot',
        text: '⚠️ El servidor FRICI no está corriendo. Ejecuta primero:\n\npython server.py\n\nEn la carpeta del proyecto.',
      }]);
      return;
    }

    if (!health.api_key_configured) {
      setMessages([{
        id: 1, role: 'bot',
        text: '⚠️ Falta configurar la API key de Anthropic en server.py.\n\nAbre ese archivo y pega tu key donde dice PEGA_TU_API_KEY_AQUI.',
      }]);
      return;
    }

    // Mensaje de bienvenida personalizado
    const greetingCtx = buildGreeting(ctx);
    setMessages([{ id: 1, role: 'bot', text: greetingCtx }]);
    historyRef.current = [];
  }

  function buildGreeting(ctx) {
    const { mood, checkin, habits } = ctx;
    const moods = ['bien', 'un poco regular', 'cansada', 'agotada'];
    const moodTxt = mood !== null && mood !== undefined ? `te sientes ${moods[mood] || 'así'}` : 'no has registrado tu ánimo todavía';

    if (checkin?.carga > 70 && checkin?.emotions?.some(e => ['Estrés', 'Ansiedad', 'Cansancio'].includes(e))) {
      return `Hola 💚 Veo que hoy tienes una carga alta (${checkin.carga}%) y ${moodTxt}. Estoy aquí. ¿Qué necesitas en este momento?`;
    }

    const doneHabits = habits?.filter(h => h.done).length ?? 0;
    const totalHabits = habits?.length ?? 0;

    if (doneHabits === totalHabits && totalHabits > 0) {
      return `¡Hola! 🌿 Completaste todos tus hábitos de hoy — eso merece un reconocimiento. ¿En qué puedo acompañarte ahora?`;
    }

    return `Hola 💚 Hoy ${moodTxt}. ¿Cómo puedo ayudarte?`;
  }

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function submit(text) {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    const typingId = Date.now() + 1;

    setMessages(prev => [...prev, userMsg, { id: typingId, role: 'bot', typing: true }]);
    setSuggestionsVisible(false);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const reply = await sendMessage(text.trim(), historyRef.current, userContext);

      // Actualiza el historial para que Claude recuerde la conversación
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', text: text.trim() },
        { role: 'assistant', text: reply },
      ].slice(-20); // máximo 20 mensajes de contexto

      setMessages(prev => prev.filter(m => m.id !== typingId).concat({ id: Date.now(), role: 'bot', text: reply }));
      scrollToBottom();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now(), role: 'bot',
        text: `Ocurrió un error al contactar el servidor 😔\n\n${err.message}`,
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
      {/* Header */}
      <LinearGradient colors={['#EDE9FE', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.botAvatar}><Text style={{ fontSize: 20 }}>🌿</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.botName}>FRICI</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: serverOk === false ? '#EF4444' : colors.verdeDark }]} />
            <Text style={[styles.statusTxt, { color: serverOk === false ? '#EF4444' : colors.verdeDark }]}>
              {serverOk === null ? 'Conectando...' : serverOk ? 'IA activa · aprende de ti' : 'Sin conexión al servidor'}
            </Text>
          </View>
        </View>
        {/* Indicador de contexto cargado */}
        {userContext.checkin && (
          <View style={styles.contextBadge}>
            <Text style={styles.contextBadgeTxt}>📊 Con tu contexto</Text>
          </View>
        )}
      </LinearGradient>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={{ padding: 14, paddingBottom: 4 }} showsVerticalScrollIndicator={false}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
      </ScrollView>

      {/* Suggestion chips — solo al inicio */}
      {suggestionsVisible && serverOk && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugRow}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.sugChip} onPress={() => submit(s)}>
              <Text style={styles.sugTxt}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>FRICI es apoyo, no sustituye atención médica o psicológica profesional.</Text>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={loading ? 'FRICI está pensando...' : 'Cuéntale a FRICI...'}
          placeholderTextColor={colors.textoSuave}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => submit(input)}
          returnKeyType="send"
          multiline
          editable={!loading}
        />
        <TouchableOpacity style={[styles.sendBtn, loading && styles.sendBtnDisabled]} onPress={() => submit(input)} disabled={loading}>
          <Text style={styles.sendIcon}>{loading ? '…' : '↑'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grisSuave },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 48 },
  botAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.lilaDark, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.lilaLight,
  },
  botName: { fontSize: 16, fontWeight: '700', color: colors.texto },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 11 },
  contextBadge: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  contextBadgeTxt: { fontSize: 10, color: colors.lilaDark, fontWeight: '500' },
  chat: { flex: 1 },
  msgWrap: { marginBottom: 8 },
  msgWrapBot: { alignItems: 'flex-start' },
  msgWrapUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '88%', borderRadius: 18, padding: 12 },
  bubbleBot: { backgroundColor: colors.blanco, borderBottomLeftRadius: 4, ...shadow.sm },
  bubbleUser: { backgroundColor: colors.lilaDark, borderBottomRightRadius: 4 },
  bubbleTxt: { fontSize: 13.5, color: colors.texto, lineHeight: 21 },
  bubbleTxtUser: { color: colors.blanco },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textoSuave, opacity: 0.5 },
  sugRow: { backgroundColor: colors.grisSuave, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  sugChip: {
    backgroundColor: colors.blanco, borderWidth: 1.5, borderColor: colors.lila,
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  sugTxt: { fontSize: 12, color: colors.lilaDark, fontWeight: '500' },
  disclaimer: { fontSize: 9.5, color: colors.textoSuave, textAlign: 'center', padding: 8, paddingBottom: 4, backgroundColor: colors.grisSuave },
  inputRow: {
    flexDirection: 'row', gap: 8, padding: 10, paddingBottom: 16,
    backgroundColor: colors.blanco, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: colors.grisSuave, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13,
    color: colors.texto, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, backgroundColor: colors.lilaDark, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textoSuave },
  sendIcon: { color: colors.blanco, fontSize: 16, fontWeight: '700' },
});
