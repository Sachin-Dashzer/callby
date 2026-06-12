import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, RefreshControl, StatusBar
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

const STATUS = {
  new:            { fg: '#2563EB', bg: '#DBEAFE', label: 'New' },
  contacted:      { fg: '#7C3AED', bg: '#EDE9FE', label: 'Contacted' },
  interested:     { fg: '#D97706', bg: '#FEF3C7', label: 'Interested' },
  not_interested: { fg: '#DC2626', bg: '#FEE2E2', label: 'Not Interested' },
  converted:      { fg: '#16A34A', bg: '#DCFCE7', label: 'Converted' },
  lost:           { fg: '#6B7280', bg: '#F3F4F6', label: 'Lost' },
};

export default function LeadsScreen() {
  const [leads, setLeads]         = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText]   = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads/assigned');
      setLeads(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchLeads(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/leads/${noteModal._id}/note`, { text: noteText.trim() });
      Alert.alert('Saved', 'Note added successfully');
      setNoteModal(null);
      setNoteText('');
      fetchLeads();
    } catch {
      Alert.alert('Error', 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => {
    const st = STATUS[item.status] || { fg: C.textMuted, bg: C.bg, label: item.status };
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          {/* Left: initials */}
          <View style={[s.initials, { backgroundColor: st.bg }]}>
            <Text style={[s.initialsText, { color: st.fg }]}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.leadName}>{item.name}</Text>
            <Text style={s.leadPhone}>{item.phone}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: st.bg }]}>
            <Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text>
          </View>
        </View>

        {item.followUpDate && (
          <View style={s.followUpRow}>
            <Text style={s.followUpLabel}>Follow-up</Text>
            <Text style={s.followUpDate}>{new Date(item.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
        )}

        <View style={s.cardFooter}>
          <View style={s.notesWrap}>
            <Text style={s.notesDot}>●</Text>
            <Text style={s.notesCount}>{item.notes?.length || 0} note{item.notes?.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => { setNoteModal(item); setNoteText(''); }}>
            <Text style={s.addBtnText}>+ Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.topBar}>
        <Text style={s.heading}>My Leads</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{leads.length}</Text>
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListEmptyComponent={<Text style={s.empty}>No leads assigned to you</Text>}
      />

      {/* Note Modal */}
      <Modal visible={!!noteModal} transparent animationType="slide" statusBarTranslucent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add Note</Text>
            <Text style={s.sheetSub}>{noteModal?.name}</Text>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={5}
              placeholder="Write your note here…"
              placeholderTextColor={C.textMuted}
              style={s.noteInput}
              autoFocus
              maxLength={500}
            />
            <Text style={s.charCount}>{noteText.length}/500</Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setNoteModal(null); setNoteText(''); }}
                disabled={saving}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, (!noteText.trim() || saving) && s.saveBtnDisabled]}
                onPress={handleAddNote}
                disabled={!noteText.trim() || saving}
              >
                <Text style={s.saveText}>{saving ? 'Saving…' : 'Save Note'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading:    { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:  { color: C.primary, fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  card:       { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: C.shadow, elevation: 2 },
  cardTop:    { flexDirection: 'row', alignItems: 'center' },
  initials:   { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 16, fontWeight: '700' },
  leadName:   { color: C.text, fontSize: 15, fontWeight: '700' },
  leadPhone:  { color: C.textSec, fontSize: 12, marginTop: 1 },
  badge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText:  { fontSize: 11, fontWeight: '700' },

  followUpRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  followUpLabel:{ color: C.textMuted, fontSize: 11, fontWeight: '500' },
  followUpDate: { color: C.rejected, fontSize: 12, fontWeight: '600' },

  cardFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  notesWrap:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  notesDot:     { color: C.textMuted, fontSize: 8 },
  notesCount:   { color: C.textMuted, fontSize: 12 },
  addBtn:       { backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  addBtnText:   { color: C.primary, fontSize: 12, fontWeight: '700' },

  empty:        { color: C.textMuted, textAlign: 'center', marginTop: 48, fontSize: 14 },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle:{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sheetSub:   { color: C.textSec, fontSize: 13, marginBottom: 16 },

  noteInput:  { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 14, textAlignVertical: 'top', minHeight: 110 },
  charCount:  { color: C.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },

  modalBtns:  { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: C.textSec, fontSize: 14, fontWeight: '600' },
  saveBtn:    { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
});
