import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { useAuthStore } from './store/authStore';

LogBox.ignoreLogs(['Warning:', 'Non-serializable']);

export default function App() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
