import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CALL_TYPE } from '../theme/colors';

export default function CallDirectionBadge({ type, size = 'sm' }) {
  const t = CALL_TYPE[type] || { fg: '#94A3B8', bg: '#F1F5F9', label: type, icon: '?' };
  const pad = size === 'sm' ? { paddingHorizontal: 6, paddingVertical: 2 } : { paddingHorizontal: 10, paddingVertical: 4 };
  const fs  = size === 'sm' ? 11 : 13;

  return (
    <View style={[s.pill, pad, { backgroundColor: t.bg }]}>
      <Text style={[s.text, { color: t.fg, fontSize: fs }]}>
        {t.icon} {t.label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { borderRadius: 999, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  text: { fontWeight: '600' },
});
