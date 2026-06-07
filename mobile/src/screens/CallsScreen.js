import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

const TYPE_COLORS = {
  incoming: '#10b981',
  outgoing: '#3b82f6',
  missed: '#ef4444',
  rejected: '#f59e0b'
};

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsScreen() {
  const [calls, setCalls] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

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
      const res = await api.get(`/api/calls/employee/${uid || userId}`, { params: { page: p, limit: 20 } });
      const newCalls = res.data.data.calls || [];
      setCalls((prev) => (p === 1 ? newCalls : [...prev, ...newCalls]));
      setHasMore(p < res.data.data.pages);
      setPage(p);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && userId) fetchCalls(page + 1, userId);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: TYPE_COLORS[item.callType] || '#9ca3af' }]} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.contactName}</Text>
        <Text style={styles.number}>{item.contactNumber}</Text>
        <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.type, { color: TYPE_COLORS[item.callType] }]}>{item.callType}</Text>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Call History</Text>
      <FlatList
        data={calls}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No call logs found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460', paddingHorizontal: 16, paddingTop: 20 },
  heading: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', backgroundColor: '#16213e', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 4 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 14, fontWeight: '500' },
  number: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  time: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  meta: { alignItems: 'flex-end' },
  type: { fontSize: 11, textTransform: 'capitalize', fontWeight: '500' },
  duration: { color: '#d1d5db', fontSize: 12, marginTop: 2 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40, fontSize: 14 }
});
