import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../lib/api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

// ------------------------------------------------------------------
// NOTE: Real Android call log reading requires a custom Expo native
// module (react-native-call-log is incompatible with RN 0.73+).
// For now, sync sends the last 10 calls stored locally by the app.
// To upgrade: build a custom expo-module using Android ContentResolver
// and replace readLocalCallLogs() below.
// ------------------------------------------------------------------

async function readLocalCallLogs(sinceTimestamp) {
  try {
    const raw = await AsyncStorage.getItem('local_call_logs');
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((c) => new Date(c.timestamp).getTime() > sinceTimestamp);
  } catch {
    return [];
  }
}

// Called from the app when a call ends — saves to local storage
export async function saveCallLog(entry) {
  try {
    const raw = await AsyncStorage.getItem('local_call_logs');
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    // keep last 500 entries locally
    await AsyncStorage.setItem('local_call_logs', JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

export async function syncCallLogs() {
  const lastSyncRaw = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0;

  const newLogs = await readLocalCallLogs(lastSync);
  if (newLogs.length === 0) return { synced: 0, message: 'No new calls to sync' };

  const res = await api.post('/api/calls/sync', { calls: newLogs });
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  return { synced: res.data.data?.synced || 0, message: res.data.message };
}

export async function getLastSyncTime() {
  const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return raw ? new Date(parseInt(raw, 10)) : null;
}
