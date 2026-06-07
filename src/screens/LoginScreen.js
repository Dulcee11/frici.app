import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUser, saveUser } from '../storage';
import { colors, radius } from '../theme';

// Guarda el logo en assets/logo.png para que aparezca aquí
let LOGO;
try { LOGO = require('../../assets/logo.png'); } catch { LOGO = null; }

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterScreen onRegistered={onLogin} onBack={() => setShowRegister(false)} />;
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const user = await getUser();
    setLoading(false);

    if (!user) {
      Alert.alert('Sin cuenta', '¿No tienes cuenta? Regístrate primero.');
      return;
    }
    if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
      Alert.alert('Correo incorrecto', 'El correo no coincide con la cuenta registrada.');
      return;
    }
    if (user.password !== password) {
      Alert.alert('Contraseña incorrecta', 'Verifica tu contraseña e intenta de nuevo.');
      return;
    }
    onLogin(user);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        {LOGO
          ? <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          : <View style={styles.logoFallback}><Text style={styles.logoTxt}>FRICI 🌿</Text><Text style={styles.logoSub}>Tu bienestar digital, en tus manos</Text></View>
        }

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Correo electrónico:</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textoSuave}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Contraseña:</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            placeholderTextColor={colors.textoSuave}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnPrimaryTxt}>{loading ? 'Verificando...' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerTxt}>¿No tienes cuenta?</Text>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowRegister(true)}>
              <Text style={styles.btnSecondaryTxt}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Registro (mismo archivo, componente separado) ──────────────────────────

function RegisterScreen({ onRegistered, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const GENDERS = ['Femenino', 'Masculino', 'No binario', 'Prefiero no decir'];

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !gender) {
      Alert.alert('Campos incompletos', 'Completa nombre, correo, contraseña y género.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const user = {
      name: name.trim(),
      firstName: name.trim().split(' ')[0],
      email: email.trim().toLowerCase(),
      password,
      gender,
      birthDate,
      registeredAt: new Date().toISOString(),
    };
    await saveUser(user);
    setLoading(false);
    onRegistered(user);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {LOGO
          ? <Image source={LOGO} style={[styles.logo, { height: 120 }]} resizeMode="contain" />
          : <View style={[styles.logoFallback, { marginBottom: 4 }]}><Text style={styles.logoTxt}>FRICI 🌿</Text></View>
        }

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear cuenta</Text>

          <Text style={styles.fieldLabel}>Nombre completo:</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.textoSuave} />

          <Text style={styles.fieldLabel}>Correo electrónico:</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor={colors.textoSuave} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Contraseña:</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.textoSuave} secureTextEntry />

          <Text style={styles.fieldLabel}>Género:</Text>
          <View style={styles.genderRow}>
            {GENDERS.map(g => (
              <TouchableOpacity key={g} style={[styles.genderChip, gender === g && styles.genderChipSel]} onPress={() => setGender(g)}>
                <Text style={[styles.genderTxt, gender === g && styles.genderTxtSel]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Fecha de nacimiento:</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textoSuave}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnPrimaryTxt}>{loading ? 'Registrando...' : 'Crear mi cuenta'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.lilaDark, fontSize: 13 }}>← Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE9FE' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  logo: { width: 220, height: 180, marginBottom: 8 },
  logoFallback: { alignItems: 'center', marginBottom: 16 },
  logoTxt: { fontSize: 32, fontWeight: '800', color: colors.lilaDark },
  logoSub: { fontSize: 13, color: colors.textoMedio, marginTop: 4 },
  card: {
    width: '100%', backgroundColor: colors.blanco,
    borderRadius: radius.md, padding: 24,
    shadowColor: colors.lilaDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.texto, textAlign: 'center', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.lilaDark, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F3F0FF', borderRadius: radius.sm,
    padding: 12, fontSize: 14, color: colors.texto,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)',
  },
  btnPrimary: {
    backgroundColor: colors.lilaDark, borderRadius: radius.sm,
    padding: 14, alignItems: 'center', marginTop: 24,
    shadowColor: colors.lilaDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  btnPrimaryTxt: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8, flexWrap: 'wrap' },
  registerTxt: { fontSize: 13, color: colors.textoMedio },
  btnSecondary: {
    borderWidth: 1.5, borderColor: colors.lilaDark, borderRadius: radius.xs,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  btnSecondaryTxt: { color: colors.lilaDark, fontWeight: '600', fontSize: 13 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  genderChip: {
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.2)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#F3F0FF',
  },
  genderChipSel: { backgroundColor: colors.lilaDark, borderColor: colors.lilaDark },
  genderTxt: { fontSize: 12.5, color: colors.texto },
  genderTxtSel: { color: colors.blanco, fontWeight: '600' },
});
