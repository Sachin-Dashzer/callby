import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar, Animated, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import CallCard from '../components/CallCard';
import { Colors } from '../theme/colors';
import { groupCallsByDate } from '../utils/groupCallsByDate';
import { syncCallLogs } from '../services/callLogService';

const FILTERS = [
  { key: 'all',      label: 'All',      icon: '↕' },
  { key: 'incoming', label: 'Incoming', icon: '↙' },
  { key: 'outgoing', label: 'Outgoing', icon: '↗' },
  { key: 'missed',   label: 'Missed',   icon: '✕' },
  { key: 'rejected', label: 'Rejected', icon: '⊘' },
];

const SORTS = [
  { key: 'newest',  label: 'Newest first' },
  { key: 'oldest',  label: 'Oldest first' },
  { key: 'longest', label: 'Longest call' },
  { key: 'shortest',label: 'Shortest call' },
];

function SortDropdown({ value, onChange, onClose }) {
  return (
    <View style={dd.wrap}>
      {SORTS.map((s) => (
        <TouchableOpacity
          key={s.key}
          style={[dd.item, value === s.key && dd.itemActive]}
          onPress={() => { onChange(s.key); onClose(); }}
        >
          <Text style={[dd.itemText, value === s.key && dd.itemTextActive]}>{s.label}</Text>
          {value === s.key && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CallHistoryScreen({ onAddNote, onFollowUp }) {
  const [calls, setCalls]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [filter, setFilter]         = useState('all');
  const [sort, setSort]             = useState('newest');
  const [showSort, setShowSort]     = useState(false);
  const [search, setSearch]         = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [userId, setUserId]         = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then((str) => {
      if (str) { const u = JSON.parse(str); setUserId(u._id); fetchCalls(1, u._id); }
    });
  }, []);

  const fetchCalls = async (p, uid) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/calls/employee/${uid || userId}`, { params: { page: p, limit: 50 } });
      const data = res.data.data.calls || [];
      setCalls((prev) => (p === 1 ? data : [...prev, ...data]));
      setHasMore(p < res.data.data.pages);
      setPage(p);
    } catch {} finally { setLoading(false); }
  };

  // Apply filter + search + sort
  useEffect(() => {
    let result = filter === 'all' ? [...calls] : calls.filter((c) => c.callType === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        (c.contactName || '').toLowerCase().includes(q) ||
        (c.contactNumber || '').includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sort) {
        case 'oldest':   return new Date(a.timestamp) - new Date(b.timestamp);
        case 'longest':  return (b.duration || 0) - (a.duration || 0);
        case 'shortest': return (a.duration || 0) - (b.duration || 0);
        default:         return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });
    setFiltered(result);
  }, [calls, filter, search, sort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSyncing(true);
    try { await syncCallLogs(); } catch {}
    if (userId) await fetchCalls(1, userId);
    setSyncing(false);
    setRefreshing(false);
  }, [userId]);

  const groups = groupCallsByDate(filtered);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      {/* Header */}
      <View style={s.header}>
        {showSearch ? (
          <View style={s.searchBarWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              ref={searchRef}
              style={s.searchInput}
              placeholder="Search name or number…"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setSearch(''); setShowSearch(false); }}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.heading}>Call History</Text>
            <View style={s.headerRight}>
              {syncing && <Text style={s.syncDot}>⟳</Text>}
              <TouchableOpacity onPress={() => setShowSort(!showSort)} style={[s.iconBtn, showSort && { backgroundColor: Colors.primaryLight, borderColor: Colors.primary }]}>
                <Text style={s.iconText}>⇅</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={s.iconBtn}>
                <Text style={s.iconText}>🔍</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Sort dropdown */}
      {showSort && <SortDropdown value={sort} onChange={setSort} onClose={() => setShowSort(false)} />}

      {/* Filter chips — fixed width so they never resize */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count  = f.key === 'all' ? calls.length : calls.filter((c) => c.callType === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {f.icon} {f.label}
              </Text>
              <View style={[s.chipBadge, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : '#E2E8F0' }]}>
                <Text style={[s.chipBadgeText, { color: active ? '#fff' : '#64748B' }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Call list */}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.title}
        renderItem={({ item: group }) => (
          <View>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{group.title}</Text>
              <View style={s.sectionLine} />
              <Text style={s.sectionCount}>{group.data.length}</Text>
            </View>
            {group.data.map((call) => (
              <CallCard
                key={`${call.contactNumber}_${call.timestamp}`}
                call={call}
                onNote={onAddNote}
                onFollowUp={onFollowUp}
                onDelete={(c) => setCalls((prev) => prev.filter((x) => x !== c))}
              />
            ))}
          </View>
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onEndReached={() => hasMore && !loading && userId && fetchCalls(page + 1, userId)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>📵</Text>
              <Text style={s.emptyText}>{search ? 'No results found' : 'No calls yet'}</Text>
              <Text style={s.emptyHint}>Pull down to sync call logs</Text>
            </View>
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => { try { require('react-native').Linking.openURL('tel:'); } catch {} }}
      >
        <Text style={s.fabText}>📞</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8F9FB' },

  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncDot: { color: Colors.primary, fontSize: 16, fontWeight: '900' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  iconText:{ fontSize: 16 },

  searchBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 44 },
  searchIcon:    { fontSize: 16, marginRight: 8 },
  searchInput:   { flex: 1, fontSize: 14, color: '#0F172A' },
  searchClear:   { fontSize: 16, color: '#94A3B8', padding: 4 },

  // Fixed-size chips — always same height/padding, badge doesn't stretch chip
  chipRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  chip:    { flexDirection: 'row', alignItems: 'center', height: 36, gap: 6, borderRadius: 999, paddingHorizontal: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:        { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive:  { color: '#fff' },
  chipBadge:       { borderRadius: 8, minWidth: 20, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  chipBadgeText:   { fontSize: 10, fontWeight: '700' },

  list:    { paddingHorizontal: 16, paddingBottom: 100 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 8 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  sectionCount:  { fontSize: 11, color: '#94A3B8', marginLeft: 8, fontWeight: '600' },

  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  emptyHint: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  fab:     { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText: { fontSize: 24 },
});

const dd = StyleSheet.create({
  wrap:         { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  item:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemActive:   { backgroundColor: Colors.primaryLight },
  itemText:     { fontSize: 14, fontWeight: '500', color: '#64748B' },
  itemTextActive: { color: Colors.primary, fontWeight: '700' },
});
