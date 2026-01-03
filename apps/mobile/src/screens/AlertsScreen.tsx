import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS } from '../constants/theme';
import {
  AlertTriangle, Bell, Shield, Truck, ChevronRight,
  Droplets, CircleIcon, Wrench, CheckCircle
} from '../components/Icons';

interface Alert {
  vehicleId: string;
  plateNumber: string;
  brand?: string;
  type: 'oil' | 'tire' | 'service' | 'other';
  severity: 'warning' | 'danger';
  message: string;
}

interface Vehicle {
  _id: string;
  plateNumber: string;
  brand: string;
  status: string;
}

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [alertsRes, vehiclesRes] = await Promise.all([
        api.get('/maintenance/fleet/alerts'),
        api.get('/vehicles'),
      ]);
      setAlerts(alertsRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Kategoriyalarga ajratish
  const dangerVehicleIds = new Set(alerts.filter(a => a.severity === 'danger').map(a => a.vehicleId));
  const warningVehicleIds = new Set(alerts.filter(a => a.severity === 'warning').map(a => a.vehicleId));

  const criticalVehicles = vehicles.filter(v => 
    v.status === 'critical' || dangerVehicleIds.has(v._id)
  );
  const warningVehicles = vehicles.filter(v => {
    const isCritical = v.status === 'critical' || dangerVehicleIds.has(v._id);
    return !isCritical && (v.status === 'attention' || warningVehicleIds.has(v._id));
  });
  const healthyCount = vehicles.length - criticalVehicles.length - warningVehicles.length;

  const oilAlerts = alerts.filter(a => a.type === 'oil');
  const tireAlerts = alerts.filter(a => a.type === 'tire');
  const serviceAlerts = alerts.filter(a => a.type === 'service');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const hasAnyIssue = alerts.length > 0 || criticalVehicles.length > 0 || warningVehicles.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Diqqat talab</Text>
          <Text style={styles.subtitle}>{alerts.length} ta ogohlantirish</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.dangerLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.danger }]}>
              <AlertTriangle size={18} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{criticalVehicles.length}</Text>
            <Text style={styles.summaryLabel}>Kritik</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: COLORS.warningLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning }]}>
              <Bell size={18} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{warningVehicles.length}</Text>
            <Text style={styles.summaryLabel}>Diqqat</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: COLORS.infoLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.info }]}>
              <Bell size={18} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.info }]}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>Ogohlantirishlar</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: COLORS.successLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success }]}>
              <Shield size={18} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{healthyCount}</Text>
            <Text style={styles.summaryLabel}>Yaxshi</Text>
          </View>
        </View>

        {/* All Good State */}
        {!hasAnyIssue && (
          <View style={styles.allGood}>
            <View style={styles.allGoodIcon}>
              <CheckCircle size={32} color={COLORS.success} />
            </View>
            <Text style={styles.allGoodTitle}>Hammasi yaxshi!</Text>
            <Text style={styles.allGoodText}>Barcha mashinalar yaxshi holatda</Text>
          </View>
        )}

        {/* Alert Groups */}
        {oilAlerts.length > 0 && (
          <AlertGroup
            title="Moy almashtirish"
            icon={Droplets}
            color="amber"
            alerts={oilAlerts}
            onPress={(vehicleId) => navigation.navigate('VehicleDetail', { vehicleId })}
          />
        )}

        {tireAlerts.length > 0 && (
          <AlertGroup
            title="Shina tekshiruvi"
            icon={CircleIcon}
            color="orange"
            alerts={tireAlerts}
            onPress={(vehicleId) => navigation.navigate('VehicleDetail', { vehicleId })}
          />
        )}

        {serviceAlerts.length > 0 && (
          <AlertGroup
            title="Texnik xizmat"
            icon={Wrench}
            color="red"
            alerts={serviceAlerts}
            onPress={(vehicleId) => navigation.navigate('VehicleDetail', { vehicleId })}
          />
        )}

        {/* Attention Vehicles */}
        {(criticalVehicles.length > 0 || warningVehicles.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.warningLight }]}>
                <Wrench size={16} color={COLORS.warning} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Xizmat kerak</Text>
                <Text style={styles.sectionSubtitle}>
                  {criticalVehicles.length + warningVehicles.length} ta mashina
                </Text>
              </View>
            </View>

            {criticalVehicles.map((v) => (
              <VehicleCard
                key={v._id}
                vehicle={v}
                isCritical
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v._id })}
              />
            ))}
            {warningVehicles.map((v) => (
              <VehicleCard
                key={v._id}
                vehicle={v}
                isCritical={false}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v._id })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Alert Group Component
function AlertGroup({ title, icon: Icon, color, alerts, onPress }: {
  title: string;
  icon: any;
  color: 'amber' | 'orange' | 'red';
  alerts: Alert[];
  onPress: (vehicleId: string) => void;
}) {
  const colors = {
    amber: { bg: COLORS.warningLight, border: '#fcd34d', icon: COLORS.warning, text: '#92400e' },
    orange: { bg: '#fff7ed', border: '#fdba74', icon: '#f97316', text: '#9a3412' },
    red: { bg: COLORS.dangerLight, border: '#fca5a5', icon: COLORS.danger, text: '#991b1b' },
  };
  const c = colors[color];

  return (
    <View style={[styles.alertGroup, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.alertGroupHeader}>
        <View style={[styles.alertGroupIcon, { backgroundColor: c.icon }]}>
          <Icon size={14} color="#fff" />
        </View>
        <View>
          <Text style={[styles.alertGroupTitle, { color: c.text }]}>{title}</Text>
          <Text style={styles.alertGroupCount}>{alerts.length} ta</Text>
        </View>
      </View>

      {alerts.slice(0, 3).map((alert, i) => (
        <TouchableOpacity
          key={i}
          style={styles.alertItem}
          onPress={() => onPress(alert.vehicleId)}
          activeOpacity={0.7}
        >
          <View style={styles.alertItemContent}>
            <View style={styles.alertItemHeader}>
              <Text style={styles.alertItemPlate}>{alert.plateNumber}</Text>
              {alert.severity === 'danger' && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>KRITIK</Text>
                </View>
              )}
            </View>
            <Text style={styles.alertItemMessage} numberOfLines={1}>{alert.message}</Text>
          </View>
          <ChevronRight size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      ))}

      {alerts.length > 3 && (
        <Text style={styles.moreText}>+{alerts.length - 3} ta yana</Text>
      )}
    </View>
  );
}

// Vehicle Card Component
function VehicleCard({ vehicle, isCritical, onPress }: {
  vehicle: Vehicle;
  isCritical: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        { backgroundColor: isCritical ? COLORS.dangerLight : COLORS.warningLight }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.vehicleIcon,
        { backgroundColor: isCritical ? '#fecaca' : '#fde68a' }
      ]}>
        <Truck size={20} color={isCritical ? COLORS.danger : COLORS.warning} />
      </View>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isCritical ? '#fecaca' : '#fde68a' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: isCritical ? COLORS.danger : COLORS.warning }
            ]}>
              {isCritical ? 'Kritik' : 'Diqqat'}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicleBrand}>{vehicle.brand}</Text>
      </View>
      <ChevronRight size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 14,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  allGood: {
    backgroundColor: COLORS.successLight,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  allGoodIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  allGoodTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  allGoodText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  alertGroup: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  alertGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  alertGroupIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertGroupTitle: { fontSize: 14, fontWeight: '700' },
  alertGroupCount: { fontSize: 10, color: COLORS.textMuted },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  alertItemContent: { flex: 1 },
  alertItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertItemPlate: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  criticalBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalBadgeText: { fontSize: 8, fontWeight: '700', color: COLORS.danger },
  alertItemMessage: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  moreText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionSubtitle: { fontSize: 10, color: COLORS.textMuted },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: { flex: 1, marginLeft: 12 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehiclePlate: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  vehicleBrand: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
