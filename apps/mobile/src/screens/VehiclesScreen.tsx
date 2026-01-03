import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../services/api';

interface Vehicle {
  _id: string;
  plateNumber: string;
  brand: string;
  model?: string;
  year?: number;
  status: string;
  currentOdometer?: number;
}

export default function VehiclesScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  }, []);

  const filteredVehicles = vehicles.filter(v =>
    v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const formatNumber = (num: number) => new Intl.NumberFormat('uz-UZ').format(num);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'normal':
        return '#22c55e';
      case 'attention':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'normal':
        return 'Yaxshi';
      case 'attention':
        return 'Diqqat';
      case 'critical':
        return 'Kritik';
      default:
        return 'Noma\'lum';
    }
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => navigation.navigate('VehicleDetail', { id: item._id })}
    >
      <View style={styles.vehicleIcon}>
        <Icon name="truck" size={24} color="#4f46e5" />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.plateNumber}>{item.plateNumber}</Text>
        <Text style={styles.vehicleBrand}>
          {item.brand} {item.model} {item.year ? `(${item.year})` : ''}
        </Text>
        {item.currentOdometer && (
          <Text style={styles.odometer}>
            {formatNumber(item.currentOdometer)} km
          </Text>
        )}
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mashinalar</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mashina qidirish..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Jami</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>
            {vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length}
          </Text>
          <Text style={styles.statLabel}>Yaxshi</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>Diqqat</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="truck" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Mashinalar topilmadi</Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Mashina qo'shish</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vehicleInfo: {
    flex: 1,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  vehicleBrand: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  odometer: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
