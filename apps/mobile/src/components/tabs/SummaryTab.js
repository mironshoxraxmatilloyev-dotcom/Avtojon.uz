import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { COLORS, fmt } from '../../constants/theme';

const PERIODS = [
  { value: '7', label: '7 kun' },
  { value: '30', label: '30 kun' },
  { value: '90', label: '3 oy' },
  { value: '365', label: '1 yil' },
];

export default function SummaryTab({ vehicle }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (!vehicle?._id) return;
    setLoading(true);
    api.get(`/maintenance/vehicles/${vehicle._id}/analytics?period=${period}`)
      .then(res => setAnalytics(res.data.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [vehicle?._id, period]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.indigo500} />
      </View>
    );
  }

  const summary = analytics?.summary || {};
  const expenseBreakdown = analytics?.expenseBreakdown || {};
  const alerts = analytics?.alerts || [];

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Umumiy ko'rinish</Text>
        <View style={styles.periodGrid}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <View style={styles.alertsHeader}>
            <Icon name="bell" size={20} color={COLORS.amber600} />
            <Text style={styles.alertsTitle}>Diqqat! ({alerts.length} ta)</Text>
          </View>
          {alerts.slice(0, 3).map((alert, i) => (
            <View key={i} style={[styles.alertItem, { borderLeftColor: alert.severity === 'danger' ? COLORS.red500 : COLORS.amber500 }]}>
              <Icon name="alert-triangle" size={16} color={alert.severity === 'danger' ? COLORS.red500 : COLORS.amber500} />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Main Stats */}
      <View style={[styles.mainStatsCard, { backgroundColor: summary.isProfitable ? COLORS.emerald50 : COLORS.red50 }]}>
        <View style={styles.mainStatsHeader}>
          <View style={[styles.mainStatsIcon, { backgroundColor: summary.isProfitable ? COLORS.emerald500 : COLORS.red500 }]}>
            <Icon name={summary.isProfitable ? 'trending-up' : 'trending-down'} size={24} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.mainStatsLabel}>Sof foyda/zarar ({period} kun)</Text>
            <Text style={[styles.mainStatsValue, { color: summary.isProfitable ? COLORS.emerald600 : COLORS.red600 }]}>
              {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
            </Text>
          </View>
        </View>

        <View style={styles.mainStatsRow}>
          <View style={styles.mainStatItem}>
            <View style={[styles.mainStatIcon, { backgroundColor: COLORS.emerald100 }]}>
              <Icon name="arrow-up-right" size={14} color={COLORS.emerald600} />
            </View>
            <Text style={styles.mainStatLabel}>Daromad</Text>
            <Text style={[styles.mainStatValue, { color: COLORS.emerald600 }]}>{fmt(summary.totalIncome || 0)}</Text>
          </View>
          <View style={styles.mainStatItem}>
            <View style={[styles.mainStatIcon, { backgroundColor: COLORS.red100 }]}>
              <Icon name="arrow-down-right" size={14} color={COLORS.red600} />
            </View>
            <Text style={styles.mainStatLabel}>Xarajat</Text>
            <Text style={[styles.mainStatValue, { color: COLORS.red600 }]}>{fmt(summary.totalExpenses || 0)}</Text>
          </View>
        </View>
      </View>

      {/* Expense Breakdown */}
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <Icon name="pie-chart" size={20} color={COLORS.blue600} />
          <Text style={styles.breakdownTitle}>Xarajat taqsimoti</Text>
        </View>
        <ExpenseBar label="Yoqilg'i" data={expenseBreakdown.fuel} color={COLORS.blue500} />
        <ExpenseBar label="Moy" data={expenseBreakdown.oil} color={COLORS.amber500} />
        <ExpenseBar label="Shinalar" data={expenseBreakdown.tires} color={COLORS.violet500} />
        <ExpenseBar label="Xizmat" data={expenseBreakdown.service} color={COLORS.emerald500} />
        <ExpenseBar label="Boshqa" data={expenseBreakdown.other} color={COLORS.slate400} />
        
        <View style={styles.breakdownTotal}>
          <Text style={styles.breakdownTotalLabel}>Jami xarajat</Text>
          <Text style={styles.breakdownTotalValue}>{fmt(summary.totalExpenses || 0)} so'm</Text>
        </View>
      </View>
    </View>
  );
}

const ExpenseBar = ({ label, data, color }) => {
  const amount = data?.amount || 0;
  const percent = data?.percent || 0;

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseLabel}>{label}</Text>
        <View style={styles.expenseValues}>
          <Text style={styles.expenseAmount}>{fmt(amount)}</Text>
          <Text style={styles.expensePercent}>({percent}%)</Text>
        </View>
      </View>
      <View style={styles.expenseBarBg}>
        <View style={[styles.expenseBar, { width: `${Math.max(percent, 2)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  periodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.blue500,
    borderColor: COLORS.blue500,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  alertsContainer: {
    backgroundColor: COLORS.amber50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.amber200,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.amber800,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate700,
  },
  mainStatsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  mainStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mainStatsIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainStatsLabel: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  mainStatsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  mainStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  mainStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  expenseItem: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expenseLabel: {
    fontSize: 14,
    color: COLORS.slate600,
  },
  expenseValues: {
    flexDirection: 'row',
    gap: 6,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate900,
  },
  expensePercent: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  expenseBarBg: {
    height: 8,
    backgroundColor: COLORS.slate100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  expenseBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    color: COLORS.slate600,
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate900,
  },
});
