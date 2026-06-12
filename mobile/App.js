import React, { useEffect, useState, useRef } from 'react';
import {
  View, ActivityIndicator, AppRegistry, AppState,
  NativeModules, PermissionsAndroid, Platform
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen       from './src/screens/LoginScreen';
import CallHistoryScreen from './src/screens/CallHistoryScreen';
import AnalyticsScreen   from './src/screens/AnalyticsScreen';
import FollowupsScreen   from './src/screens/FollowupsScreen';
import ContactsScreen    from './src/screens/ContactsScreen';
import MoreScreen        from './src/screens/MoreScreen';
import TabBar            from './src/components/TabBar';
import AfterCallModal    from './src/components/AfterCallModal';
import AddNoteModal      from './src/components/AddNoteModal';

import { requestCallPermissions, requestOverlayPermission, onCallEnded } from './src/services/phoneStateService';
import { applyTrackedSim } from './src/services/simService';
import { getPendingFollowUps } from './src/utils/callNotes';
import { syncCallLogs } from './src/services/callLogService';

const { CallLogModule } = NativeModules;

async function requestNotificationPermission() {
  if (Platform.OS !== 'android') return;
  try {
    if (Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  } catch {}
}

function App() {
  const [screen, setScreen]               = useState(null);
  const [tab, setTab]                     = useState('calls');
  const [pendingCall, setPendingCall]     = useState(null);
  const [noteCall, setNoteCall]           = useState(null);
  const [followUpBadge, setFollowUpBadge] = useState(0);
  const appState  = useRef(AppState.currentState);
  const syncTimer = useRef(null);

  // ── Auth restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('token')
      .then((t) => setScreen(t ? 'main' : 'login'))
      .catch(() => setScreen('login'));
  }, []);

  // ── Main setup once logged in ─────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'main') return;

    requestCallPermissions();
    requestNotificationPermission();
    requestOverlayPermission();
    applyTrackedSim();

    // Listen for calls that end while app is open
    const unsub = onCallEnded((data) => setPendingCall(data));

    // Check for call that happened while app was closed — delay 800ms on cold start
    checkPendingCall(800);

    // Refresh follow-up badge
    refreshFollowUpBadge();

    // Live sync: when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkPendingCall(300);
        doSync();
        refreshFollowUpBadge();
      }
      appState.current = nextState;
    });

    // Polling sync every 60 seconds while app is open
    syncTimer.current = setInterval(doSync, 60_000);

    return () => {
      unsub();
      appStateSub.remove();
      clearInterval(syncTimer.current);
    };
  }, [screen]);

  const checkPendingCall = async (delayMs = 0) => {
    try {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      const pending = await CallLogModule?.getPendingCall?.();
      if (pending?.callType) setPendingCall(pending);
    } catch {}
  };

  const doSync = async () => {
    try { await syncCallLogs(); } catch {}
  };

  const refreshFollowUpBadge = async () => {
    const list = await getPendingFollowUps();
    setFollowUpBadge(list.length);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (screen === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#F8F9FB', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1A6BFF" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'login') {
    return (
      <SafeAreaProvider>
        <LoginScreen onLogin={() => setScreen('main')} />
      </SafeAreaProvider>
    );
  }

  const handleLogout = () => {
    clearInterval(syncTimer.current);
    setScreen('login');
    setTab('calls');
  };

  const handleNoteClose = () => {
    setNoteCall(null);
    refreshFollowUpBadge();
  };

  const badges = { followups: followUpBadge || undefined };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
        <View style={{ flex: 1 }}>
          {tab === 'calls'     && <CallHistoryScreen onAddNote={setNoteCall} onFollowUp={setNoteCall} />}
          {tab === 'analytics' && <AnalyticsScreen />}
          {tab === 'followups' && <FollowupsScreen  onAddNote={setNoteCall} />}
          {tab === 'contacts'  && <ContactsScreen />}
          {tab === 'more'      && <MoreScreen onLogout={handleLogout} />}
        </View>
        <TabBar active={tab} onChange={setTab} badges={badges} />
      </View>

      <AfterCallModal
        call={pendingCall}
        onClose={() => setPendingCall(null)}
      />

      <AddNoteModal
        call={noteCall}
        visible={!!noteCall}
        onClose={handleNoteClose}
      />
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
export default App;
