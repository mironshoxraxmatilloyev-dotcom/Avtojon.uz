import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { COLORS, SHADOWS, fmt } from '../constants/theme';
import VehicleCard from '../components/VehicleCard';
import AddVehicleModal from '../components/AddVehicleModal';

const SUPPORT_PHONE = '+998880191909';

// Obuna tugagan ekran
const ExpiredView = ({ onRefresh, onPayment, paymentLoading }) => {
  const handleSupport = () => {
    Linking.openURL('https://t.me/avtojon_support');
  };

  return (
    <SafeAreaView style={styles.expiredContainer}>
      <View style={styles.expiredContent}>
        {/* Icon */}
        <View style={styles.expiredIconContainer}>
          <Icon name="alert-triangle" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.expiredTitle}>Obuna tugadi</Text>
        <Text style={styles.expiredDesc}>
          Davom ettirish uchun obunani yangilang
        </Text>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View style={styles.priceIconBox}>
              <Icon name="award" size={24} color={COLORS.white} />
            </View>
            <View style={styles.priceInfo}>
              <Text style={styles.pricePlan}>Pro tarif</Text>
              <Text style={styles.priceSubtext}>Barcha imkoniyatlar</Text>
            </View>
            <View style={styles.priceAmount}>
              <Text style={styles.priceValue}>10K</Text>
              <Text style={styles.pricePer}>/mashina/oy</Text>
            </View>
          </View>

          {/* Payme orqali to'lash */}
          <TouchableOpacity 
            style={[styles.paymeBtn, paymentLoading && styles.btnDisabled]} 
            onPress={onPayment}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Icon name="credit-card" size={20} color={COLORS.white} />
                <Text style={styles.paymeBtnText}>Payme orqali to'lash</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
          <Icon name="message-circle" size={16} color={COLORS.indigo500} />
          <Text style={styles.supportText}>Yordam: @avtojon_support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Icon name="refresh-cw" size={16} color={COLORS.slate400} />
          <Text style={styles.refreshText}>Yangilash</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function FleetDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [fleetAnalytics, setFleetAnalytics] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Payme orqali to'lash
  const handlePayment = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const { data } = await api.post('/payments/create', {
        provider: 'payme'
      });
      
      if (data.success && data.data.paymentUrl) {
        // Payme sahifasini ochish
        const canOpen = await Linking.canOpenURL(data.data.paymentUrl);
        if (canOpen) {
          await Linking.openURL(data.data.paymentUrl);
        } else {
          Alert.alert('Xatolik', 'To\'lov sahifasini ochib bo\'lmadi');
        }
      } else {
        Alert.alert('Xatolik', 'To\'lov yaratishda xatolik');
      }
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.message || 'To\'lov yaratishda xatolik');
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/vehicles/subscription');
      setSubscription(data.data);
    } catch (e) {
      console.error('Subscription yuklashda xatolik:', e);
    } finally {
      setSubLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.data || []);
    } catch (e) {
      console.error('Mashinalar yuklashda xatolik:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await api.get('/maintenance/fleet/analytics');
      setFleetAnalytics(data.data);
    } catch (e) {
      console.error('Analytics yuklashda xatolik:', e);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchAnalytics();
    fetchSubscription();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
    fetchAnalytics();
    fetchSubscription();
  }, []);

  const handleAddVehicle = async (vehicleData) => {
    try {
      const { data } = await api.post('/vehicles', vehicleData);
      if (data.data) {
        setVehicles(prev => [data.data, ...prev]);
        setShowAddModal(false);
        Alert.alert('Muvaffaqiyat', 'Mashina qo\'shildi!');
      }
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.message || 'Mashina qo\'shishda xatolik');
    }
  };

  const handleDeleteVehicle = async (id) => {
    Alert.alert(
      'O\'chirish',
      'Mashinani o\'chirmoqchimisiz?',
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            setVehicles(prev => prev.filter(v => v._id !== id));
            try {
              await api.delete(`/vehicles/${id}`);
            } catch (e) {
              fetchVehicles();
            }
          },
        },
      ]
    );
  };

  // Filtrlangan mashinalar
  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.plateNumber?.toLowerCase().includes(q) || v.brand?.toLowerCase().includes(q);
  });

  // Stats
  const stats = {
    total: vehicles.length,
    totalIncome: fleetAnalytics?.summary?.totalIncome || 0,
    totalExpenses: fleetAnalytics?.summary?.totalExpenses || 0,
    netProfit: fleetAnalytics?.summary?.netProfit || 0,
    alertsCount: fleetAnalytics?.alertsCount || 0,
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Stats Grid - Web dagi kabi 2x2 */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="dollar-sign"
          label="Daromad"
          value={fmt(stats.totalIncome)}
          color="emerald"
        />
        <StatCard
          icon="trending-down"
          label="Xarajat"
          value={fmt(stats.totalExpenses)}
          color="red"
        />
        <StatCard
          icon="trending-up"
          label="Foyda"
          value={`${stats.netProfit >= 0 ? '+' : ''}${fmt(stats.netProfit)}`}
          color={stats.netProfit >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          icon="alert-circle"
          label="Diqqat"
          value={stats.alertsCount}
          color="amber"
          onPress={() => navigation.navigate('Alerts')}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={COLORS.slate400} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Mashina qidirish..."
          placeholderTextColor={COLORS.slate400}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="x" size={18} color={COLORS.slate400} />
          </TouchableOpacity>
        ) : null}
      </View>

      {search && (
        <Text style={styles.resultCount}>{filteredVehicles.length} ta natija</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="truck" size={40} color={COLORS.slate400} />
      </View>
      <Text style={styles.emptyTitle}>
        {search ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
      </Text>
      <Text style={styles.emptyDesc}>
        {search ? 'Boshqa so\'rov bilan urinib ko\'ring' : 'Birinchi mashinangizni qo\'shing'}
      </Text>
      {!search && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={18} color={COLORS.white} />
          <Text style={styles.emptyBtnText}>Mashina qo'shish</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading || subLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.indigo500} />
        </View>
      </SafeAreaView>
    );
  }

  // Obuna tugagan bo'lsa
  if (subscription?.isExpired) {
    return (
      <ExpiredView 
        onRefresh={() => { setSubLoading(true); fetchSubscription(); }} 
        onPayment={handlePayment}
        paymentLoading={paymentLoading}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            <Text style={styles.headerAvto}>avto</Text>
            <Text style={styles.headerJon}>JON</Text>
          </Text>
          <Text style={styles.headerSubtitle}>{stats.total} ta mashina</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => navigation.navigate('VehicleDetail', { id: item._id })}
            onDelete={() => handleDeleteVehicle(item._id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.indigo500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVehicle}
      />
    </SafeAreaView>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, color, onPress }) => {
  const colors = {
    emerald: { bg: COLORS.emerald50, icon: COLORS.emerald500, text: COLORS.emerald600 },
    red: { bg: COLORS.red50, icon: COLORS.red500, text: COLORS.red600 },
    amber: { bg: COLORS.amber50, icon: COLORS.amber500, text: COLORS.amber600 },
  };
  const c = colors[color] || colors.emerald;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.statCard, { backgroundColor: c.bg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIcon, { backgroundColor: c.icon }]}>
        <Icon name={icon} size={16} color={COLORS.white} />
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerAvto: {
    color: COLORS.slate800,
  },
  headerJon: {
    color: '#1e40af', // to'q ko'k
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerContent: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.slate500,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate900,
    marginLeft: 8,
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.slate200,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.indigo500,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.md,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  // ExpiredView styles
  expiredContainer: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  expiredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  expiredIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: COLORS.red500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.lg,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  expiredDesc: {
    fontSize: 16,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: 32,
  },
  priceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    ...SHADOWS.lg,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  priceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pricePlan: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  priceSubtext: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  priceAmount: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  pricePer: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  paymeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CDCD', // Payme rangi
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    ...SHADOWS.md,
  },
  paymeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.indigo500,
    fontWeight: '500',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emerald500,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    ...SHADOWS.md,
  },
  callBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  telegramBtn: {
    marginTop: 16,
  },
  telegramText: {
    fontSize: 14,
    color: COLORS.indigo500,
    fontWeight: '600',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  refreshText: {
    fontSize: 14,
    color: COLORS.indigo500,
    fontWeight: '500',
  },
});
