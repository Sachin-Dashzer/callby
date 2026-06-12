import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { C, TYPE } from '../theme';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'incoming', label: 'Incoming' },
  { key: 'outgoing', label: 'Outgoing' },
  { key: 'missed',   label: 'Missed' },
  { key: 'rejected', label: 'Rejected' },
];

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function CallCard({ item }) {
  const t = TYPE[item.callType] || { fg: C.textMuted, bg: C.bg, label: item.callType };
  const icon = item.callType === 'incoming' ? '↙' : item.callType === 'outgoing' ? '↗' : item.callType === 'missed' ? '↙' : '✕';
  const iconColor = item.callType === 'missed' || item.callType === 'rejected' ? t.fg : t.fg;

  return (
    <View style={s.card}>
      <View style={[s.iconWrap, { backgroundColor: t.bg }]}>
        <Text style={[s.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{item.contactName || 'Unknown'}</Text>
        <Text style={s.number}>{item.contactNumber}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.time}>{formatTime(item.timestamp)}</Text>
        <Text style={[s.dur, { color: t.fg }]}>{formatDuration(item.duration)}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, color, count }) {
  return (
    <View style={[s.sectionHeader, { borderLeftColor: color }]}>
      <Text style={[s.sectionTitle, { color }]}>{title}</Text>
      <View style={[s.sectionCount, { backgroundColor: color + '22' }]}>
        <Text style={[s.sectionCountText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

export default function CallsScreen() {
  const [allCalls, setAllCalls] = useState([]);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [userId, setUserId]     = useState(null);
  const [filter, setFilter]     = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user').then((str) => {
      if (str) {
        const u = JSON.parse(str);
        setUserId(u._id);
        fetchCalls(1, u._id);
      }
    });
  }, []);

  const fetchCalls = async (p, uid) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/calls/employee/${uid || userId}`, { params: { page: p, limit: 50 } });
      const incoming = res.data.data.calls || [];
      setAllCalls((prev) => (p === 1 ? incoming : [...prev, ...incoming]));
      setHasMore(p < res.data.data.pages);
      setPage(p);
    } catch {} finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) await fetchCalls(1, userId);
    setRefreshing(false);
  }, [userId]);

  const loadMore = () => {
    if (hasMore && !loading && userId) fetchCalls(page + 1, userId);
  };

  // Build display list
  const filtered = filter === 'all' ? allCalls : allCalls.filter((c) => c.callType === filter);

  // When showing "all", group into sections
  const sections = filter === 'all'
    ? FILTERS.slice(1).map(({ key, label }) => ({
        key,
        label,
        data: allCalls.filter((c) => c.callType === key),
        ...TYPE[key],
      })).filter((sec) => sec.data.length > 0)
    : null;

  const renderItem = ({ item }) => <CallCard item={item} />;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.topBar}>
        <Text style={s.heading}>Call History</Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pillScroll}
        contentContainerStyle={s.pillRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const t = f.key !== 'all' ? TYPE[f.key] : null;
          const count = f.key === 'all' ? allCalls.length : allCalls.filter((c) => c.callType === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.pill, active && (t ? { backgroundColor: t.bg, borderColor: t.fg } : s.pillActiveAll)]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.pillText, active && (t ? { color: t.fg, fontWeight: '700' } : s.pillActiveAllText)]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[s.pillBadge, { backgroundColor: active && t ? t.fg : C.border }]}>
                  <Text style={[s.pillBadgeText, { color: active && t ? '#fff' : C.textSec }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sectioned list when "All" is selected */}
      {filter === 'all' && sections ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={({ item: sec }) => (
            <View>
              <SectionHeader title={sec.label} color={sec.fg} count={sec.data.length} />
              {sec.data.map((call) => <CallCard key={call._id} item={call} />)}
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={<Text style={s.empty}>No call logs found</Text>}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={<Text style={s.empty}>No {filter} calls found</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  topBar:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  heading:    { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  pillScroll: { flexGrow: 0 },
  pillRow:    { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillActiveAll:     { backgroundColor: C.primaryLight, borderColor: C.primary },
  pillText:   { color: C.textSec, fontSize: 13, fontWeight: '500' },
  pillActiveAllText: { color: C.primary, fontWeight: '700' },
  pillBadge:  { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  pillBadgeText: { fontSize: 10, fontWeight: '600' },

  listContent:  { paddingHorizontal: 16, paddingBottom: 32 },

  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 8, borderLeftWidth: 3, paddingLeft: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  sectionCountText: { fontSize: 11, fontWeight: '700' },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: C.shadow, elevation: 1 },
  iconWrap:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon:       { fontSize: 18, fontWeight: '700' },
  info:       { flex: 1 },
  name:       { color: C.text, fontSize: 14, fontWeight: '600' },
  number:     { color: C.textSec, fontSize: 12, marginTop: 1 },
  right:      { alignItems: 'flex-end', gap: 3 },
  time:       { color: C.textMuted, fontSize: 11 },
  dur:        { fontSize: 12, fontWeight: '600' },

  empty:      { color: C.textMuted, textAlign: 'center', marginTop: 48, fontSize: 14 },
});
