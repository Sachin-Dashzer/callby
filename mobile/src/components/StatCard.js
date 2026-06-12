import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { formatDuration } from '../utils/formatDuration';

export default function StatCard({ icon, label, value, duration, color = Colors.primary, half = false }) {
  return (
    <View style={[s.card, half && s.half]}>
      <View style={[s.iconWrap, { backgroundColor: color + '18' }]}>
        <Text style={s.icon}>{icon}</Text>
      </View>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, { color }]}>{value ?? '—'}</Text>
      {duration !== undefined && (
        <Text style={s.duration}>{formatDuration(duration)}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  half:     { flex: 1, marginHorizontal: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  icon:     { fontSize: 20 },
  label:    { fontSize: 12, fontWeight: '500', color: '#64748B', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 },
  value:    { fontSize: 28, fontWeight: '800' },
  duration: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
