import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, fmt } from '../constants/theme';
import {
  TrendingUp, TrendingDown, DollarSign, Crown,
  ArrowUpRight, ArrowDownRight, BarChart3
} from '../components/Icons';

interface VehicleStat {
  _id: string;
  plateNumber: string;
  brand: string;
  income: number;
  expenses: number;
  profit: number;
  isProfitable: boolean;
}

interface Analytics {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitableCount: number;
    totalVehicles: number;
  };
  vehicleStats: VehicleStat[];
}

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');
  const [sortBy, setSortBy] = useState<'profit' | 'income' | 'expenses'>('profit');

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await api.get(`/maintenance/fleet/analytics?period=${period}`);
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const sortedVehicles = useMemo(() => {
    if (!analytics?.vehicleStats) return [];
    return [...analytics.vehicleStats].sort((a, b) => {
      if (sortBy === 'profit') return b.profit - a.profit;
      if (sortBy === 'income') return b.income - a.income;
      return b.expenses - a.expenses;
    });
  }, [analytics?.vehicleStats, sortBy]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const summary = analytics?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitableCount: 0,
    totalVehicles: 0,
  };

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
          <Text style={styles.title}>Moliyaviy tahlil</Text>
          <Text style={styles.subtitle}>{summary.totalVehicles} ta mashina</Text>
        </View>

        {/* Period Filter */}
        <View style={styles.periodFilter}>
          {[
            { value: '7', label: '7 kun' },
            { value: '30', label: '30 kun' },
            { value: '90', label: '3 oy' },
          ].map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodButton, period === p.value && styles.periodButtonActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.successLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success }]}>
              <DollarSign size={20} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{fmt(summary.totalIncome)}</Text>
            <Text style={styles.summaryLabel}>Daromad</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: COLORS.dangerLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.danger }]}>
              <TrendingDown size={20} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{fmt(summary.totalExpenses)}</Text>
            <Text style={styles.summaryLabel}>Xarajat</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: summary.netProfit >= 0 ? COLORS.successLight : COLORS.dangerLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: summary.netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
              <TrendingUp size={20} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: summary.netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
              {summary.netProfit >= 0 ? '+' : ''}{fmt(summary.netProfit)}
            </Text>
            <Text style={styles.summaryLabel}>Sof foyda</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: COLORS.warningLight }]}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning }]}>
              <Crown size={20} color="#fff" />
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {summary.profitableCount}/{summary.totalVehicles}
            </Text>
            <Text style={styles.summaryLabel}>Foydali</Text>
          </View>
        </View>

        {/* Sort Buttons */}
        <View style={styles.sortSection}>
          <Text style={styles.sectionTitle}>Mashinalar reytingi</Text>
          <View style={styles.sortButtons}>
            {[
              { value: 'profit', label: 'Foyda' },
              { value: 'income', label: 'Daromad' },
              { value: 'expenses', label: 'Xarajat' },
            ].map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.sortButton, sortBy === s.value && styles.sortButtonActive]}
                onPress={() => setSortBy(s.value as any)}
              >
                <Text style={[styles.sortText, sortBy === s.value && styles.sortTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicles Ranking */}
        <View style={styles.rankingList}>
          {sortedVehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <BarChart3 size={32} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Ma'lumot yo'q</Text>
              <Text style={styles.emptyText}>Mashinalar va ma'lumotlar qo'shing</Text>
            </View>
          ) : (
            sortedVehicles.map((v, i) => (
              <TouchableOpacity
                key={v._id}
                style={styles.rankingCard}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v._id })}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.rankBadge,
                  i === 0 && styles.rankBadgeGold,
                  i === 1 && styles.rankBadgeSilver,
                  i === 2 && styles.rankBadgeBronze,
                ]}>
                  <Text style={[
                    styles.rankText,
                    (i === 0 || i === 1 || i === 2) && styles.rankTextTop
                  ]}>
                    {i + 1}
                  </Text>
                </View>
                
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingPlate}>{v.plateNumber}</Text>
                  <Text style={styles.rankingBrand}>{v.brand}</Text>
                </View>

                <View style={styles.rankingStats}>
                  <Text style={[
                    styles.rankingProfit,
                    { color: v.profit >= 0 ? COLORS.success : COLORS.danger }
                  ]}>
                    {v.profit >= 0 ? '+' : ''}{fmt(v.profit)}
                  </Text>
                  <View style={[
                    styles.profitBadge,
                    { backgroundColor: v.isProfitable ? COLORS.successLight : COLORS.dangerLight }
                  ]}>
                    {v.isProfitable ? (
                      <ArrowUpRight size={12} color={COLORS.success} />
                    ) : (
                      <ArrowDownRight size={12} color={COLORS.danger} />
                    )}
                    <Text style={[
                      styles.profitBadgeText,
                      { color: v.isProfitable ? COLORS.success : COLORS.danger }
                    ]}>
                      {v.isProfitable ? 'Foydali' : 'Zarar'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  periodFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 16,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  sortSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  sortButtons: { flexDirection: 'row', gap: 8 },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  sortTextActive: { color: '#fff' },

  rankingList: { paddingHorizontal: 16 },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeGold: { backgroundColor: '#fef3c7' },
  rankBadgeSilver: { backgroundColor: '#e2e8f0' },
  rankBadgeBronze: { backgroundColor: '#fed7aa' },
  rankText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  rankTextTop: { color: COLORS.text },
  rankingInfo: { flex: 1, marginLeft: 12 },
  rankingPlate: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rankingBrand: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rankingStats: { alignItems: 'flex-end' },
  rankingProfit: { fontSize: 14, fontWeight: '700' },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  profitBadgeText: { fontSize: 10, fontWeight: '600' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});
