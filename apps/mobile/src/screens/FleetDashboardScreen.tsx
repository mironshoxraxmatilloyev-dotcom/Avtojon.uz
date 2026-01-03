import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FUEL_TYPES, STATUS_CONFIG, fmt } from '../constants/theme';

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

export default function FleetDashboardScreen() {
  const navigation = useNavigation<any>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const onRefresh = () => { setRefreshing(true); loadVehicles(); };

  const filtered = vehicles.filter((v) =>
    v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase())
  );

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.normal;
    const isWarning = item.status === 'attention' || item.status === 'critical';

    return (
      <TouchableOpacity
        style={[styles.card, isWarning && { borderLeftColor: status.color, borderLeftWidth: 4 }]}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
      >
        <View style={[styles.iconBox, isWarning && { backgroundColor: status.color + '20' }]}>
          <Text style={styles.iconText}>🚛</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.plateNumber}>{item.plateNumber}</Text>
            <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.brand}>{item.brand} {item.model || ''}</Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>📍 {fmt(item.currentOdometer)} km</Text>
            <Text style={styles.stat}>⛽ {FUEL_TYPES[item.fuelType] || '-'}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Avtopark</Text>
        <Text style={styles.subtitle}>{vehicles.length} ta mashina</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Qidirish..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚛</Text>
            <Text style={styles.emptyText}>Mashina topilmadi</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddVehicle')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 24 },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plateNumber: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  brand: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 6, gap: 12 },
  stat: { fontSize: 12, color: COLORS.textMuted },
  chevron: { fontSize: 24, color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
});
