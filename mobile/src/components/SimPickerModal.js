import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Platform
} from 'react-native';
import { getAvailableSims, getTrackedSimId, setTrackedSim } from '../services/simService';
import { Colors } from '../theme/colors';

export default function SimPickerModal({ visible, onClose }) {
  const [sims, setSims]         = useState([]);
  const [selected, setSelected] = useState(-1);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const slideY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    setLoading(true);
    Promise.all([getAvailableSims(), getTrackedSimId()]).then(([simList, savedId]) => {
      setSims(simList || []);
      setSelected(savedId ?? -1);
      setLoading(false);
    });
  }, [visible]);

  const close = () => {
    Animated.timing(slideY, { toValue: 400, duration: 220, useNativeDriver: true }).start(onClose);
  };

  const handleSave = async () => {
    setSaving(true);
    await setTrackedSim(selected);
    setSaving(false);
    close();
  };

  const options = [
    { subscriptionId: -1, displayName: 'All SIMs', carrierName: 'Track every SIM card', slotIndex: -1 },
    ...sims,
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close} />
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={s.handle} />
        <Text style={s.title}>SIM Card Tracking</Text>
        <Text style={s.sub}>Choose which SIM card's calls to track</Text>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={s.loadingText}>Reading SIM cards…</Text>
          </View>
        ) : (
          <View style={s.list}>
            {options.map((sim) => {
              const active = selected === sim.subscriptionId;
              return (
                <TouchableOpacity
                  key={String(sim.subscriptionId)}
                  style={[s.row, active && s.rowActive]}
                  onPress={() => setSelected(sim.subscriptionId)}
                  activeOpacity={0.7}
                >
                  <View style={[s.simIcon, { backgroundColor: active ? Colors.primaryLight : '#F1F5F9' }]}>
                    <Text style={{ fontSize: 22 }}>{sim.subscriptionId === -1 ? '📶' : `SIM${sim.slotIndex + 1}`[0] === 'S' ? '📱' : '📱'}</Text>
                  </View>
                  <View style={s.rowMid}>
                    <Text style={[s.rowName, active && { color: Colors.primary }]}>{sim.displayName}</Text>
                    <Text style={s.rowSub}>
                      {sim.subscriptionId === -1
                        ? sim.carrierName
                        : `${sim.carrierName}${sim.number ? '  ·  ' + sim.number : ''}  ·  Slot ${sim.slotIndex + 1}`}
                    </Text>
                  </View>
                  <View style={[s.radio, active && s.radioActive]}>
                    {active && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={close}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.saveBtn, (saving || loading) && { opacity: 0.6 }]} onPress={handleSave} disabled={saving || loading}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  handle:   { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  sub:      { fontSize: 13, color: '#64748B', marginBottom: 20 },

  loadingWrap: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },

  list: { marginBottom: 20 },
  row:  { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 10, gap: 12 },
  rowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '55' },
  simIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowMid:   { flex: 1 },
  rowName:  { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  rowSub:   { fontSize: 12, color: '#64748B', marginTop: 2 },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },

  actions:    { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  saveBtn:    { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
});
