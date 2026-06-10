import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { syncCallLogs, getLastSyncTime } from '../services/callLogService';

function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatBox({ label, value, color = '#e94560' }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [calls, setCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));

      const [callsRes, leadsRes] = await Promise.all([
        api.get(`/api/calls/employee/${JSON.parse(userStr || '{}')._id}`, { params: { limit: 20, page: 1 } }).catch(() => null),
        api.get('/api/leads/assigned').catch(() => null)
      ]);

      if (callsRes) setCalls(callsRes.data.data.calls || []);
      if (leadsRes) setLeads(leadsRes.data.data || []);

      const t = await getLastSyncTime();
      setLastSync(t);
    } catch {}
  };

  useEffect(() => {
    loadData();
    // auto sync every 5 minutes
    const interval = setInterval(() => handleSync(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async (silent = false) => {
    setSyncing(true);
    try {
      const result = await syncCallLogs();
      const t = await getLastSyncTime();
      setLastSync(t);
      if (!silent) Alert.alert('Sync Complete', `${result.synced} call logs synced`);
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

  const todayCalls = calls.filter((c) => {
    const d = new Date(c.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const todayMissed = todayCalls.filter((c) => c.callType === 'missed').length;
  const todayOutgoing = todayCalls.filter((c) => c.callType === 'outgoing').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Employee'} 👋</Text>
          <Text style={styles.subGreeting}>Here's your call summary</Text>
        </View>
        <TouchableOpacity onPress={async () => { await AsyncStorage.multiRemove(['token','user']); onLogout?.(); }}>
          <Text style={{ color: '#e94560', fontSize: 12 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Today's Calls" value={todayCalls.length} color="#e94560" />
        <StatBox label="Missed" value={todayMissed} color="#f59e0b" />
        <StatBox label="Outgoing" value={todayOutgoing} color="#3b82f6" />
      </View>

      {/* Sync card */}
      <View style={styles.syncCard}>
        <View>
          <Text style={styles.syncTitle}>Sync Status</Text>
          <Text style={styles.syncTime}>
            {lastSync ? `Last synced: ${lastSync.toLocaleTimeString()}` : 'Not synced yet'}
          </Text>
        </View>
        <TouchableOpacity style={[styles.syncBtn, syncing && styles.syncBtnDisabled]} onPress={() => handleSync()} disabled={syncing}>
          <Text style={styles.syncBtnText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Calls */}
      <Text style={styles.sectionTitle}>Recent Calls</Text>
      {todayCalls.slice(0, 10).map((call) => (
        <View key={call._id} style={styles.callRow}>
          <View style={[styles.callDot, { backgroundColor: call.callType === 'missed' ? '#ef4444' : call.callType === 'outgoing' ? '#3b82f6' : '#10b981' }]} />
          <View style={styles.callInfo}>
            <Text style={styles.callContact}>{call.contactName}</Text>
            <Text style={styles.callNumber}>{call.contactNumber}</Text>
          </View>
          <View style={styles.callMeta}>
            <Text style={styles.callType}>{call.callType}</Text>
            <Text style={styles.callDuration}>{formatDuration(call.duration)}</Text>
          </View>
        </View>
      ))}
      {todayCalls.length === 0 && (
        <Text style={styles.emptyText}>No calls today yet</Text>
      )}

      {/* My Leads */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Leads</Text>
      {leads.map((lead) => (
        <View key={lead._id} style={styles.leadRow}>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{lead.name}</Text>
            <Text style={styles.leadPhone}>{lead.phone}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(lead.status)]}>
            <Text style={styles.statusText}>{lead.status.replace('_', ' ')}</Text>
          </View>
        </View>
      ))}
      {leads.length === 0 && (
        <Text style={styles.emptyText}>No leads assigned</Text>
      )}
    </ScrollView>
  );
}

function getStatusStyle(status) {
  const map = {
    new: { backgroundColor: 'rgba(59,130,246,0.2)' },
    contacted: { backgroundColor: 'rgba(139,92,246,0.2)' },
    interested: { backgroundColor: 'rgba(245,158,11,0.2)' },
    not_interested: { backgroundColor: 'rgba(239,68,68,0.2)' },
    converted: { backgroundColor: 'rgba(16,185,129,0.2)' },
    lost: { backgroundColor: 'rgba(107,114,128,0.2)' }
  };
  return map[status] || {};
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subGreeting: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  syncDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#9ca3af', fontSize: 11, marginTop: 3 },
  syncCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  syncTitle: { color: '#fff', fontWeight: '600', fontSize: 14 },
  syncTime: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  syncBtn: { backgroundColor: '#e94560', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: '#d1d5db', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  callRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 10, padding: 12, marginBottom: 8 },
  callDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  callInfo: { flex: 1 },
  callContact: { color: '#fff', fontSize: 14, fontWeight: '500' },
  callNumber: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  callMeta: { alignItems: 'flex-end' },
  callType: { color: '#6b7280', fontSize: 11, textTransform: 'capitalize' },
  callDuration: { color: '#d1d5db', fontSize: 12, marginTop: 1 },
  leadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 10, padding: 12, marginBottom: 8 },
  leadInfo: { flex: 1 },
  leadName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  leadPhone: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { color: '#d1d5db', fontSize: 11, textTransform: 'capitalize' },
  emptyText: { color: '#6b7280', textAlign: 'center', fontSize: 13, paddingVertical: 12 }
});
