import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import ContactAvatar from '../components/ContactAvatar';
import SimPickerModal from '../components/SimPickerModal';

const MENU_SECTIONS = [
  {
    title: 'Tools',
    items: [
      { icon: '📤', label: 'Export CSV',    sublabel: 'Download your call history', key: 'export' },
      { icon: '📋', label: 'Templates',     sublabel: 'Note & message templates',    key: 'templates' },
      { icon: '🔔', label: 'Notifications', sublabel: 'Call alerts & reminders',     key: 'notifications' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: '🔒', label: 'SIM Settings',  sublabel: 'Choose which SIM to track', key: 'sim' },
      { icon: '🌙', label: 'Dark Mode',      sublabel: 'Coming soon',               key: 'darkmode',  disabled: true },
      { icon: '❓', label: 'Help & Support', sublabel: 'FAQs and contact us',       key: 'help' },
      { icon: '🚪', label: 'Logout',         sublabel: null,                        key: 'logout',    danger: true },
    ],
  },
];

export default function MoreScreen({ onLogout }) {
  const [user, setUser]           = useState(null);
  const [showSimPicker, setShowSimPicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user').then((s) => { if (s) setUser(JSON.parse(s)); });
  }, []);

  const quickStats = user?.stats || {};

  const handleMenu = (key) => {
    if (key === 'logout') {
      Alert.alert('Logout?', 'You will need to log in again.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'user', 'tracked_sim_id']);
            onLogout?.();
          },
        },
      ]);
    } else if (key === 'sim') {
      setShowSimPicker(true);
    } else if (key === 'export') {
      Alert.alert('Coming Soon', 'CSV export will be available in the next update.');
    } else if (key === 'help') {
      Alert.alert('Help & Support', 'For help, contact your admin or write to support@calltracker.app');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <ContactAvatar name={user?.name || 'User'} number="" size={56} />
          <View style={s.profileMid}>
            <Text style={s.profileName}>{user?.name || 'Loading…'}</Text>
            <Text style={s.profileRole}>{user?.role || 'Sales Agent'}</Text>
            <Text style={s.profilePhone}>{user?.phone || ''}</Text>
          </View>
          <View style={[s.verifiedBadge, { backgroundColor: Colors.successBg }]}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.success }}>Active</Text>
          </View>
        </View>

        {/* Quick stats strip */}
        <View style={s.statsStrip}>
          {[
            { label: 'Today',    value: quickStats.today    || 0 },
            { label: 'This Week',value: quickStats.week     || 0 },
            { label: 'This Mon.', value: quickStats.month   || 0 },
          ].map(({ label, value }) => (
            <View key={label} style={s.statsItem}>
              <Text style={s.statsValue}>{value}</Text>
              <Text style={s.statsLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    s.menuItem,
                    idx < section.items.length - 1 && s.menuItemBorder,
                    item.disabled && { opacity: 0.4 },
                  ]}
                  onPress={() => !item.disabled && handleMenu(item.key)}
                  activeOpacity={item.disabled ? 1 : 0.7}
                >
                  <View style={[s.menuIcon, { backgroundColor: item.danger ? Colors.dangerBg : Colors.primaryLight }]}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View style={s.menuMid}>
                    <Text style={[s.menuLabel, item.danger && { color: Colors.danger }]}>{item.label}</Text>
                    {item.sublabel && <Text style={s.menuSub}>{item.sublabel}</Text>}
                  </View>
                  {!item.danger && <Text style={s.menuArrow}>›</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={s.version}>CallTracker v1.0 · Built with ♥</Text>
      </ScrollView>

      <SimPickerModal visible={showSimPicker} onClose={() => setShowSimPicker(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8F9FB' },
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 40 },

  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, gap: 12 },
  profileMid:  { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  profileRole: { fontSize: 13, color: '#64748B', marginTop: 2 },
  profilePhone:{ fontSize: 12, color: '#94A3B8', marginTop: 1 },
  verifiedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },

  statsStrip:  { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, overflow: 'hidden' },
  statsItem:   { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  statsValue:  { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statsLabel:  { fontSize: 11, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, marginBottom: 8 },
  sectionCard:  { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },

  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuIcon:       { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuMid:        { flex: 1 },
  menuLabel:      { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  menuSub:        { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  menuArrow:      { fontSize: 20, color: '#CBD5E1' },

  version: { textAlign: 'center', fontSize: 12, color: '#CBD5E1', marginTop: 8 },
});
