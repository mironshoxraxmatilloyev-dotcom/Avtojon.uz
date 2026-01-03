import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FUEL_TYPES, fmt } from '../constants/theme';

type TabId = 'summary' | 'income' | 'fuel' | 'oil' | 'tires' | 'services';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'summary', label: 'Umumiy', icon: '📊' },
  { id: 'income', label: 'Daromad', icon: '💰' },
  { id: 'fuel', label: "Yoqilg'i", icon: '⛽' },
  { id: 'oil', label: 'Moy', icon: '🛢️' },
  { id: 'tires', label: 'Shina', icon: '⭕' },
  { id: 'services', label: 'Xizmat', icon: '🔧' },
];

export default function VehicleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [period, setPeriod] = useState('30');

  const loadData = useCallback(async () => {
    try {
      const [vRes, aRes] = await Promise.all([
        api.get(`/vehicles/${vehicleId}`),
        api.get(`/maintenance/vehicles/${vehicleId}/analytics?period=${period}`),
      ]);
      setVehicle(vRes.data.data);
      setAnalytics(aRes.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Mashina topilmadi</Text>
      </View>
    );
  }

  const summary = analytics?.summary || {};
  const netProfit = (summary.totalIncome || 0) - (summary.totalExpenses || 0);
  const isProfitable = netProfit >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
          <Text style={styles.brand}>{vehicle.brand} {vehicle.model || ''}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {activeTab === 'summary' && (
          <View style={styles.summaryContent}>
            {/* Period Selector */}
            <View style={styles.periodRow}>
              {['7', '30', '90', '365'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                    {p === '7' ? '7 kun' : p === '30' ? '30 kun' : p === '90' ? '3 oy' : '1 yil'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Profit Card */}
            <View style={[styles.profitCard, { backgroundColor: isProfitable ? '#10b98115' : '#ef444415' }]}>
              <Text style={styles.profitLabel}>Sof foyda ({period} kun)</Text>
              <Text style={[styles.profitValue, { color: isProfitable ? COLORS.success : COLORS.danger }]}>
                {isProfitable ? '+' : ''}{fmt(netProfit)} so'm
              </Text>
              <View style={styles.profitStats}>
                <View style={styles.profitStat}>
                  <Text style={styles.profitStatIcon}>📈</Text>
                  <Text style={styles.profitStatLabel}>Daromad</Text>
                  <Text style={[styles.profitStatValue, { color: COLORS.success }]}>{fmt(summary.totalIncome || 0)}</Text>
                </View>
                <View style={styles.profitStat}>
                  <Text style={styles.profitStatIcon}>📉</Text>
                  <Text style={styles.profitStatLabel}>Xarajat</Text>
                  <Text style={[styles.profitStatValue, { color: COLORS.danger }]}>{fmt(summary.totalExpenses || 0)}</Text>
                </View>
              </View>
            </View>

            {/* Expense Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.cardTitle}>Xarajat taqsimoti</Text>
              {['fuel', 'oil', 'tires', 'service'].map((type) => {
                const data = analytics?.expenseBreakdown?.[type] || { amount: 0, percent: 0 };
                const icons: Record<string, string> = { fuel: '⛽', oil: '🛢️', tires: '⭕', service: '🔧' };
                const labels: Record<string, string> = { fuel: "Yoqilg'i", oil: 'Moy', tires: 'Shinalar', service: 'Xizmat' };
                return (
                  <View key={type} style={styles.breakdownRow}>
                    <Text style={styles.breakdownIcon}>{icons[type]}</Text>
                    <Text style={styles.breakdownLabel}>{labels[type]}</Text>
                    <Text style={styles.breakdownValue}>{fmt(data.amount)} so'm</Text>
                    <Text style={styles.breakdownPercent}>({data.percent}%)</Text>
                  </View>
                );
              })}
            </View>

            {/* Vehicle Info */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Mashina ma'lumotlari</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Spidometr</Text>
                <Text style={styles.infoValue}>{fmt(vehicle.currentOdometer || 0)} km</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Yoqilg'i turi</Text>
                <Text style={styles.infoValue}>{FUEL_TYPES[vehicle.fuelType] || '-'}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab !== 'summary' && (
          <DataTab vehicleId={vehicleId} type={activeTab} onRefresh={loadData} />
        )}
      </ScrollView>
    </View>
  );
}

// Data Tab Component
function DataTab({ vehicleId, type, onRefresh }: { vehicleId: string; type: string; onRefresh: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'oil' ? 'oil' : type === 'tires' ? 'tires' : type === 'services' ? 'services' : type;
      const { data: res } = await api.get(`/maintenance/vehicles/${vehicleId}/${endpoint}`);
      const items = res.data?.refills || res.data?.changes || res.data?.incomes || res.data?.services || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;
  }

  const icons: Record<string, string> = { income: '💰', fuel: '⛽', oil: '🛢️', tires: '⭕', services: '🔧' };
  const colors: Record<string, string> = { income: COLORS.success, fuel: COLORS.warning, oil: '#f59e0b', tires: '#8b5cf6', services: '#06b6d4' };

  return (
    <View style={styles.dataTab}>
      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{icons[type] || '📋'}</Text>
          <Text style={styles.emptyText}>Ma'lumot yo'q</Text>
        </View>
      ) : (
        data.map((item, i) => (
          <View key={item._id || i} style={styles.dataCard}>
            <View style={[styles.dataIcon, { backgroundColor: colors[type] + '20' }]}>
              <Text>{icons[type]}</Text>
            </View>
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>
                {type === 'fuel' ? `${item.liters} L` : type === 'income' ? (item.description || 'Daromad') : (item.description || item.type || item.brand || 'Xizmat')}
              </Text>
              <Text style={styles.dataSubtitle}>{new Date(item.date || item.installDate).toLocaleDateString('uz-UZ')}</Text>
            </View>
            <Text style={[styles.dataAmount, { color: type === 'income' ? COLORS.success : COLORS.danger }]}>
              {type === 'income' ? '+' : '-'}{fmt(item.amount || item.cost || 0)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textMuted },
  header: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerInfo: { flex: 1, marginLeft: 8 },
  plateNumber: { fontSize: 18, fontWeight: '700', color: '#fff' },
  brand: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  refreshBtn: { padding: 8 },
  refreshIcon: { fontSize: 20 },
  tabsWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabs: { paddingHorizontal: 12, paddingVertical: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 12, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabIcon: { fontSize: 14, marginRight: 6 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabLabelActive: { color: '#fff' },
  content: { flex: 1 },
  summaryContent: { padding: 16 },
  periodRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  periodBtnActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },
  profitCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  profitLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  profitValue: { fontSize: 28, fontWeight: '700' },
  profitStats: { flexDirection: 'row', marginTop: 16, gap: 16 },
  profitStat: { flex: 1 },
  profitStatIcon: { fontSize: 16, marginBottom: 4 },
  profitStatLabel: { fontSize: 12, color: COLORS.textMuted },
  profitStatValue: { fontSize: 16, fontWeight: '600' },
  breakdownCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  breakdownIcon: { fontSize: 18, marginRight: 12 },
  breakdownLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  breakdownPercent: { fontSize: 12, color: COLORS.textMuted },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dataTab: { padding: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  dataCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  dataIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dataInfo: { flex: 1, marginLeft: 12 },
  dataTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dataSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dataAmount: { fontSize: 14, fontWeight: '700' },
});
