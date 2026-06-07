import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export default function LoginScreen({ navigation }) {
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
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>CallTrack</Text>
        <Text style={styles.subtitle}>Employee Portal</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="employee@company.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Demo: employee1@calltrack.com / password123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#16213e', borderRadius: 16, padding: 28 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#9ca3af', textAlign: 'center', fontSize: 13, marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { color: '#d1d5db', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1a1a2e' },
  btn: { backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 13, marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
  hint: { color: '#6b7280', textAlign: 'center', fontSize: 11, marginTop: 16 }
});
