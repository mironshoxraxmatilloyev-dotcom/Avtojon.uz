import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';
import { Home, BarChart3, AlertTriangle, User, Truck } from '../components/Icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import FleetDashboardScreen from '../screens/FleetDashboardScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import AlertsScreen from '../screens/AlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Fleet Admin uchun tablar - web bilan bir xil
function FleetTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Fleet"
        component={FleetDashboardScreen}
        options={{
          tabBarLabel: 'Avtopark',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Home size={20} color={focused ? '#fff' : COLORS.textMuted} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Statistika',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <BarChart3 size={20} color={focused ? '#fff' : COLORS.textMuted} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: 'Diqqat',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <AlertTriangle size={20} color={focused ? '#fff' : COLORS.textMuted} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <User size={20} color={focused ? '#fff' : COLORS.textMuted} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Loading holati
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <Truck size={40} color="#fff" />
        </View>
        <Text style={styles.splashTitle}>avtoJON</Text>
      </View>
    );
  }

  // Autentifikatsiya yo'q - Login
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Autentifikatsiya bor - Fleet app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={FleetTabs} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
