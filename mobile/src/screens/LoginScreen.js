import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { C } from '../theme';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password });
      const { token, user } = res.data.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      onLogin();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Connection error. Check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Text style={s.logoIcon}>📞</Text>
          </View>
          <Text style={s.logoText}>CallTrack</Text>
          <Text style={s.tagline}>Employee Portal</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in</Text>

          <Text style={s.label}>Email address</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="employee@company.com"
            placeholderTextColor={C.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[s.label, { marginTop: 14 }]}>Password</Text>
          <View style={s.passWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={s.eyeText}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.hint}>Demo: employee1@calltrack.com / password123</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  inner:      { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  logoWrap:   { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoIcon:   { fontSize: 32 },
  logoText:   { fontSize: 28, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  tagline:    { color: C.textSec, fontSize: 13, marginTop: 2 },

  card:       { width: '100%', maxWidth: 400, backgroundColor: C.surface, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardTitle:  { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 20 },

  label:      { color: C.textSec, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input:      { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 0 },

  passWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  eyeBtn:     { paddingHorizontal: 4 },
  eyeText:    { fontSize: 18 },

  btn:        { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, marginTop: 22, alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  hint:       { color: C.textMuted, textAlign: 'center', fontSize: 11, marginTop: 20 },
});
