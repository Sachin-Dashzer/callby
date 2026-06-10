import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'calls', label: 'Calls', icon: '📞' },
  { key: 'leads', label: 'Leads', icon: '🎯' }
];

export default function TabBar({ active, onChange }) {
  return (
    <View style={styles.bar}>
      {TABS.map((t) => (
        <TouchableOpacity key={t.key} style={styles.tab} onPress={() => onChange(t.key)}>
          <Text style={styles.icon}>{t.icon}</Text>
          <Text style={[styles.label, active === t.key && styles.activeLabel]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    paddingBottom: 8,
    paddingTop: 8
  },
  tab: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 20 },
  label: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  activeLabel: { color: '#e94560', fontWeight: '600' }
});
