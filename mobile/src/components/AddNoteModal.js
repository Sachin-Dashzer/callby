import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import TagChip from './TagChip';
import { TAGS } from '../utils/tagColors';
import { getNote, saveNote } from '../utils/callNotes';

function DatePicker({ value, onChange }) {
  const [show, setShow] = useState(false);
  const toStr = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Quick slots: Today +1h, Tomorrow, Next Week
  const slot = (label, offsetMs) => ({
    label,
    value: new Date(Date.now() + offsetMs).toISOString(),
  });
  const slots = [
    slot('In 1 Hour',   60 * 60 * 1000),
    slot('Tomorrow',    24 * 60 * 60 * 1000),
    slot('In 2 Days',   2 * 24 * 60 * 60 * 1000),
    slot('Next Week',   7 * 24 * 60 * 60 * 1000),
  ];

  return (
    <View>
      <TouchableOpacity style={d.trigger} onPress={() => setShow(!show)}>
        <Text style={d.triggerIcon}>📅</Text>
        <Text style={[d.triggerText, !value && { color: '#94A3B8' }]}>
          {value ? toStr(value) : 'Set follow-up date (optional)'}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => { onChange(null); setShow(false); }}>
            <Text style={d.clearDate}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {show && (
        <View style={d.slotList}>
          {slots.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[d.slot, value === s.value && d.slotActive]}
              onPress={() => { onChange(s.value); setShow(false); }}
            >
              <Text style={[d.slotText, value === s.value && d.slotTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AddNoteModal({ call, visible, onClose }) {
  const [note, setNote]         = useState('');
  const [tags, setTags]         = useState([]);
  const [followDate, setFollowDate] = useState(null);
  const [saving, setSaving]     = useState(false);
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible && call) {
      getNote(call).then((data) => {
        setNote(data.note || '');
        setTags(data.tags || []);
        setFollowDate(data.followUp?.date || null);
      });
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, call]);

  const toggleTag = (label) => {
    setTags((prev) => prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]);
  };

  const handleSave = async () => {
    if (!call) return;
    setSaving(true);
    await saveNote(call, {
      note,
      tags,
      followUp: followDate ? { date: followDate, done: false } : null,
    });
    setSaving(false);
    onClose?.();
  };

  const contactLabel = call?.contactName || call?.contactNumber || 'Unknown';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kavWrap}
        pointerEvents="box-none"
      >
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetTitle}>Add Note</Text>
              <Text style={s.sheetSub}>{contactLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Note textarea */}
            <TextInput
              ref={inputRef}
              style={s.textarea}
              placeholder="Write a note… (e.g. interested in premium plan, call back Thursday)"
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />

            {/* Tags */}
            <Text style={s.sectionLabel}>Tags</Text>
            <View style={s.tagGrid}>
              {TAGS.map((t) => (
                <TagChip
                  key={t.label}
                  label={t.label}
                  selected={tags.includes(t.label)}
                  onPress={() => toggleTag(t.label)}
                />
              ))}
            </View>

            {/* Follow-up date */}
            <Text style={s.sectionLabel}>Follow-up Reminder</Text>
            <DatePicker value={followDate} onChange={setFollowDate} />

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Save button */}
          <View style={s.saveRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Note'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  kavWrap:  { flex: 1, justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '92%' },
  handle:   { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },

  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle:  { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  sheetSub:    { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  closeBtnText:{ fontSize: 14, color: '#64748B' },

  textarea:    { backgroundColor: '#F8F9FB', borderRadius: 12, padding: 14, minHeight: 100, fontSize: 14, color: '#0F172A', lineHeight: 20, marginBottom: 16 },

  sectionLabel:{ fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  tagGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  saveRow:     { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn:   { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  saveBtn:     { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const d = StyleSheet.create({
  trigger:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 12, padding: 12, marginBottom: 6 },
  triggerIcon: { fontSize: 18, marginRight: 8 },
  triggerText: { flex: 1, fontSize: 14, color: '#0F172A' },
  clearDate:   { color: '#94A3B8', fontSize: 14, padding: 4 },
  slotList:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  slot:        { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  slotActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  slotText:    { fontSize: 13, fontWeight: '600', color: '#64748B' },
  slotTextActive: { color: Colors.primary },
});
