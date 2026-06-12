import {
  NativeModules, DeviceEventEmitter,
  PermissionsAndroid, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { CallLogModule } = NativeModules;

export async function requestCallPermissions() {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

// Request SYSTEM_ALERT_WINDOW permission — opens settings once if not granted
export async function requestOverlayPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const hasPermission = await CallLogModule?.checkOverlayPermission?.();
    if (hasPermission) return true;

    const alreadyAsked = await AsyncStorage.getItem('overlay_perm_asked');
    if (alreadyAsked) return false;

    await AsyncStorage.setItem('overlay_perm_asked', '1');
    Alert.alert(
      'Allow Pop-up Overlay',
      'To show the call notes popup even when the app is closed, please enable "Display over other apps" for CallTrack in the next screen.',
      [
        {
          text: 'Enable Now',
          onPress: () => CallLogModule?.openOverlaySettings?.(),
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
    return false;
  } catch {
    return false;
  }
}

// Returns an unsubscribe function
export function onCallEnded(callback) {
  const sub = DeviceEventEmitter.addListener('onCallEnded', callback);
  return () => sub.remove();
}
