import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Screens
import HomeScreen from '../screens/HomeScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'home';
          
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Vehicles') iconName = 'truck';
          else if (route.name === 'Stats') iconName = 'bar-chart-2';
          else if (route.name === 'Profile') iconName = 'user';

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Icon name={iconName} size={22} color={focused ? '#fff' : color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[styles.tabLabel, { color: focused ? '#4f46e5' : color }]}>
            {route.name === 'Home' ? 'Bosh sahifa' :
             route.name === 'Vehicles' ? 'Mashinalar' :
             route.name === 'Stats' ? 'Statistika' : 'Profil'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
