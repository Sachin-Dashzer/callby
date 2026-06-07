# CallTrack Mobile

React Native + Expo employee mobile app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update the API URL in `src/lib/api.js`:
   ```js
   const API_URL = 'http://YOUR_SERVER_IP:5000';
   ```
   Use your machine's local network IP (not `localhost`) so the device can reach the backend.

3. Start Expo:
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go (Android/iOS).

## Android Permissions

The app requires `READ_CALL_LOG` and `READ_CONTACTS` permissions. Grant these when prompted.

For a production build with real call log reading, integrate a native module such as `react-native-call-log` and replace the stub in `src/services/callLogService.js`.

## Screens

- **Login** — Email/password login, saves JWT to AsyncStorage
- **Home** — Today's call stats, manual sync button, auto-sync every 5 minutes, assigned leads
- **Calls** — Full call history with infinite scroll
- **Leads** — Assigned leads with status badges, add notes
