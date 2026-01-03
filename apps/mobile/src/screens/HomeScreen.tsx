import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../store/authStore';
import api from '../services/api';

interface Stats {
  totalVehicles: number;
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/vehicles');
      const vehicles = data.data || [];
      
      setStats({
        totalVehicles: vehicles.length,
        totalIncome: 0,
        totalExpense: 0,
        profit: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed', '#ec4899']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xush kelibsiz,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Foydalanuvchi'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icon name="bell" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Icon name="dollar-sign" size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Daromad</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Icon name="trending-down" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Xarajat</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Icon name="trending-up" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>+0</Text>
            <Text style={styles.statLabel}>Sof foyda</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tezkor amallar</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
                <Icon name="plus" size={24} color="#4f46e5" />
              </View>
              <Text style={styles.actionText}>Mashina qo'shish</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Icon name="droplet" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Yoqilg'i</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Icon name="tool" size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>Xizmat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                <Icon name="mic" size={24} color="#ec4899" />
              </View>
              <Text style={styles.actionText}>Ovoz</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicles Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mashinalar</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
              <Text style={styles.seeAll}>Barchasi →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Icon name="truck" size={20} color="#4f46e5" />
                <Text style={styles.summaryValue}>{stats.totalVehicles}</Text>
                <Text style={styles.summaryLabel}>Jami</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Icon name="check-circle" size={20} color="#22c55e" />
                <Text style={styles.summaryValue}>{stats.totalVehicles}</Text>
                <Text style={styles.summaryLabel}>Yaxshi</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Icon name="alert-triangle" size={20} color="#f59e0b" />
                <Text style={styles.summaryValue}>0</Text>
                <Text style={styles.summaryLabel}>Diqqat</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '25%',
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
