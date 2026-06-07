import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import api from '../lib/api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

// Map Android call type integers to our schema strings
const ANDROID_TYPE_MAP = {
  1: 'incoming',
  2: 'outgoing',
  3: 'missed',
  5: 'rejected'
};

async function requestCallLogPermission() {
  if (Platform.OS !== 'android') return false;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    {
      title: 'Call Log Permission',
      message: 'CallTrack needs access to your call log to sync calls with your manager.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny'
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

async function readDeviceCallLogs(sinceTimestamp) {
  if (Platform.OS !== 'android') return [];

  const hasPermission = await requestCallLogPermission();
  if (!hasPermission) throw new Error('Call log permission denied');

  // react-native-call-log requires EAS bare build — it won't work in Expo Go
  const CallLogs = require('react-native-call-log').default;
  const rawLogs = await CallLogs.load(200); // fetch last 200 entries

  const newLogs = [];
  for (const log of rawLogs) {
    const ts = parseInt(log.timestamp, 10);
    if (ts <= sinceTimestamp) continue; // already synced

    const callType = ANDROID_TYPE_MAP[parseInt(log.type, 10)];
    if (!callType) continue; // skip unknown types

    newLogs.push({
      callType,
      contactNumber: log.phoneNumber || 'Unknown',
      contactName: log.name || 'Unknown',
      duration: parseInt(log.duration, 10) || 0,
      timestamp: new Date(ts).toISOString()
    });
  }
  return newLogs;
}

export async function syncCallLogs() {
  const lastSyncRaw = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0;

  const newLogs = await readDeviceCallLogs(lastSync);
  if (newLogs.length === 0) return { synced: 0, message: 'No new calls to sync' };

  const res = await api.post('/api/calls/sync', { calls: newLogs });
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  return { synced: res.data.data?.synced || 0, message: res.data.message };
}

export async function getLastSyncTime() {
  const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return raw ? new Date(parseInt(raw, 10)) : null;
}
