import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>CallTrack</Text>
        <Text style={styles.subtitle}>Employee Portal</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="employee@company.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>employee1@calltrack.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  inner: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#e94560', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 32 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#16213e', borderRadius: 16, padding: 24 },
  label: { color: '#d1d5db', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14
  },
  btn: { backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 14, marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
  hint: { color: '#6b7280', textAlign: 'center', fontSize: 11, marginTop: 16 }
});
