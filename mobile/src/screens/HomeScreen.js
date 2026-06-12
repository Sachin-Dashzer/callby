import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { syncCallLogs, getLastSyncTime } from '../services/callLogService';
import { C, TYPE } from '../theme';

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatCard({ label, value, color, bg }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={[s.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function CallRow({ call }) {
  const t = TYPE[call.callType] || { fg: C.textMuted, bg: C.bg, label: call.callType };
  return (
    <View style={s.callRow}>
      <View style={[s.callTypeBadge, { backgroundColor: t.bg }]}>
        <Text style={[s.callTypeIcon]}>
          {call.callType === 'incoming' ? '↙' : call.callType === 'outgoing' ? '↗' : call.callType === 'missed' ? '↙' : '✕'}
        </Text>
      </View>
      <View style={s.callInfo}>
        <Text style={s.callName}>{call.contactName || 'Unknown'}</Text>
        <Text style={s.callNumber}>{call.contactNumber}</Text>
      </View>
      <View style={s.callRight}>
        <View style={[s.typePill, { backgroundColor: t.bg }]}>
          <Text style={[s.typePillText, { color: t.fg }]}>{t.label}</Text>
        </View>
        <Text style={s.callDur}>{formatDuration(call.duration)}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ onLogout }) {
  const [user, setUser]         = useState(null);
  const [calls, setCalls]       = useState([]);
  const [leads, setLeads]       = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const u = userStr ? JSON.parse(userStr) : null;
      if (u) setUser(u);

      const [callsRes, leadsRes] = await Promise.all([
        u?._id
          ? api.get(`/api/calls/employee/${u._id}`, { params: { limit: 20, page: 1 } }).catch(() => null)
          : Promise.resolve(null),
        api.get('/api/leads/assigned').catch(() => null),
      ]);

      if (callsRes) setCalls(callsRes.data.data.calls || []);
      if (leadsRes) setLeads(leadsRes.data.data || []);
      setLastSync(await getLastSyncTime());
    } catch {}
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(() => handleSync(true), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const handleSync = async (silent = false) => {
    setSyncing(true);
    try {
      const result = await syncCallLogs();
      setLastSync(await getLastSyncTime());
      if (!silent) Alert.alert('Sync Complete', `${result.synced} call log(s) synced`);
      loadData();
    } catch (err) {
      if (!silent) Alert.alert('Sync Failed', err.message);
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const todayCalls    = calls.filter((c) => new Date(c.timestamp).toDateString() === new Date().toDateString());
  const todayMissed   = todayCalls.filter((c) => c.callType === 'missed').length;
  const todayOutgoing = todayCalls.filter((c) => c.callType === 'outgoing').length;
  const todayIncoming = todayCalls.filter((c) => c.callType === 'incoming').length;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.avatarWrap}>
          <Text style={s.avatarText}>{(user?.name?.[0] || 'E').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.greeting}>Hello, {user?.name?.split(' ')[0] || 'Employee'}</Text>
          <Text style={s.subGreet}>Here's your call summary</Text>
        </View>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={async () => { await AsyncStorage.multiRemove(['token', 'user']); onLogout?.(); }}
        >
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="Total"    value={todayCalls.length} color={C.primary}   bg={C.primaryLight} />
        <StatCard label="Incoming" value={todayIncoming}      color={C.incoming}  bg={C.incomingBg}   />
        <StatCard label="Missed"   value={todayMissed}        color={C.missed}    bg={C.missedBg}     />
        <StatCard label="Outgoing" value={todayOutgoing}      color={C.outgoing}  bg={C.outgoingBg}   />
      </View>

      {/* Sync card */}
      <View style={s.syncCard}>
        <View>
          <Text style={s.syncTitle}>Sync Status</Text>
          <Text style={s.syncTime}>
            {lastSync ? `Last synced ${lastSync.toLocaleTimeString()}` : 'Not synced yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.syncBtn, syncing && s.syncBtnDisabled]}
          onPress={() => handleSync()}
          disabled={syncing}
        >
          <Text style={s.syncBtnText}>{syncing ? 'Syncing…' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent calls */}
      <Text style={s.sectionTitle}>Today's Calls</Text>
      {todayCalls.slice(0, 8).map((c) => <CallRow key={c._id} call={c} />)}
      {todayCalls.length === 0 && <Text style={s.empty}>No calls today yet</Text>}

      {/* Leads */}
      <Text style={[s.sectionTitle, { marginTop: 28 }]}>My Leads</Text>
      {leads.slice(0, 5).map((lead) => (
        <View key={lead._id} style={s.leadRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.leadName}>{lead.name}</Text>
            <Text style={s.leadPhone}>{lead.phone}</Text>
          </View>
          <LeadBadge status={lead.status} />
        </View>
      ))}
      {leads.length === 0 && <Text style={s.empty}>No leads assigned</Text>}
    </ScrollView>
  );
}

const STATUS_COLORS = {
  new:            { fg: '#2563EB', bg: '#DBEAFE' },
  contacted:      { fg: '#7C3AED', bg: '#EDE9FE' },
  interested:     { fg: '#D97706', bg: '#FEF3C7' },
  not_interested: { fg: '#DC2626', bg: '#FEE2E2' },
  converted:      { fg: '#16A34A', bg: '#DCFCE7' },
  lost:           { fg: '#6B7280', bg: '#F3F4F6' },
};

function LeadBadge({ status }) {
  const c = STATUS_COLORS[status] || { fg: C.textMuted, bg: C.bg };
  return (
    <View style={[s.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[s.statusText, { color: c.fg }]}>{(status || '').replace('_', ' ')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  content:    { padding: 20, paddingBottom: 40 },

  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: C.primary, fontSize: 18, fontWeight: '700' },
  greeting:   { color: C.text, fontSize: 16, fontWeight: '700' },
  subGreet:   { color: C.textSec, fontSize: 12, marginTop: 1 },
  logoutBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  logoutText: { color: C.textSec, fontSize: 12 },

  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:   { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statVal:    { fontSize: 20, fontWeight: '800' },
  statLabel:  { fontSize: 10, fontWeight: '500', marginTop: 2, opacity: 0.8 },

  syncCard:   { backgroundColor: C.surface, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, shadowColor: C.shadow, elevation: 2 },
  syncTitle:  { color: C.text, fontWeight: '600', fontSize: 14 },
  syncTime:   { color: C.textMuted, fontSize: 11, marginTop: 2 },
  syncBtn:    { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  sectionTitle: { color: C.textSec, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },

  callRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: C.shadow, elevation: 1 },
  callTypeBadge:{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  callTypeIcon: { fontSize: 16 },
  callInfo:     { flex: 1 },
  callName:     { color: C.text, fontSize: 14, fontWeight: '600' },
  callNumber:   { color: C.textSec, fontSize: 12, marginTop: 1 },
  callRight:    { alignItems: 'flex-end', gap: 4 },
  typePill:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typePillText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  callDur:      { color: C.textMuted, fontSize: 11 },

  leadRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: C.shadow, elevation: 1 },
  leadName:     { color: C.text, fontSize: 14, fontWeight: '600' },
  leadPhone:    { color: C.textSec, fontSize: 12, marginTop: 1 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  empty:        { color: C.textMuted, textAlign: 'center', fontSize: 13, paddingVertical: 16 },
});
