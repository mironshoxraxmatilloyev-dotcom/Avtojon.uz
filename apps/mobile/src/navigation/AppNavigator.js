import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

// Screens
import LoginScreen from '../screens/LoginScreen';
import FleetDashboardScreen from '../screens/FleetDashboardScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import StatsScreen from '../screens/StatsScreen';
import AlertsScreen from '../screens/AlertsScreen';

// Components
import VoiceRecorder from '../components/VoiceRecorder';

// Icons
import Icon from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Voice Button for center
const VoiceButton = ({ onPress }) => (
  <TouchableOpacity style={styles.voiceBtn} onPress={onPress} activeOpacity={0.8}>
    <Icon name="mic" size={24} color={COLORS.white} />
  </TouchableOpacity>
);

// Bottom Tab Navigator
function FleetTabs() {
  const [showVoice, setShowVoice] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  // Alertlar sonini olish
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const { data } = await api.get('/maintenance/fleet/analytics');
        const analytics = data.data;
        let count = 0;
        
        if (analytics?.vehicles) {
          analytics.vehicles.forEach(vehicle => {
            if (vehicle.oil?.status === 'critical' || vehicle.oil?.status === 'warning') {
              count++;
            }
            if (vehicle.tires?.alerts?.length > 0) {
              count += vehicle.tires.alerts.length;
            }
            if (vehicle.services?.upcoming?.length > 0) {
              count += vehicle.services.upcoming.length;
            }
          });
        }
        
        setAlertCount(count);
      } catch (e) {
        setAlertCount(0);
      }
    };
    
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVoiceResult = (result) => {
    console.log('Voice result:', result);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.indigo500,
          tabBarInactiveTintColor: COLORS.slate400,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={FleetDashboardScreen}
          options={{
            tabBarLabel: 'Avtopark',
            tabBarIcon: ({ color }) => <Icon name="truck" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarLabel: 'Statistika',
            tabBarIcon: ({ color }) => <Icon name="bar-chart-2" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Voice"
          component={View}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => <VoiceButton onPress={() => setShowVoice(true)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowVoice(true);
            },
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            tabBarLabel: 'Diqqat',
            tabBarIcon: ({ color }) => <Icon name="alert-triangle" size={22} color={color} />,
            tabBarBadge: alertCount > 0 ? alertCount : undefined,
            tabBarBadgeStyle: styles.badge,
          }}
        />
      </Tab.Navigator>

      <VoiceRecorder
        visible={showVoice}
        onClose={() => setShowVoice(false)}
        onResult={handleVoiceResult}
        context="vehicle"
      />
    </>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="FleetTabs" component={FleetTabs} />
          <Stack.Screen
            name="VehicleDetail"
            component={VehicleDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  voiceBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.lg,
  },
  badge: {
    backgroundColor: COLORS.red500,
    fontSize: 10,
  },
});
