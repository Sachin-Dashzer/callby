import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Linking, Alert, Dimensions, Pressable
} from 'react-native';
import ContactAvatar from './ContactAvatar';
import CallDirectionBadge from './CallDirectionBadge';
import TagChip from './TagChip';
import { Colors } from '../theme/colors';
import { formatDuration } from '../utils/formatDuration';
import { getNote } from '../utils/callNotes';

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CallCard({ call, onNote, onDelete, onFollowUp, selected, onLongPress, onSelect }) {
  const [noteData, setNoteData] = useState({ note: '', tags: [] });
  const [expanded, setExpanded] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getNote(call).then(setNoteData);
  }, [call]);

  const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 2 }).start();

  // ── Swipe ────────────────────────────────────────────────────────────────
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) =>
        translateX.setValue(Math.max(-SCREEN_W * 0.45, Math.min(SCREEN_W * 0.45, dx))),
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -SCREEN_W, duration: 220, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            Alert.alert('Delete call?', `${call.contactName || call.contactNumber}`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(call) },
            ]);
          });
        } else if (dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: SCREEN_W, duration: 220, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            onFollowUp?.(call);
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 100 }).start();
        }
      },
    })
  ).current;

  const swipeDeleteOpacity = translateX.interpolate({ inputRange: [-120, -20, 0], outputRange: [1, 0.4, 0], extrapolate: 'clamp' });
  const swipeFollowOpacity = translateX.interpolate({ inputRange: [0, 20, 120], outputRange: [0, 0.4, 1], extrapolate: 'clamp' });

  // ── Actions ──────────────────────────────────────────────────────────────
  const call_ = () => Linking.openURL(`tel:${call.contactNumber}`).catch(() => {});
  const whatsapp = () => {
    const n = (call.contactNumber || '').replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${n}`).catch(() => Alert.alert('WhatsApp not installed'));
  };
  const sms = () => Linking.openURL(`sms:${call.contactNumber}`).catch(() => {});

  const hasNote = noteData.note || noteData.tags?.length > 0;

  return (
    <View style={s.wrapper}>
      {/* Swipe backgrounds */}
      <Animated.View style={[s.swipeBg, s.swipeBgRight, { opacity: swipeFollowOpacity }]}>
        <Text style={s.swipeIcon}>📅</Text>
        <Text style={[s.swipeLabel, { color: Colors.primary }]}>Follow-up</Text>
      </Animated.View>
      <Animated.View style={[s.swipeBg, s.swipeBgLeft, { opacity: swipeDeleteOpacity }]}>
        <Text style={[s.swipeLabel, { color: Colors.danger }]}>Delete</Text>
        <Text style={s.swipeIcon}>🗑</Text>
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[s.card, selected && s.cardSelected, { transform: [{ translateX }, { scale: pressScale }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => selected ? onSelect?.(call) : setExpanded(!expanded)}
          onLongPress={() => onLongPress?.(call)}
          delayLongPress={400}
        >
          {/* Top row */}
          <View style={s.topRow}>
            <View style={{ position: 'relative' }}>
              <ContactAvatar name={call.contactName} number={call.contactNumber} size={44} />
              {selected && (
                <View style={s.selectedCheck}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
                </View>
              )}
            </View>
            <View style={s.middleCol}>
              <Text style={s.name} numberOfLines={1}>
                {call.contactName || 'Unknown'}
              </Text>
              <Text style={s.number}>{call.contactNumber}</Text>
              <CallDirectionBadge type={call.callType} />
            </View>
            <View style={s.rightCol}>
              <Text style={s.time}>{formatTime(call.timestamp)}</Text>
              <Text style={s.duration}>{formatDuration(call.duration)}</Text>
            </View>
          </View>

          {/* Tags row */}
          {noteData.tags?.length > 0 && (
            <View style={s.tagsRow}>
              {noteData.tags.map((t) => <TagChip key={t} label={t} selected size="sm" />)}
            </View>
          )}

          {/* Note row */}
          <TouchableOpacity style={s.noteRow} onPress={() => onNote?.(call)}>
            <Text style={[s.noteText, !hasNote && s.notePlaceholder]} numberOfLines={expanded ? undefined : 2}>
              {noteData.note || 'Tap to add note…'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={s.actionsRow}>
          {[
            { icon: '📞', label: 'Call',    onPress: call_    },
            { icon: '💬', label: 'WhatsApp',onPress: whatsapp },
            { icon: '✉️', label: 'SMS',    onPress: sms      },
            { icon: '📝', label: 'Note',   onPress: () => onNote?.(call) },
            { icon: '📅', label: 'Follow', onPress: () => onFollowUp?.(call) },
          ].map(({ icon, label, onPress }) => (
            <TouchableOpacity key={label} style={s.actionBtn} onPress={onPress}>
              <Text style={s.actionIcon}>{icon}</Text>
              <Text style={s.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:    { marginBottom: 10, position: 'relative' },

  swipeBg:    { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  swipeBgLeft: { backgroundColor: '#FEE2E2', justifyContent: 'flex-end' },
  swipeBgRight:{ backgroundColor: '#EBF2FF', justifyContent: 'flex-start' },
  swipeIcon:   { fontSize: 22 },
  swipeLabel:  { fontSize: 13, fontWeight: '700', marginHorizontal: 6 },

  card:        { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  cardSelected:{ borderColor: Colors.primary, borderWidth: 2 },
  selectedCheck:{ position: 'absolute', right: -4, top: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

  topRow:      { flexDirection: 'row', alignItems: 'flex-start', padding: 12, paddingBottom: 8 },
  middleCol:   { flex: 1, marginHorizontal: 10 },
  rightCol:    { alignItems: 'flex-end' },

  name:        { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  number:      { fontSize: 12, color: '#64748B', marginBottom: 4 },
  time:        { fontSize: 12, color: '#64748B' },
  duration:    { fontSize: 13, fontFamily: 'monospace', color: '#0F172A', fontWeight: '600', marginTop: 2 },

  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 4 },

  noteRow:     { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginHorizontal: 12, paddingVertical: 8 },
  noteText:    { fontSize: 13, color: '#0F172A', lineHeight: 18 },
  notePlaceholder: { color: '#94A3B8', fontStyle: 'italic' },

  actionsRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn:   { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionIcon:  { fontSize: 16 },
  actionLabel: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '500' },
});
