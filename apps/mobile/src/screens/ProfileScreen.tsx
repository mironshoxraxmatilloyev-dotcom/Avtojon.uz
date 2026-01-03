import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { COLORS, fmt } from '../constants/theme';
import api from '../services/api';
import { User, LogOut, Crown, Truck, ChevronRight, Shield } from '../components/Icons';

interface Subscription {
  plan: 'trial' | 'pro';
  startDate?: string;
  endDate?: string;
  isExpired: boolean;
  daysLeft?: number;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subRes, vehiclesRes] = await Promise.all([
          api.get('/vehicles/subscription'),
          api.get('/vehicles'),
        ]);
        setSubscription(subRes.data.data);
        setVehicleCount(vehiclesRes.data.data?.length || 0);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const getDaysLeft = () => {
    if (!subscription?.endDate) return 0;
    const diff = new Date(subscription.endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const daysLeft = getDaysLeft();
  const isPro = subscription?.plan === 'pro';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Foydalanuvchi'}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'admin' ? 'Fleet Admin' : user?.role === 'business' ? 'Biznes' : 'Foydalanuvchi'}
            </Text>
          </View>
        </View>

        {/* Subscription Card */}
        <View style={[styles.subscriptionCard, { backgroundColor: isPro ? COLORS.successLight : COLORS.warningLight }]}>
          <View style={styles.subscriptionHeader}>
            <View style={[styles.subscriptionIcon, { backgroundColor: isPro ? COLORS.success : COLORS.warning }]}>
              <Crown size={20} color="#fff" />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionPlan}>{isPro ? 'Pro' : 'Trial'} Tarif</Text>
              <Text style={styles.subscriptionDays}>
                {subscription?.isExpired ? 'Tugagan' : `${daysLeft} kun qoldi`}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: isPro ? COLORS.success : COLORS.warning }]}>
            <Text style={styles.upgradeButtonText}>{isPro ? 'Uzaytirish' : 'Pro ga o\'tish'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight + '30' }]}>
              <Truck size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{vehicleCount}</Text>
            <Text style={styles.statLabel}>Mashinalar</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.successLight }]}>
              <Shield size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{isPro ? 'Pro' : 'Trial'}</Text>
            <Text style={styles.statLabel}>Tarif</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Sozlamalar</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.infoLight }]}>
              <User size={18} color={COLORS.info} />
            </View>
            <Text style={styles.menuText}>Profil ma'lumotlari</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.dangerLight }]}>
              <LogOut size={18} color={COLORS.danger} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.danger }]}>Chiqish</Text>
            <ChevronRight size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>avtoJON</Text>
          <Text style={styles.appVersion}>Versiya 1.0.0</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },

  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  userInfo: { marginLeft: 14 },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  userRole: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  subscriptionCard: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16,
  },
  subscriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  subscriptionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subscriptionInfo: { marginLeft: 12 },
  subscriptionPlan: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  subscriptionDays: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  upgradeButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  menuSection: { paddingHorizontal: 16 },
  menuTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  menuItemDanger: { marginTop: 8 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: COLORS.text },

  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  appVersion: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
