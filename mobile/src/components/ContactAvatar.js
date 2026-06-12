import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AVATAR_COLORS } from '../theme/colors';

function seedColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name, number) {
  if (name && name.length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (number) return number.slice(-2);
  return '?';
}

export default function ContactAvatar({ name, number, size = 44 }) {
  const bg  = seedColor(name || number);
  const txt = initials(name, number);

  return (
    <View style={[s.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[s.text, { fontSize: size * 0.38 }]}>{txt}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  text:   { color: '#fff', fontWeight: '700' },
});
