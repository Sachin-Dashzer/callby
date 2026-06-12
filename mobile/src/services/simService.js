import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { SimInfoModule, CallLogModule } = NativeModules;

const SIM_PREF_KEY = 'tracked_sim_id';

export async function getAvailableSims() {
  try {
    return await SimInfoModule.getAvailableSims();
  } catch {
    return [];
  }
}

export async function getTrackedSimId() {
  const raw = await AsyncStorage.getItem(SIM_PREF_KEY);
  return raw ? parseInt(raw, 10) : -1;
}

export async function setTrackedSim(subscriptionId) {
  await AsyncStorage.setItem(SIM_PREF_KEY, String(subscriptionId));
  CallLogModule?.setTrackedSim(subscriptionId);
}

// Call this on every app start to restore the saved preference into native
export async function applyTrackedSim() {
  const id = await getTrackedSimId();
  CallLogModule?.setTrackedSim(id);
}
