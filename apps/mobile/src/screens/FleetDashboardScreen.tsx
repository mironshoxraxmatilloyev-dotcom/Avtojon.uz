import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FUEL_TYPES, STATUS_CONFIG, fmt } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  Search, Plus, Truck, ChevronRight, Fuel, Gauge,
  DollarSign, TrendingDown, TrendingUp, AlertTriangle, X
} from '../components/Icons';

interface Vehicle {
  _id: string;
  plateNumber: string;
  brand: string;
  model?: string;
  year?: number;
  fuelType: string;
  currentOdometer: number;
  status: string;
}

interface FleetAnalytics {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
  alertsCount: number;
}

export default function FleetDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await api.get('/maintenance/fleet/analytics');
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    loadAnalytics();
  }, [loadVehicles, loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
    loadAnalytics();
  };

  const filtered = vehicles.filter((v) =>
    v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = analytics?.summary?.totalIncome || 0;
  const totalExpenses = analytics?.summary?.totalExpenses || 0;
  const netProfit = analytics?.summary?.netProfit || 0;
  const alertsCount = analytics?.alertsCount || 0;

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.normal;
    const isWarning = item.status === 'attention' || item.status === 'critical';
    const isCritical = item.status === 'critical';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isWarning && { borderLeftColor: status.color, borderLeftWidth: 4 }
        ]}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconBox,
          { backgroundColor: isCritical ? COLORS.dangerLight : isWarning ? COLORS.warningLight : COLORS.primaryLight + '20' }
        ]}>
          <Truck size={24} color={isCritical ? COLORS.danger : isWarning ? COLORS.warning : COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.plateNumber}>{item.plateNumber}</Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.brand}>{item.brand} {item.model || ''} {item.year ? `• ${item.year}` : ''}</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Gauge size={12} color={COLORS.textMuted} />
              <Text style={styles.stat}>{fmt(item.currentOdometer)} km</Text>
            </View>
            <View style={styles.statItem}>
              <Fuel size={12} color={COLORS.textMuted} />
              <Text style={styles.stat}>{FUEL_TYPES[item.fuelType] || '-'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.chevronBox}>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {user?.fullName?.split(' ')[0] || 'Foydalanuvchi'}</Text>
          <Text style={styles.subtitle}>{vehicles.length} ta mashina</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: COLORS.successLight }]}>
          <View style={[styles.statIconBox, { backgroundColor: COLORS.success }]}>
            <DollarSign size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{fmt(totalIncome)}</Text>
          <Text style={styles.statLabel}>Daromad</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: COLORS.dangerLight }]}>
          <View style={[styles.statIconBox, { backgroundColor: COLORS.danger }]}>
            <TrendingDown size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>{fmt(totalExpenses)}</Text>
          <Text style={styles.statLabel}>Xarajat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: netProfit >= 0 ? COLORS.successLight : COLORS.dangerLight }]}>
          <View style={[styles.statIconBox, { backgroundColor: netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
            <TrendingUp size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
            {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
          </Text>
          <Text style={styles.statLabel}>Foyda</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: COLORS.warningLight }]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={[styles.statIconBox, { backgroundColor: COLORS.warning }]}>
            <AlertTriangle size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{alertsCount}</Text>
          <Text style={styles.statLabel}>Diqqat</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mashina qidirish..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicles List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Truck size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Boshqa so\'rov bilan urinib ko\'ring' : 'Birinchi mashinangizni qo\'shing'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Mashina qo'shish</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: COLORS.text,
  },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plateNumber: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  brand: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 8, gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stat: { fontSize: 12, color: COLORS.textMuted },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
