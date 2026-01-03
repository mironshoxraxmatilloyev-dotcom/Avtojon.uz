import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import FleetDashboardScreen from '../screens/FleetDashboardScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Fleet"
        component={FleetDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🚛" label="Avtopark" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>🚛</Text>
        <Text style={styles.splashTitle}>avtoJON</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
          <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  splashIcon: { fontSize: 64, marginBottom: 16 },
  splashTitle: { fontSize: 32, fontWeight: '700', color: '#fff' },
  tabBar: { height: 70, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  tabItem: { alignItems: 'center' },
  tabIcon: { fontSize: 24 },
  tabIconActive: { transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted, marginTop: 4 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
});
