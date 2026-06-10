import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CallsScreen from './src/screens/CallsScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import TabBar from './src/components/TabBar';

export default function App() {
  const [screen, setScreen] = useState(null); // null = loading
  const [tab, setTab] = useState('home');

  useEffect(() => {
    AsyncStorage.getItem('token')
      .then((token) => setScreen(token ? 'main' : 'login'))
      .catch(() => setScreen('login'));
  }, []);

  if (screen === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#0f3460', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e94560" />
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

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#0f3460' }}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && <HomeScreen onLogout={() => setScreen('login')} />}
          {tab === 'calls' && <CallsScreen />}
          {tab === 'leads' && <LeadsScreen />}
        </View>
        <TabBar active={tab} onChange={setTab} />
      </View>
    </SafeAreaProvider>
  );
}
