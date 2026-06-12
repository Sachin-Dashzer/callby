import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getTagStyle } from '../utils/tagColors';

export default function TagChip({ label, selected, onPress, size = 'md' }) {
  const t   = getTagStyle(label);
  const pad = size === 'sm'
    ? { paddingHorizontal: 7, paddingVertical: 2 }
    : { paddingHorizontal: 10, paddingVertical: 5 };
  const fs  = size === 'sm' ? 11 : 12;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.chip, pad,
        selected
          ? { backgroundColor: t.bg, borderColor: t.fg, borderWidth: 1.5 }
          : { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', borderWidth: 1 },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[s.text, { color: selected ? t.fg : '#64748B', fontSize: fs }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: { borderRadius: 999, marginRight: 6, marginBottom: 6 },
  text: { fontWeight: '600' },
});
