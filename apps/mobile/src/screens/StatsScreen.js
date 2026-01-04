import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import api from '../services/api';
import { COLORS, fmt } from '../constants/theme';

export default function StatsScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [vehiclesRes, analyticsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/maintenance/fleet/analytics'),
      ]);
      setVehicles(vehiclesRes.data.data || []);
      setAnalytics(analyticsRes.data.data);
    } catch (e) {
      console.error('Stats yuklashda xatolik:', e);
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

  const summary = analytics?.summary || {};
  const stats = {
    total: vehicles.length,
    excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
    attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length,
    totalKm: vehicles.reduce((s, v) => s + (v.currentOdometer || 0), 0),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistika</Text>
        <Text style={styles.headerSubtitle}>{stats.total} ta mashina</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.indigo500]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stats */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={[styles.mainCardIcon, { backgroundColor: summary.isProfitable ? COLORS.emerald500 : COLORS.red500 }]}>
              <Icon name={summary.isProfitable ? 'trending-up' : 'trending-down'} size={24} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.mainCardLabel}>Sof foyda/zarar</Text>
              <Text style={[styles.mainCardValue, { color: summary.isProfitable ? COLORS.emerald600 : COLORS.red600 }]}>
                {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
              </Text>
            </View>
          </View>
          <View style={styles.mainCardRow}>
            <View style={styles.mainCardItem}>
              <Icon name="arrow-up-right" size={16} color={COLORS.emerald500} />
              <Text style={styles.mainCardItemLabel}>Daromad</Text>
              <Text style={[styles.mainCardItemValue, { color: COLORS.emerald600 }]}>{fmt(summary.totalIncome || 0)}</Text>
            </View>
            <View style={styles.mainCardItem}>
              <Icon name="arrow-down-right" size={16} color={COLORS.red500} />
              <Text style={styles.mainCardItemLabel}>Xarajat</Text>
              <Text style={[styles.mainCardItemValue, { color: COLORS.red600 }]}>{fmt(summary.totalExpenses || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="truck" label="Jami mashinalar" value={stats.total} color={COLORS.indigo500} bg={COLORS.indigo50} />
          <StatCard icon="check-circle" label="Yaxshi holat" value={stats.excellent} color={COLORS.emerald500} bg={COLORS.emerald50} />
          <StatCard icon="alert-triangle" label="Diqqat talab" value={stats.attention} color={COLORS.amber500} bg={COLORS.amber50} />
          <StatCard icon="activity" label="Jami km" value={fmt(stats.totalKm)} color={COLORS.blue500} bg={COLORS.blue50} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value, color, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={[styles.statCardIcon, { backgroundColor: color }]}>
      <Icon name={icon} size={18} color={COLORS.white} />
    </View>
    <Text style={styles.statCardLabel}>{label}</Text>
    <Text style={[styles.statCardValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate200 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate900 },
  headerSubtitle: { fontSize: 13, color: COLORS.slate500, marginTop: 2 },
  content: { padding: 16, paddingBottom: 100 },
  mainCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.slate200 },
  mainCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  mainCardIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainCardLabel: { fontSize: 13, color: COLORS.slate500 },
  mainCardValue: { fontSize: 26, fontWeight: '700' },
  mainCardRow: { flexDirection: 'row', backgroundColor: COLORS.slate50, borderRadius: 12, padding: 12, gap: 12 },
  mainCardItem: { flex: 1, alignItems: 'center' },
  mainCardItemLabel: { fontSize: 12, color: COLORS.slate500, marginTop: 4 },
  mainCardItemValue: { fontSize: 16, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', borderRadius: 16, padding: 16 },
  statCardIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statCardLabel: { fontSize: 12, color: COLORS.slate500, marginBottom: 4 },
  statCardValue: { fontSize: 22, fontWeight: '700' },
});
