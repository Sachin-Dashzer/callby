import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import { Colors } from '../theme/colors';
import { formatDuration } from '../utils/formatDuration';

const TABS    = ['Summary', 'Analysis', 'Trends'];
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

function filterByPeriod(calls, period) {
  const now = new Date();
  return calls.filter((c) => {
    const d = new Date(c.timestamp);
    if (period === 'today') {
      return d.toDateString() === now.toDateString();
    } else if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    } else if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

// Minimal donut ring using Animated + arc approximation via Views
function DonutRing({ percent, color = Colors.primary, size = 96 }) {
  const filled = Math.max(0, Math.min(100, percent || 0));
  const deg    = filled * 3.6; // 0–360

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 10, borderColor: '#E2E8F0', position: 'absolute' }]} />
      {/* Right half */}
      {deg > 0 && (
        <View style={[{ width: size, height: size, borderRadius: size / 2, position: 'absolute', overflow: 'hidden' }]}>
          <View style={{
            width: size / 2, height: size, backgroundColor: deg > 180 ? color : 'transparent',
            position: 'absolute', left: size / 2,
          }} />
          <View style={{
            width: size, height: size / 2, backgroundColor: deg > 90 ? color : 'transparent',
            position: 'absolute', bottom: 0,
            transform: [{ rotate: `${Math.min(deg, 180) - 90}deg` }],
          }} />
        </View>
      )}
      <View style={{ width: size - 22, height: size - 22, borderRadius: (size - 22) / 2, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '800', color }}>{filled}%</Text>
        <Text style={{ fontSize: size * 0.12, color: '#94A3B8', marginTop: 2 }}>Rate</Text>
      </View>
    </View>
  );
}

// Simple bar chart for calls by day
function BarChart({ data, color = Colors.primary }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: '100%', height: Math.max(4, (d.value / max) * 68), backgroundColor: color, borderRadius: 4, opacity: 0.8 }} />
          <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 3 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function computeStats(calls) {
  const total    = calls.length;
  const incoming = calls.filter((c) => c.callType === 'incoming').length;
  const outgoing = calls.filter((c) => c.callType === 'outgoing').length;
  const missed   = calls.filter((c) => c.callType === 'missed').length;
  const rejected = calls.filter((c) => c.callType === 'rejected').length;
  const answered = incoming + outgoing;
  const connRate = total > 0 ? Math.round((answered / total) * 100) : 0;
  const unique   = new Set(calls.map((c) => c.contactNumber)).size;
  const durArr   = calls.filter((c) => c.duration > 0).map((c) => c.duration);
  const avgDur   = durArr.length ? Math.round(durArr.reduce((a, b) => a + b, 0) / durArr.length) : 0;
  const totalDur = calls.reduce((a, c) => a + (c.duration || 0), 0);
  return { total, incoming, outgoing, missed, rejected, connRate, unique, avgDur, totalDur };
}

function getDayTrend(calls, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d     = new Date(); d.setDate(d.getDate() - i);
    const dStr  = d.toDateString();
    const count = calls.filter((c) => new Date(c.timestamp).toDateString() === dStr).length;
    result.push({ label: d.toLocaleDateString('en', { weekday: 'narrow' }), value: count });
  }
  return result;
}

function getHourlyData(calls) {
  const hours = Array(24).fill(0);
  calls.forEach((c) => { const h = new Date(c.timestamp).getHours(); hours[h]++; });
  return Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, value: hours[i] }));
}

export default function AnalyticsScreen() {
  const [calls, setCalls]       = useState([]);
  const [tab, setTab]           = useState('Summary');
  const [period, setPeriod]     = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId]     = useState(null);

  const load = async (uid) => {
    try {
      const res = await api.get(`/api/calls/employee/${uid}`, { params: { page: 1, limit: 200 } });
      setCalls(res.data.data.calls || []);
    } catch {}
  };

  useEffect(() => {
    AsyncStorage.getItem('user').then((str) => {
      if (str) { const u = JSON.parse(str); setUserId(u._id); load(u._id); }
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) await load(userId);
    setRefreshing(false);
  };

  const visibleCalls = filterByPeriod(calls, period);
  const st      = computeStats(visibleCalls);
  const dayData = getDayTrend(visibleCalls);
  const hourData = getHourlyData(visibleCalls);
  const peakHour = hourData.reduce((max, d) => d.value > max.value ? d : max, { label: '—', value: 0 });

  const typeData = [
    { label: 'In',  value: st.incoming, color: Colors.success },
    { label: 'Out', value: st.outgoing, color: Colors.warning },
    { label: 'Miss',value: st.missed,   color: Colors.danger  },
    { label: 'Rej', value: st.rejected, color: Colors.danger  },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      <View style={s.header}>
        <Text style={s.heading}>Analytics</Text>
      </View>

      {/* Period filter */}
      <View style={s.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[s.periodBtn, period === p.key && s.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[s.periodText, period === p.key && s.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            {tab === t && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'Summary' && (
          <>
            {/* Connection rate hero */}
            <View style={s.heroCard}>
              <DonutRing percent={st.connRate} size={100} />
              <View style={s.heroStats}>
                <Text style={s.heroLabel}>Connection Rate</Text>
                <Text style={s.heroSub}>{st.total} total calls</Text>
                <Text style={[s.heroBig, { color: Colors.success }]}>{st.incoming} answered</Text>
                <Text style={[s.heroBig, { color: Colors.danger }]}>{st.missed + st.rejected} unanswered</Text>
              </View>
            </View>

            {/* Stat grid */}
            <View style={s.grid}>
              {[
                { icon: '📊', label: 'Total Calls',  value: st.total,    color: Colors.primary, duration: st.totalDur },
                { icon: '↙',  label: 'Incoming',     value: st.incoming, color: Colors.success  },
                { icon: '↗',  label: 'Outgoing',     value: st.outgoing, color: Colors.warning  },
                { icon: '✕',  label: 'Missed',       value: st.missed,   color: Colors.danger   },
                { icon: '⊘',  label: 'Rejected',     value: st.rejected, color: Colors.danger   },
                { icon: '👤', label: 'Unique Contacts', value: st.unique, color: Colors.purple  },
                { icon: '⏱',  label: 'Avg Duration', value: formatDuration(st.avgDur), color: Colors.primary },
                { icon: '🔗', label: 'Connection %', value: `${st.connRate}%`, color: Colors.success },
              ].map(({ icon, label, value, color, duration }) => (
                <View key={label} style={s.halfWrap}>
                  <StatCard icon={icon} label={label} value={value} color={color} duration={duration} half />
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'Analysis' && (
          <>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Last 7 Days</Text>
              <BarChart data={dayData} color={Colors.primary} />
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Calls by Type</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {typeData.map((d) => {
                  const max = Math.max(...typeData.map((x) => x.value), 1);
                  return (
                    <View key={d.label} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: d.color, fontWeight: '700', marginBottom: 3 }}>{d.value}</Text>
                      <View style={{ width: '80%', height: Math.max(4, (d.value / max) * 60), backgroundColor: d.color, borderRadius: 4 }} />
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{d.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Calls by Hour (24h)</Text>
              <BarChart data={hourData} color={Colors.primaryDark || '#0050CC'} />
              <Text style={s.chartSub}>Peak hour: {peakHour.label} ({peakHour.value} calls)</Text>
            </View>
          </>
        )}

        {tab === 'Trends' && (
          <>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>This Week vs Last Week</Text>
              {(() => {
                const thisWeek = getDayTrend(calls, 7);
                const total1 = thisWeek.reduce((a, d) => a + d.value, 0);
                const max7 = Math.max(...thisWeek.map((d) => d.value), 1);
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 80 }}>
                    {thisWeek.map((d, i) => (
                      <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{ width: '90%', height: Math.max(4, (d.value / max7) * 68), backgroundColor: Colors.primary, borderRadius: 3 }} />
                        <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>{d.label}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </View>

            <View style={s.insightCard}>
              <Text style={s.insightTitle}>Top Contacts</Text>
              {(() => {
                const freq = {};
                calls.forEach((c) => { const k = c.contactName || c.contactNumber; freq[k] = (freq[k] || 0) + 1; });
                return Object.entries(freq)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count], i) => (
                    <View key={name} style={s.insightRow}>
                      <Text style={s.insightRank}>#{i + 1}</Text>
                      <Text style={s.insightName} numberOfLines={1}>{name}</Text>
                      <View style={[s.insightBar, { width: Math.max(24, count * 10), backgroundColor: Colors.primary + '33' }]}>
                        <Text style={[s.insightCount, { color: Colors.primary }]}>{count}</Text>
                      </View>
                    </View>
                  ));
              })()}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8F9FB' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  periodRow:      { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 4, gap: 6 },
  periodBtn:      { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  periodBtnActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText:     { fontSize: 11, fontWeight: '600', color: '#64748B' },
  periodTextActive: { color: '#fff' },

  tabRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginHorizontal: 20 },
  tabBtn:  { marginRight: 24, paddingBottom: 10, position: 'relative' },
  tabBtnActive: {},
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },

  content: { padding: 16, paddingBottom: 40 },

  heroCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  heroStats: { flex: 1 },
  heroLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  heroSub:   { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  heroBig:   { fontSize: 14, fontWeight: '700', marginBottom: 2 },

  grid:      { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  halfWrap:  { width: '50%', paddingHorizontal: 4 },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  chartTitle:{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  chartSub:  { fontSize: 12, color: '#94A3B8', marginTop: 8 },

  insightCard:{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  insightRank:{ fontSize: 12, fontWeight: '700', color: '#94A3B8', width: 24 },
  insightName:{ flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' },
  insightBar: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, minWidth: 28 },
  insightCount:{ fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
