import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalFuelCost: 0,
    totalServiceCost: 0,
    totalIncome: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/vehicles');
      const vehicles = data.data || [];
      
      setStats({
        totalVehicles: vehicles.length,
        totalFuelCost: 0,
        totalServiceCost: 0,
        totalIncome: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('uz-UZ').format(num);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistika</Text>
        <Text style={styles.subtitle}>Umumiy ko'rsatkichlar</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <View style={[styles.mainStatCard, { backgroundColor: '#4f46e5' }]}>
            <View style={styles.mainStatIcon}>
              <Icon name="truck" size={24} color="#fff" />
            </View>
            <Text style={styles.mainStatValue}>{stats.totalVehicles}</Text>
            <Text style={styles.mainStatLabel}>Jami mashinalar</Text>
          </View>

          <View style={[styles.mainStatCard, { backgroundColor: '#10b981' }]}>
            <View style={styles.mainStatIcon}>
              <Icon name="dollar-sign" size={24} color="#fff" />
            </View>
            <Text style={styles.mainStatValue}>{formatNumber(stats.totalIncome)}</Text>
            <Text style={styles.mainStatLabel}>Jami daromad</Text>
          </View>
        </View>

        {/* Expense Stats */}
        <Text style={styles.sectionTitle}>Xarajatlar</Text>
        <View style={styles.expenseContainer}>
          <View style={styles.expenseCard}>
            <View style={[styles.expenseIcon, { backgroundColor: '#fef3c7' }]}>
              <Icon name="droplet" size={20} color="#f59e0b" />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseLabel}>Yoqilg'i</Text>
              <Text style={styles.expenseValue}>{formatNumber(stats.totalFuelCost)} so'm</Text>
            </View>
          </View>

          <View style={styles.expenseCard}>
            <View style={[styles.expenseIcon, { backgroundColor: '#dbeafe' }]}>
              <Icon name="tool" size={20} color="#3b82f6" />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseLabel}>Xizmat</Text>
              <Text style={styles.expenseValue}>{formatNumber(stats.totalServiceCost)} so'm</Text>
            </View>
          </View>

          <View style={styles.expenseCard}>
            <View style={[styles.expenseIcon, { backgroundColor: '#fce7f3' }]}>
              <Icon name="circle" size={20} color="#ec4899" />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseLabel}>Shinalar</Text>
              <Text style={styles.expenseValue}>0 so'm</Text>
            </View>
          </View>

          <View style={styles.expenseCard}>
            <View style={[styles.expenseIcon, { backgroundColor: '#d1fae5' }]}>
              <Icon name="droplet" size={20} color="#10b981" />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseLabel}>Moy</Text>
              <Text style={styles.expenseValue}>0 so'm</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Umumiy xarajat</Text>
          <Text style={styles.summaryValue}>
            {formatNumber(stats.totalFuelCost + stats.totalServiceCost)} so'm
          </Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sof foyda</Text>
            <Text style={[styles.summaryProfit, { color: stats.totalIncome > 0 ? '#10b981' : '#ef4444' }]}>
              {stats.totalIncome > 0 ? '+' : ''}{formatNumber(stats.totalIncome - stats.totalFuelCost - stats.totalServiceCost)} so'm
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
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
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  mainStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  mainStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  expenseContainer: {
    marginBottom: 24,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryProfit: {
    fontSize: 18,
    fontWeight: '700',
  },
});
