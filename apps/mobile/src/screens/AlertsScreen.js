import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../services/api';
import { COLORS, fmt, fmtDate } from '../constants/theme';

export default function AlertsScreen() {
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Fleet analytics dan alertlarni olish
      const { data } = await api.get('/maintenance/fleet/analytics');
      const analytics = data.data;
      
      // Barcha mashinalar uchun alertlarni yig'ish
      const allAlerts = [];
      
      if (analytics?.vehicles) {
        analytics.vehicles.forEach(vehicle => {
          // Moy alertlari
          if (vehicle.oil?.status === 'critical' || vehicle.oil?.status === 'warning') {
            allAlerts.push({
              id: `oil-${vehicle._id}`,
              vehicleId: vehicle._id,
              plateNumber: vehicle.plateNumber,
              brand: vehicle.brand,
              type: 'oil',
              title: 'Moy almashtirish',
              message: vehicle.oil.remainingKm <= 0 
                ? 'Moy almashtirish vaqti o\'tdi!' 
                : `${fmt(vehicle.oil.remainingKm)} km qoldi`,
              severity: vehicle.oil.status === 'critical' ? 'critical' : 'warning',
              icon: 'droplet',
            });
          }
          
          // Shina alertlari
          if (vehicle.tires?.alerts?.length > 0) {
            vehicle.tires.alerts.forEach((alert, idx) => {
              allAlerts.push({
                id: `tire-${vehicle._id}-${idx}`,
                vehicleId: vehicle._id,
                plateNumber: vehicle.plateNumber,
                brand: vehicle.brand,
                type: 'tire',
                title: 'Shina',
                message: alert.message || 'Shina tekshiruvi kerak',
                severity: alert.severity || 'warning',
                icon: 'circle',
              });
            });
          }
          
          // Service alertlari
          if (vehicle.services?.upcoming?.length > 0) {
            vehicle.services.upcoming.forEach((service, idx) => {
              allAlerts.push({
                id: `service-${vehicle._id}-${idx}`,
                vehicleId: vehicle._id,
                plateNumber: vehicle.plateNumber,
                brand: vehicle.brand,
                type: 'service',
                title: service.type || 'Texnik xizmat',
                message: service.dueDate ? `${fmtDate(service.dueDate)} gacha` : 'Yaqinlashmoqda',
                severity: 'warning',
                icon: 'tool',
              });
            });
          }
        });
      }
      
      // Agar analytics dan alert kelmasa, mashinalarni tekshirish
      if (allAlerts.length === 0) {
        const vehiclesRes = await api.get('/vehicles');
        const vehicles = vehiclesRes.data.data || [];
        
        // Har bir mashina uchun maintenance ma'lumotlarini tekshirish
        for (const vehicle of vehicles) {
          try {
            const oilRes = await api.get(`/maintenance/vehicles/${vehicle._id}/oil`);
            const oilData = oilRes.data.data;
            
            if (oilData?.status === 'critical' || oilData?.status === 'warning') {
              allAlerts.push({
                id: `oil-${vehicle._id}`,
                vehicleId: vehicle._id,
                plateNumber: vehicle.plateNumber,
                brand: vehicle.brand,
                type: 'oil',
                title: 'Moy almashtirish',
                message: oilData.remainingKm <= 0 
                  ? 'Moy almashtirish vaqti o\'tdi!' 
                  : `${fmt(oilData.remainingKm)} km qoldi`,
                severity: oilData.status,
                icon: 'droplet',
              });
            }
          } catch (e) {
            // Skip if no oil data
          }
        }
      }
      
      setAlerts(allAlerts);
    } catch (e) {
      console.error('Alerts yuklashda xatolik:', e);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.indigo500} />
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => {
    const isCritical = item.severity === 'critical';
    const iconColors = {
      oil: COLORS.amber500,
      tire: COLORS.violet500,
      service: COLORS.blue500,
    };
    const iconBgColors = {
      oil: COLORS.amber100,
      tire: COLORS.violet50,
      service: COLORS.blue100,
    };
    
    return (
      <TouchableOpacity
        style={[styles.alertCard, { borderLeftColor: isCritical ? COLORS.red500 : COLORS.amber500 }]}
        onPress={() => navigation.navigate('VehicleDetail', { id: item.vehicleId })}
      >
        <View style={[styles.alertIcon, { backgroundColor: isCritical ? COLORS.red100 : iconBgColors[item.type] || COLORS.amber100 }]}>
          <Icon name={item.icon} size={20} color={isCritical ? COLORS.red500 : iconColors[item.type] || COLORS.amber500} />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertPlate}>{item.plateNumber}</Text>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={[styles.alertMessage, { color: isCritical ? COLORS.red600 : COLORS.amber600 }]}>
            {item.message}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.slate400} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diqqat talab</Text>
        <Text style={styles.headerSubtitle}>{alerts.length} ta ogohlantirish</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.indigo500]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icon name="check-circle" size={48} color={COLORS.emerald500} />
            </View>
            <Text style={styles.emptyTitle}>Hammasi yaxshi!</Text>
            <Text style={styles.emptyText}>Diqqat talab ogohlantirishlar yo'q</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate200 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate900 },
  headerSubtitle: { fontSize: 13, color: COLORS.slate500, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 100 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.slate200 },
  alertIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertInfo: { flex: 1 },
  alertPlate: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  alertTitle: { fontSize: 13, color: COLORS.slate500, marginTop: 2 },
  alertMessage: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: COLORS.emerald50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate900, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.slate500 },
});
