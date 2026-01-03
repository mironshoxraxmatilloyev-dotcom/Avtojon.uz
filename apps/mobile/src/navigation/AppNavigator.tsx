import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuthStore, UserRole } from '../store/authStore';
import { COLORS } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import FleetDashboardScreen from '../screens/FleetDashboardScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import ProfileScreen from '../screens/ProfileScreen';

// TODO: Bu screenlarni keyinroq qo'shamiz
// import DriverHomeScreen from '../screens/DriverHomeScreen';
// import BusinessDashboardScreen from '../screens/BusinessDashboardScreen';
// import SuperAdminScreen from '../screens/SuperAdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon komponenti
function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// Fleet Admin uchun tablar (admin role)
function FleetTabs() {
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

// Driver uchun tablar
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Asosiy" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// Vaqtinchalik Driver Home Screen
function DriverHomeScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>🚗</Text>
      <Text style={styles.placeholderTitle}>Haydovchi paneli</Text>
      <Text style={styles.placeholderText}>Tez orada...</Text>
    </View>
  );
}

// Business uchun tablar
function BusinessTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="BusinessHome"
        component={BusinessHomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Dashboard" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// Vaqtinchalik Business Home Screen
function BusinessHomeScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>💼</Text>
      <Text style={styles.placeholderTitle}>Biznes paneli</Text>
      <Text style={styles.placeholderText}>Tez orada...</Text>
    </View>
  );
}

// Super Admin uchun
function SuperAdminScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>⚙️</Text>
      <Text style={styles.placeholderTitle}>Super Admin</Text>
      <Text style={styles.placeholderText}>Web versiyadan foydalaning</Text>
    </View>
  );
}

// Role'ga qarab main screen tanlash
function getMainScreenByRole(role: UserRole) {
  switch (role) {
    case 'super_admin':
      return SuperAdminScreen;
    case 'admin':
      return FleetTabs;
    case 'business':
      return BusinessTabs;
    case 'driver':
      return DriverTabs;
    default:
      return FleetTabs;
  }
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Loading holati
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>🚛</Text>
        <View style={styles.splashTitleRow}>
          <Text style={styles.splashTitleWhite}>avto</Text>
          <Text style={styles.splashTitleYellow}>JON</Text>
        </View>
        <Text style={styles.splashSubtitle}>Fleet Management Pro</Text>
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

  // Role'ga qarab navigatsiya
  const role = user?.role || 'admin';
  const MainScreen = getMainScreenByRole(role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainScreen} />
      {/* Fleet admin uchun qo'shimcha screenlar */}
      {(role === 'admin' || role === 'business') && (
        <>
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
          <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  // Splash screen
  splash: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary 
  },
  splashIcon: { fontSize: 64, marginBottom: 16 },
  splashTitleRow: { flexDirection: 'row' },
  splashTitleWhite: { fontSize: 36, fontWeight: '700', color: '#fff' },
  splashTitleYellow: { fontSize: 36, fontWeight: '700', color: COLORS.secondary },
  splashSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  
  // Tab bar
  tabBar: { 
    height: 70, 
    paddingTop: 8, 
    paddingBottom: 12, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: { alignItems: 'center' },
  tabIcon: { fontSize: 24 },
  tabIconActive: { transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted, marginTop: 4 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
  
  // Placeholder screens
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  placeholderIcon: { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  placeholderText: { fontSize: 16, color: COLORS.textMuted },
});
