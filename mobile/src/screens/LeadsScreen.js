import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import api from '../lib/api';

const STATUS_COLORS = {
  new: '#3b82f6', contacted: '#8b5cf6', interested: '#f59e0b',
  not_interested: '#ef4444', converted: '#10b981', lost: '#6b7280'
};

export default function LeadsScreen() {
  const [leads, setLeads] = useState([]);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads/assigned');
      setLeads(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/api/leads/${noteModal._id}/note`, { text: noteText });
      Alert.alert('Success', 'Note added');
      setNoteModal(null);
      setNoteText('');
      fetchLeads();
    } catch {
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[item.status]}25` }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.followUpDate && (
        <Text style={styles.followUp}>Follow-up: {new Date(item.followUpDate).toLocaleDateString()}</Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.notesCount}>{item.notes?.length || 0} notes</Text>
        <TouchableOpacity onPress={() => setNoteModal(item)}>
          <Text style={styles.addNote}>+ Add Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Leads</Text>
      <FlatList
        data={leads}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No leads assigned to you</Text>}
      />

      <Modal visible={!!noteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Note — {noteModal?.name}</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              placeholder="Enter note..."
              placeholderTextColor="#6b7280"
              style={styles.noteInput}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNoteModal(null); setNoteText(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddNote}>
                <Text style={styles.saveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460', paddingHorizontal: 16, paddingTop: 20 },
  heading: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leadInfo: { flex: 1 },
  leadName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  leadPhone: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  followUp: { color: '#f59e0b', fontSize: 12, marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  notesCount: { color: '#6b7280', fontSize: 12 },
  addNote: { color: '#e94560', fontSize: 12, fontWeight: '500' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#16213e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 14 },
  noteInput: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top', marginBottom: 16, minHeight: 100 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#6b7280', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#9ca3af', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});
