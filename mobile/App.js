import React, { useEffect, useState, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';

enableScreens();

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CallsScreen from './src/screens/CallsScreen';
import LeadsScreen from './src/screens/LeadsScreen';

// Catches any JS render crash and shows the error on screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f3460', padding: 20 }}>
          <Text style={{ color: '#e94560', fontSize: 18, fontWeight: 'bold', marginTop: 60, marginBottom: 12 }}>
            App Error
          </Text>
          <Text style={{ color: '#fff', fontSize: 13, marginBottom: 8 }}>
            {this.state.error.toString()}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 11 }}>
            {this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#16213e' },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#6b7280'
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Calls" component={CallsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📞</Text>, tabBarLabel: 'Calls' }} />
      <Tab.Screen name="Leads" component={LeadsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎯</Text>, tabBarLabel: 'Leads' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setInitialRoute(token ? 'Main' : 'Login');
    }).catch(() => {
      setInitialRoute('Login');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f3460', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#0f3460" />
          <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
