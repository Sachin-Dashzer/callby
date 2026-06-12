import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import ContactAvatar from '../components/ContactAvatar';
import { Colors } from '../theme/colors';
import { formatDuration } from '../utils/formatDuration';

function buildContacts(calls) {
  const map = {};
  calls.forEach((c) => {
    const key = c.contactNumber;
    if (!map[key]) {
      map[key] = {
        contactName:   c.contactName || '',
        contactNumber: c.contactNumber,
        totalCalls:    0,
        incoming:      0,
        outgoing:      0,
        missed:        0,
        totalDuration: 0,
        lastCall:      c.timestamp,
      };
    }
    const e = map[key];
    e.totalCalls++;
    e.totalDuration += c.duration || 0;
    if (c.callType === 'incoming') e.incoming++;
    else if (c.callType === 'outgoing') e.outgoing++;
    else e.missed++;
    if (new Date(c.timestamp) > new Date(e.lastCall)) e.lastCall = c.timestamp;
  });
  return Object.values(map).sort((a, b) => b.totalCalls - a.totalCalls);
}

function ContactRow({ contact, onPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={() => onPress?.(contact)} activeOpacity={0.75}>
      <ContactAvatar name={contact.contactName} number={contact.contactNumber} size={46} />
      <View style={s.rowMid}>
        <Text style={s.rowName} numberOfLines={1}>{contact.contactName || contact.contactNumber}</Text>
        {contact.contactName ? <Text style={s.rowNum}>{contact.contactNumber}</Text> : null}
        <View style={s.rowMeta}>
          <Text style={[s.metaDot, { color: Colors.success }]}>↙{contact.incoming}</Text>
          <Text style={[s.metaDot, { color: Colors.warning }]}>↗{contact.outgoing}</Text>
          <Text style={[s.metaDot, { color: Colors.danger }]}>✕{contact.missed}</Text>
        </View>
      </View>
      <View style={s.rowRight}>
        <Text style={s.callCount}>{contact.totalCalls}</Text>
        <Text style={s.callCountLabel}>calls</Text>
        <Text style={s.dur}>{formatDuration(contact.totalDuration)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ContactDetailSheet({ contact, onClose }) {
  if (!contact) return null;
  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={s.sheetHandle} />
        <View style={{ alignItems: 'center', paddingBottom: 16 }}>
          <ContactAvatar name={contact.contactName} number={contact.contactNumber} size={64} />
          <Text style={s.sheetName}>{contact.contactName || contact.contactNumber}</Text>
          {contact.contactName ? <Text style={s.sheetNum}>{contact.contactNumber}</Text> : null}
        </View>

        <View style={s.statRow}>
          {[
            { val: contact.incoming,                  label: 'Incoming',  col: Colors.success },
            { val: contact.outgoing,                  label: 'Outgoing',  col: Colors.warning },
            { val: contact.missed,                    label: 'Missed',    col: Colors.danger  },
            { val: formatDuration(contact.totalDuration), label: 'Talk time', col: Colors.primary },
          ].map(({ val, label, col }) => (
            <View key={label} style={s.statItem}>
              <Text style={[s.statVal, { color: col }]}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.sheetActions}>
          <TouchableOpacity style={s.actionCall} onPress={() => Linking.openURL(`tel:${contact.contactNumber}`).catch(() => {})}>
            <Text style={s.actionCallText}>📞  Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionWA} onPress={() => Linking.openURL(`whatsapp://send?phone=${(contact.contactNumber||'').replace(/\D/g,'')}`).catch(() => {})}>
            <Text style={s.actionWAText}>💬  WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const SORT_OPTIONS = [
  { key: 'calls',  label: 'Most calls'   },
  { key: 'recent', label: 'Most recent'  },
  { key: 'alpha',  label: 'A → Z'        },
  { key: 'dur',    label: 'Longest talk' },
];

export default function ContactsScreen() {
  const [calls, setCalls]       = useState([]);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('calls');
  const [showSort, setShowSort] = useState(false);
  const [userId, setUserId]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async (uid) => {
    try {
      const res = await api.get(`/api/calls/employee/${uid}`, { params: { page: 1, limit: 500 } });
      setCalls(res.data.data.calls || []);
    } catch {}
  };

  useEffect(() => {
    AsyncStorage.getItem('user').then((str) => {
      if (str) { const u = JSON.parse(str); setUserId(u._id); load(u._id); }
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) await load(userId);
    setRefreshing(false);
  }, [userId]);

  const contacts = buildContacts(calls).sort((a, b) => {
    if (sort === 'recent') return new Date(b.lastCall) - new Date(a.lastCall);
    if (sort === 'alpha')  return (a.contactName || a.contactNumber).localeCompare(b.contactName || b.contactNumber);
    if (sort === 'dur')    return b.totalDuration - a.totalDuration;
    return b.totalCalls - a.totalCalls;
  });
  const displayed = search.trim()
    ? contacts.filter((c) =>
        (c.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
        c.contactNumber.includes(search)
      )
    : contacts;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      <View style={s.header}>
        <Text style={s.heading}>Contacts</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={s.countChip}>
            <Text style={s.countText}>{contacts.length} unique</Text>
          </View>
          <TouchableOpacity
            style={[s.countChip, showSort && { backgroundColor: Colors.primaryLight, borderColor: Colors.primary }]}
            onPress={() => setShowSort(!showSort)}
          >
            <Text style={{ fontSize: 12, color: showSort ? Colors.primary : '#64748B', fontWeight: '600' }}>⇅</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSort && (
        <View style={s.sortDrop}>
          {SORT_OPTIONS.map((o) => (
            <TouchableOpacity key={o.key} style={[s.sortItem, sort === o.key && s.sortItemActive]}
              onPress={() => { setSort(o.key); setShowSort(false); }}>
              <Text style={[s.sortItemText, sort === o.key && { color: Colors.primary, fontWeight: '700' }]}>{o.label}</Text>
              {sort === o.key && <Text style={{ color: Colors.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search name or number…"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(c) => c.contactNumber}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => <ContactRow contact={item} onPress={setSelected} />}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyText}>{search ? 'No contacts found' : 'No call history yet'}</Text>
          </View>
        }
      />

      <ContactDetailSheet contact={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8F9FB' },

  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  countChip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  countText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 44 },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  clearBtn:    { color: '#94A3B8', fontSize: 16, padding: 4 },

  list:    { paddingHorizontal: 16, paddingBottom: 40 },
  sep:     { height: 1, backgroundColor: '#F1F5F9', marginLeft: 74 },

  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, backgroundColor: '#fff', borderRadius: 0 },
  rowMid:  { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  rowNum:  { fontSize: 12, color: '#64748B', marginTop: 1 },
  rowMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metaDot: { fontSize: 12, fontWeight: '600' },
  rowRight:{ alignItems: 'flex-end' },
  callCount: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  callCountLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  dur:     { fontSize: 11, color: '#64748B', marginTop: 2 },

  sortDrop:    { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, overflow: 'hidden', elevation: 4 },
  sortItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sortItemActive: { backgroundColor: Colors.primaryLight },
  sortItemText:{ fontSize: 14, color: '#64748B' },
  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B' },

  // Detail sheet
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetName: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 10 },
  sheetNum:  { fontSize: 14, color: '#64748B', marginTop: 4 },

  statRow:  { flexDirection: 'row', marginVertical: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 22, fontWeight: '800' },
  statLabel:{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500', textTransform: 'uppercase' },

  sheetActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionCall:   { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionCallText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionWA:     { flex: 1, backgroundColor: '#25D366' + '18', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#25D366' + '44' },
  actionWAText: { color: '#128C7E', fontSize: 15, fontWeight: '700' },
});
