import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Keyboard, Platform, ActivityIndicator
} from 'react-native';
import { saveCallLog, syncCallLogs } from '../services/callLogService';
import { saveNote } from '../utils/callNotes';
import { Colors, CALL_TYPE } from '../theme/colors';
import ContactAvatar from './ContactAvatar';

// ─── Quick status options ─────────────────────────────────────────────────────
const STATUSES = [
  { label: 'Interested',     icon: '👍', color: Colors.success,  bg: Colors.successBg  },
  { label: 'Callback',       icon: '📞', color: Colors.primary,  bg: Colors.primaryLight },
  { label: 'Not Interested', icon: '👎', color: Colors.danger,   bg: Colors.dangerBg   },
  { label: 'Price Enquiry',  icon: '💰', color: Colors.warning,  bg: Colors.warningBg  },
  { label: 'Converted',      icon: '🎉', color: Colors.success,  bg: Colors.successBg  },
  { label: 'Follow Up',      icon: '📅', color: Colors.purple,   bg: Colors.purpleBg   },
  { label: 'Wrong Number',   icon: '🚫', color: '#64748B',       bg: '#F1F5F9'         },
  { label: 'No Response',    icon: '🔕', color: Colors.danger,   bg: Colors.dangerBg   },
];

// Quick follow-up slots
const FOLLOWUP_SLOTS = [
  { label: 'In 1h',     ms: 60 * 60 * 1000           },
  { label: 'Tomorrow',  ms: 24 * 60 * 60 * 1000       },
  { label: 'In 2 days', ms: 2 * 24 * 60 * 60 * 1000   },
  { label: 'Next week', ms: 7 * 24 * 60 * 60 * 1000   },
];

const AUTO_DISMISS_SEC = 30;

function formatDur(sec) {
  if (!sec || sec < 1) return '0s';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function CallTypePill({ type }) {
  const t = CALL_TYPE[type] || { fg: '#64748B', bg: '#F1F5F9', label: type || 'Call', icon: '↕' };
  return (
    <View style={[pill.wrap, { backgroundColor: t.bg }]}>
      <Text style={{ fontSize: 11, color: t.fg, fontWeight: '800', letterSpacing: 0.8 }}>
        {t.icon}  {t.label.toUpperCase()}
      </Text>
    </View>
  );
}

export default function AfterCallModal({ call, onClose }) {
  const [status, setStatus]       = useState(null);
  const [note, setNote]           = useState('');
  const [followUpDate, setFollowDate] = useState(null);
  const [showSlots, setShowSlots] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SEC);
  const [interacted, setInteracted] = useState(false);

  const slideY    = useRef(new Animated.Value(600)).current;
  const timerRef  = useRef(null);

  // Slide in when call arrives
  useEffect(() => {
    if (!call) return;
    // Reset state
    setStatus(null);
    setNote('');
    setFollowDate(null);
    setShowSlots(false);
    setInteracted(false);
    setCountdown(AUTO_DISMISS_SEC);

    Animated.spring(slideY, {
      toValue: 0, useNativeDriver: true, tension: 60, friction: 11
    }).start();

    // Auto-dismiss countdown
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); handleDismiss(); return 0; }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [call]);

  // Stop countdown on any interaction
  const touch = () => {
    if (!interacted) {
      clearInterval(timerRef.current);
      setInteracted(true);
    }
  };

  const slideDown = (cb) => {
    Animated.timing(slideY, { toValue: 600, duration: 260, useNativeDriver: true }).start(cb);
  };

  const handleDismiss = () => {
    clearInterval(timerRef.current);
    slideDown(() => { onClose?.(); slideY.setValue(600); });
  };

  const handleSave = async () => {
    if (!call) return;
    clearInterval(timerRef.current);
    setSaving(true);
    Keyboard.dismiss();

    const enriched = {
      ...call,
      status: status || undefined,
      note:   note.trim() || undefined,
      tags:   status ? [status] : [],
    };

    try {
      // 1. Save to local call log (will be synced to backend)
      await saveCallLog(enriched);

      // 2. Save note + tags + follow-up to local notes (shown on CallCard)
      await saveNote(call, {
        note:     note.trim(),
        tags:     status ? [status] : [],
        followUp: followUpDate ? { date: followUpDate, done: false } : null,
      });

      // 3. Sync to backend
      await syncCallLogs();
    } catch {}

    setSaving(false);
    slideDown(() => { onClose?.(); slideY.setValue(600); });
  };

  if (!call) return null;

  const selectedStatus = STATUSES.find((s) => s.label === status);

  return (
    <Modal
      transparent
      animationType="none"
      visible={!!call}
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      {/* Dimmed backdrop — tap to dismiss */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleDismiss} />

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        {/* Drag handle */}
        <View style={s.handle} />

        {/* ── Auto-dismiss strip ── */}
        {!interacted && (
          <View style={s.timerStrip}>
            <View style={[s.timerBar, { width: `${(countdown / AUTO_DISMISS_SEC) * 100}%` }]} />
            <Text style={s.timerText}>Dismissing in {countdown}s — tap anywhere to keep</Text>
          </View>
        )}

        <TouchableOpacity activeOpacity={1} onPress={touch} style={s.inner}>
          {/* ── Contact block ── */}
          <View style={s.contactRow}>
            <ContactAvatar name={call.contactName} number={call.contactNumber} size={54} />
            <View style={s.contactMid}>
              <Text style={s.contactName}>{call.contactName || 'Unknown'}</Text>
              <Text style={s.contactNum}>{call.contactNumber}</Text>
              <View style={s.metaRow}>
                <CallTypePill type={call.callType} />
                <Text style={s.dur}>{formatDur(call.duration)}</Text>
              </View>
            </View>
          </View>

          {/* ── Status chips ── */}
          <Text style={s.sectionLabel}>How did the call go?</Text>
          <View style={s.statusGrid}>
            {STATUSES.map((item) => {
              const active = status === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    s.statusChip,
                    active
                      ? { backgroundColor: item.bg, borderColor: item.color, borderWidth: 2 }
                      : { backgroundColor: '#F8F9FB', borderColor: '#E2E8F0', borderWidth: 1 },
                  ]}
                  onPress={() => { touch(); setStatus(active ? null : item.label); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.statusIcon}>{item.icon}</Text>
                  <Text style={[s.statusLabel, { color: active ? item.color : '#64748B' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Remark input ── */}
          <TextInput
            style={s.remarkInput}
            placeholder="Add a remark… (optional)"
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={(v) => { touch(); setNote(v); }}
            multiline
            maxLength={400}
            textAlignVertical="top"
          />

          {/* ── Follow-up toggle ── */}
          <TouchableOpacity
            style={[s.fuRow, followUpDate && { backgroundColor: Colors.purpleBg, borderColor: Colors.purple }]}
            onPress={() => { touch(); setShowSlots(!showSlots); }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text style={[s.fuText, followUpDate && { color: Colors.purple }]}>
              {followUpDate
                ? `Follow-up: ${new Date(followUpDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Set follow-up reminder'}
            </Text>
            {followUpDate && (
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); setFollowDate(null); }}>
                <Text style={{ color: '#94A3B8', fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showSlots && (
            <View style={s.slotsRow}>
              {FOLLOWUP_SLOTS.map((sl) => (
                <TouchableOpacity
                  key={sl.label}
                  style={[
                    s.slotBtn,
                    followUpDate === new Date(Date.now() + sl.ms).toISOString().split('.')[0] + 'Z'
                      ? s.slotBtnActive : null,
                  ]}
                  onPress={() => {
                    setFollowDate(new Date(Date.now() + sl.ms).toISOString());
                    setShowSlots(false);
                  }}
                >
                  <Text style={s.slotText}>{sl.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Action buttons ── */}
          <View style={s.actions}>
            <TouchableOpacity style={s.skipBtn} onPress={handleDismiss} disabled={saving}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.saveBtnText}>
                      {status ? `Save "${status}"` : 'Save & Sync'}
                    </Text>
                  </View>
                )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },

  sheet:      {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    elevation: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
  handle:     { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 0 },

  timerStrip: { height: 28, backgroundColor: '#F8F9FB', overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  timerBar:   { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.primaryLight },
  timerText:  { fontSize: 11, color: '#94A3B8', zIndex: 1 },

  inner:      { paddingHorizontal: 20 },

  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  contactMid: { flex: 1 },
  contactName:{ fontSize: 20, fontWeight: '800', color: '#0F172A' },
  contactNum: { fontSize: 13, color: '#64748B', marginTop: 2 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  dur:        { fontSize: 13, fontWeight: '700', color: '#64748B' },

  sectionLabel:{ fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  statusIcon: { fontSize: 14 },
  statusLabel:{ fontSize: 12, fontWeight: '700' },

  remarkInput:{ backgroundColor: '#F8F9FB', borderRadius: 12, padding: 12, fontSize: 14, color: '#0F172A', minHeight: 64, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },

  fuRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8F9FB', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  fuText:     { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '500' },

  slotsRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingBottom: 10 },
  slotBtn:    { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  slotBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  slotText:   { fontSize: 12, fontWeight: '600', color: '#64748B' },

  actions:    { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 4 },
  skipBtn:    { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  skipText:   { fontSize: 15, fontWeight: '600', color: '#64748B' },
  saveBtn:    { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },
});

const pill = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
});
