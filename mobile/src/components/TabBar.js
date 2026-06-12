import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

const TABS = [
  { key: 'calls',     label: 'Calls',      icon: '📞' },
  { key: 'analytics', label: 'Analytics',  icon: '📊' },
  { key: 'followups', label: 'Follow-ups', icon: '📅' },
  { key: 'contacts',  label: 'Contacts',   icon: '👥' },
  { key: 'more',      label: 'More',       icon: '⋯'  },
];

function TabItem({ tab, isActive, badge, onPress }) {
  // Only use native driver — no color animations to avoid driver mixing crash
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () =>
    Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 5 }).start();

  return (
    <TouchableOpacity
      style={s.tab}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      {/* Outer view handles background color (plain style, no animation driver conflict) */}
      <View style={[s.iconWrap, isActive && s.iconWrapActive]}>
        {/* Inner Animated.View handles scale with native driver only */}
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={[s.icon, isActive && s.iconActive]}>{tab.icon}</Text>
        </Animated.View>
        {badge > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ active, onChange, badges = {} }) {
  return (
    <View style={s.bar}>
      {TABS.map((t) => (
        <TabItem
          key={t.key}
          tab={t}
          isActive={active === t.key}
          badge={badges[t.key] || 0}
          onPress={() => onChange(t.key)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    paddingBottom: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  tab:          { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap:     { width: 44, height: 30, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  iconWrapActive:{ backgroundColor: Colors.primaryLight },
  icon:         { fontSize: 18, color: '#94A3B8' },
  iconActive:   { color: Colors.primary },
  label:        { color: '#94A3B8', fontSize: 10, fontWeight: '500' },
  labelActive:  { color: Colors.primary, fontWeight: '700' },
  badge:        { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  badgeText:    { fontSize: 9, fontWeight: '700', color: '#fff' },
});
