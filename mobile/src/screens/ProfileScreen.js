import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import { C } from '../theme';
import { getAvailableSims, getTrackedSimId, setTrackedSim } from '../services/simService';

function Row({ label, value, valueColor }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen({ onLogout }) {
  const [user, setUser]               = useState(null);
  const [sims, setSims]               = useState([]);
  const [trackedSim, setTrackedSimState] = useState(-1);
  const [simLoading, setSimLoading]   = useState(false);
  const [permissions, setPermissions] = useState({ phone: false, callLog: false });

  useEffect(() => {
    loadUser();
    loadSims();
    checkPermissions();
  }, []);

  const loadUser = async () => {
    const str = await AsyncStorage.getItem('user');
    if (str) setUser(JSON.parse(str));
  };

  const loadSims = async () => {
    setSimLoading(true);
    try {
      const list = await getAvailableSims();
      setSims(list || []);
      const saved = await getTrackedSimId();
      setTrackedSimState(saved);
    } catch {} finally {
      setSimLoading(false);
    }
  };

  const checkPermissions = async () => {
    const phone   = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    const callLog = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
    setPermissions({ phone, callLog });
  };

  const requestPermissions = async () => {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]);
    checkPermissions();
    loadSims();
  };

  const handleSelectSim = async (subId) => {
    const newId = trackedSim === subId ? -1 : subId; // toggle off if same
    setTrackedSimState(newId);
    await setTrackedSim(newId);
    Alert.alert(
      newId === -1 ? 'Tracking all SIMs' : 'SIM Selected',
      newId === -1 ? 'All calls on all SIMs will be tracked.' : `Calls from this SIM slot will be tracked.`
    );
  };

  const handleLogout = async () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          onLogout?.();
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const allPermsGranted = permissions.phone && permissions.callLog;

  // Phone number verification: check if user's registered phone matches any SIM
  const registeredPhone = user?.phone || '';
  const simNumbers = sims.map((s) => (s.number || '').replace(/\s+/g, ''));
  const phoneVerified = registeredPhone
    ? simNumbers.some((n) => n && registeredPhone.replace(/\s+/g, '').endsWith(n.slice(-10)))
    : null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.name || '—'}</Text>
        <Text style={s.userEmail}>{user?.email || '—'}</Text>
        {user?.role && (
          <View style={s.rolePill}>
            <Text style={s.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Account */}
      <Section title="Account">
        <Row label="Name"  value={user?.name  || '—'} />
        <Row label="Email" value={user?.email || '—'} />
        {user?.phone && <Row label="Registered Phone" value={user.phone} />}
      </Section>

      {/* Phone number verification */}
      {registeredPhone !== '' && (
        <Section title="Phone Verification">
          <View style={s.verifyRow}>
            <Text style={s.rowLabel}>Device number match</Text>
            {phoneVerified === null ? (
              <Text style={[s.rowValue, { color: C.textMuted }]}>Unknown</Text>
            ) : phoneVerified ? (
              <View style={[s.statusChip, { backgroundColor: C.incomingBg }]}>
                <Text style={[s.statusChipText, { color: C.incoming }]}>Verified ✓</Text>
              </View>
            ) : (
              <View style={[s.statusChip, { backgroundColor: C.missedBg }]}>
                <Text style={[s.statusChipText, { color: C.missed }]}>Not matched</Text>
              </View>
            )}
          </View>
          {phoneVerified === false && (
            <Text style={s.verifyHint}>
              Your registered number ({registeredPhone}) was not found on any SIM in this device. Call logs may belong to a different employee.
            </Text>
          )}
        </Section>
      )}

      {/* Permissions */}
      <Section title="Permissions">
        <View style={s.permRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>Read Phone State</Text>
            <Text style={s.permDesc}>Required to detect call start/end</Text>
          </View>
          <View style={[s.statusChip, permissions.phone ? { backgroundColor: C.incomingBg } : { backgroundColor: C.missedBg }]}>
            <Text style={[s.statusChipText, { color: permissions.phone ? C.incoming : C.missed }]}>
              {permissions.phone ? 'Granted' : 'Denied'}
            </Text>
          </View>
        </View>
        <View style={[s.permRow, { borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>Read Call Log</Text>
            <Text style={s.permDesc}>Required to read call details</Text>
          </View>
          <View style={[s.statusChip, permissions.callLog ? { backgroundColor: C.incomingBg } : { backgroundColor: C.missedBg }]}>
            <Text style={[s.statusChipText, { color: permissions.callLog ? C.incoming : C.missed }]}>
              {permissions.callLog ? 'Granted' : 'Denied'}
            </Text>
          </View>
        </View>
        {!allPermsGranted && (
          <TouchableOpacity style={s.grantBtn} onPress={requestPermissions}>
            <Text style={s.grantBtnText}>Grant Permissions</Text>
          </TouchableOpacity>
        )}
      </Section>

      {/* SIM Selection */}
      <Section title="SIM Tracking">
        {simLoading ? (
          <ActivityIndicator color={C.primary} style={{ paddingVertical: 16 }} />
        ) : sims.length === 0 ? (
          <Text style={s.simEmpty}>
            {allPermsGranted
              ? 'No SIMs detected on this device.'
              : 'Grant permissions above to detect SIMs.'}
          </Text>
        ) : (
          <>
            <Text style={s.simHint}>
              Select which SIM slot to track. Only calls made/received on that SIM will be logged.
            </Text>
            {/* "Track all" option */}
            <TouchableOpacity
              style={[s.simCard, trackedSim === -1 && s.simCardActive]}
              onPress={() => handleSelectSim(-1)}
            >
              <View style={[s.simDot, { backgroundColor: trackedSim === -1 ? C.primary : C.border }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.simName, trackedSim === -1 && { color: C.primary }]}>Track All SIMs</Text>
                <Text style={s.simSub}>Log calls from all SIM slots</Text>
              </View>
              {trackedSim === -1 && <Text style={s.simCheck}>✓</Text>}
            </TouchableOpacity>

            {sims.map((sim) => (
              <TouchableOpacity
                key={sim.subscriptionId}
                style={[s.simCard, trackedSim === sim.subscriptionId && s.simCardActive]}
                onPress={() => handleSelectSim(sim.subscriptionId)}
              >
                <View style={[s.simDot, { backgroundColor: trackedSim === sim.subscriptionId ? C.primary : C.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.simName, trackedSim === sim.subscriptionId && { color: C.primary }]}>
                    SIM {sim.slotIndex + 1} — {sim.displayName}
                  </Text>
                  <Text style={s.simSub}>
                    {sim.carrierName || 'Unknown carrier'}
                    {sim.number ? ` · ${sim.number}` : ''}
                  </Text>
                </View>
                {trackedSim === sim.subscriptionId && <Text style={s.simCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}
      </Section>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  content:    { padding: 20, paddingBottom: 48 },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.primary },
  userName:   { fontSize: 20, fontWeight: '800', color: C.text },
  userEmail:  { fontSize: 13, color: C.textSec, marginTop: 4 },
  rolePill:   { marginTop: 8, backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  roleText:   { color: C.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  section:      { marginBottom: 20 },
  sectionTitle: { color: C.textSec, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },
  sectionCard:  { backgroundColor: C.surface, borderRadius: 16, padding: 16, shadowColor: C.shadow, elevation: 2 },

  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel:   { color: C.textSec, fontSize: 13 },
  rowValue:   { color: C.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 8 },

  verifyRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifyHint: { color: C.missed, fontSize: 12, marginTop: 8, lineHeight: 18 },

  statusChip:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipText: { fontSize: 12, fontWeight: '700' },

  permRow:    { flexDirection: 'row', alignItems: 'center' },
  permDesc:   { color: C.textMuted, fontSize: 11, marginTop: 1 },
  grantBtn:   { marginTop: 14, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  grantBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  simHint:    { color: C.textSec, fontSize: 12, marginBottom: 12, lineHeight: 18 },
  simEmpty:   { color: C.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  simCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: C.border, marginBottom: 8, gap: 10 },
  simCardActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  simDot:     { width: 12, height: 12, borderRadius: 6 },
  simName:    { color: C.text, fontSize: 14, fontWeight: '600' },
  simSub:     { color: C.textMuted, fontSize: 12, marginTop: 1 },
  simCheck:   { color: C.primary, fontSize: 16, fontWeight: '700' },

  logoutBtn:  { marginTop: 8, backgroundColor: C.missedBg, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  logoutText: { color: C.missed, fontSize: 15, fontWeight: '700' },
});
