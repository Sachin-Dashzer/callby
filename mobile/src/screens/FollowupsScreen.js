import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Linking, Alert
} from 'react-native';
import api from '../lib/api';
import ContactAvatar from '../components/ContactAvatar';
import TagChip from '../components/TagChip';
import { Colors } from '../theme/colors';
import { getPendingFollowUps, saveNote, getNote } from '../utils/callNotes';

const BUCKET_FILTERS = ['All', 'Today', 'Upcoming', 'Overdue'];
const SORT_OPTIONS   = [
  { key: 'soonest', label: 'Soonest first' },
  { key: 'latest',  label: 'Latest first'  },
  { key: 'name',    label: 'By name'        },
];

function dateBucket(dateStr) {
  if (!dateStr) return 'upcoming';
  const d     = new Date(dateStr);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fu    = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (fu < today) return 'overdue';
  if (fu.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function BucketBadge({ bucket }) {
  const map = {
    today:    { label: 'Today',    fg: Colors.primary, bg: Colors.primaryLight },
    upcoming: { label: 'Upcoming', fg: '#64748B',      bg: '#F1F5F9' },
    overdue:  { label: 'Overdue',  fg: Colors.danger,  bg: Colors.dangerBg },
  };
  const s = map[bucket] || map.upcoming;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.fg }}>{s.label}</Text>
    </View>
  );
}

function FollowUpCard({ item, onDone, onReschedule }) {
  const bucket = dateBucket(item.followUp?.date);
  const borderColor = bucket === 'overdue' ? Colors.danger : bucket === 'today' ? Colors.primary : '#E2E8F0';

  const formatDate = (ds) => {
    if (!ds) return '';
    const d = new Date(ds);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[s.card, { borderLeftColor: borderColor, borderLeftWidth: 4 }]}>
      <View style={s.cardTop}>
        <ContactAvatar name={item.contactName} number={item.contactNumber} size={42} />
        <View style={s.cardMid}>
          <Text style={s.cardName}>{item.contactName || item.contactNumber || 'Unknown'}</Text>
          <Text style={s.cardNumber}>{item.contactNumber}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={s.dateText}>📅 {formatDate(item.followUp?.date)}</Text>
            <BucketBadge bucket={bucket} />
          </View>
        </View>
      </View>

      {item.note ? (
        <View style={s.noteRow}>
          <Text style={s.noteText} numberOfLines={2}>📝 {item.note}</Text>
        </View>
      ) : null}

      {item.tags?.length > 0 && (
        <View style={s.tagsRow}>
          {item.tags.map((t) => <TagChip key={t} label={t} selected size="sm" />)}
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.actionCall} onPress={() => Linking.openURL(`tel:${item.contactNumber}`).catch(() => {})}>
          <Text style={s.actionCallText}>📞 Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onReschedule?.(item)}>
          <Text style={s.actionBtnText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.successBg, borderColor: Colors.success }]} onPress={() => onDone?.(item)}>
          <Text style={[s.actionBtnText, { color: Colors.success }]}>Done ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FollowupsScreen({ onAddNote }) {
  const [items, setItems]         = useState([]);
  const [leads, setLeads]         = useState([]);
  const [filter, setFilter]       = useState('All');
  const [sort, setSort]           = useState('soonest');
  const [showSort, setShowSort]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    // Load local follow-ups (from call notes)
    const local = await getPendingFollowUps();

    // Load leads with followUpDate
    try {
      const res = await api.get('/api/leads/assigned');
      const leadItems = (res.data.data || [])
        .filter((l) => l.followUpDate)
        .map((l) => ({
          key:           `lead_${l._id}`,
          contactName:   l.name,
          contactNumber: l.phone,
          followUp:      { date: l.followUpDate, done: false },
          note:          l.notes?.[l.notes.length - 1]?.text || '',
          tags:          [],
          isLead:        true,
          leadId:        l._id,
        }));
      setLeads(leadItems);
    } catch {}

    setItems(local.map((f) => ({
      key:           f.key,
      contactName:   f.contactName || '',
      contactNumber: f.contactNumber || '',
      followUp:      f.followUp,
      note:          f.note,
      tags:          f.tags || [],
    })));
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const allItems = [...items, ...leads];

  const displayed = allItems
    .filter((item) => {
      if (filter === 'All') return true;
      return dateBucket(item.followUp?.date) === filter.toLowerCase();
    })
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.followUp?.date || 0) - new Date(a.followUp?.date || 0);
      if (sort === 'name')   return (a.contactName || '').localeCompare(b.contactName || '');
      return new Date(a.followUp?.date || 0) - new Date(b.followUp?.date || 0);
    });

  const counts = {
    All:      allItems.length,
    Today:    allItems.filter((i) => dateBucket(i.followUp?.date) === 'today').length,
    Upcoming: allItems.filter((i) => dateBucket(i.followUp?.date) === 'upcoming').length,
    Overdue:  allItems.filter((i) => dateBucket(i.followUp?.date) === 'overdue').length,
  };

  const handleDone = async (item) => {
    Alert.alert('Mark as Done?', 'This follow-up will be removed from the list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Done',
        onPress: async () => {
          if (item.isLead) {
            try { await api.put(`/api/leads/${item.leadId}`, { followUpDate: null }); } catch {}
          } else {
            // Update local note
            const existing = { note: item.note, tags: item.tags, followUp: { ...item.followUp, done: true } };
            await saveNote({ contactNumber: item.contactNumber, timestamp: item.followUp?.date, callType: 'followup' }, existing);
          }
          load();
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      <View style={s.header}>
        <Text style={s.heading}>Follow-ups</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {counts.Overdue > 0 && (
            <View style={s.overdueChip}>
              <Text style={s.overdueText}>{counts.Overdue} overdue</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.sortBtn, showSort && { backgroundColor: Colors.primaryLight, borderColor: Colors.primary }]}
            onPress={() => setShowSort(!showSort)}
          >
            <Text style={{ fontSize: 13, color: showSort ? Colors.primary : '#64748B', fontWeight: '600' }}>⇅ Sort</Text>
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

      {/* Bucket filter chips */}
      <View style={s.chipRow}>
        {BUCKET_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
            {counts[f] > 0 && (
              <View style={[s.chipBadge, { backgroundColor: filter === f ? '#fff' : '#E2E8F0' }]}>
                <Text style={[s.chipBadgeText, { color: filter === f ? Colors.primary : '#64748B' }]}>{counts[f]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.key}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <FollowUpCard item={item} onDone={handleDone} onReschedule={(i) => onAddNote?.(i)} />
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>📅</Text>
            <Text style={s.emptyText}>No follow-ups yet</Text>
            <Text style={s.emptyHint}>Swipe right on a call or tap "Follow" to add one</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8F9FB' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  overdueChip: { backgroundColor: Colors.dangerBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  overdueText: { fontSize: 12, fontWeight: '700', color: Colors.danger },

  chipRow:     { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:    { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#fff' },
  chipBadge:   { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  chipBadgeText: { fontSize: 10, fontWeight: '700' },

  list:        { paddingHorizontal: 16, paddingBottom: 40 },

  card:        { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cardMid:     { flex: 1, marginLeft: 12 },
  cardName:    { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardNumber:  { fontSize: 12, color: '#64748B', marginTop: 1 },
  dateText:    { fontSize: 12, color: '#64748B' },

  noteRow:     { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 14, paddingVertical: 8 },
  noteText:    { fontSize: 13, color: '#64748B', lineHeight: 18 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 8 },

  actions:     { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionCall:  { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  actionCallText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtn:   { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { color: '#64748B', fontSize: 13, fontWeight: '600' },

  emptyWrap:   { alignItems: 'center', paddingTop: 80 },
  emptyIcon:   { fontSize: 48, marginBottom: 12 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: '#64748B' },
  emptyHint:   { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  sortBtn:     { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  sortDrop:    { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, overflow: 'hidden', elevation: 4 },
  sortItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sortItemActive: { backgroundColor: Colors.primaryLight },
  sortItemText:{ fontSize: 14, color: '#64748B' },
});
