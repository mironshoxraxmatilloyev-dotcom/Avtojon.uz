import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FUEL_TYPES, fmt, fmtDate, today } from '../constants/theme';
import {
  ChevronLeft, BarChart3, DollarSign, Fuel, Droplets,
  CircleIcon, Wrench, Plus, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Bell, PieChart,
  Edit2, Trash2, X, Truck, Gift, Calendar
} from '../components/Icons';

// Tab types
type TabId = 'summary' | 'income' | 'fuel' | 'oil' | 'tires' | 'services';

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

export default function VehicleDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  // Data states
  const [fuelData, setFuelData] = useState({ refills: [], stats: {} });
  const [oilData, setOilData] = useState({ changes: [], status: 'ok', remainingKm: 10000 });
  const [tires, setTires] = useState([]);
  const [services, setServices] = useState({ services: [], stats: {} });
  const [incomeData, setIncomeData] = useState({ incomes: [], stats: {} });
  const [analytics, setAnalytics] = useState<any>(null);

  // Modal states
  const [modalType, setModalType] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Load vehicle
  useEffect(() => {
    api.get(`/vehicles/${vehicleId}`)
      .then(res => setVehicle(res.data.data))
      .catch(() => Alert.alert('Xatolik', 'Mashina topilmadi'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  // Load all data
  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [f, o, t, s, inc, an] = await Promise.all([
        api.get(`/maintenance/vehicles/${vehicleId}/fuel`).catch(() => ({ data: { data: { refills: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${vehicleId}/oil`).catch(() => ({ data: { data: { changes: [], status: 'ok', remainingKm: 10000 } } })),
        api.get(`/maintenance/vehicles/${vehicleId}/tires`).catch(() => ({ data: { data: [] } })),
        api.get(`/maintenance/vehicles/${vehicleId}/services`).catch(() => ({ data: { data: { services: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${vehicleId}/income`).catch(() => ({ data: { data: { incomes: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${vehicleId}/analytics?period=30`).catch(() => ({ data: { data: null } })),
      ]);
      setFuelData(f.data.data || { refills: [], stats: {} });
      setOilData(o.data.data || { changes: [], status: 'ok', remainingKm: 10000 });
      setTires(t.data.data || []);
      setServices(s.data.data || { services: [], stats: {} });
      setIncomeData(inc.data.data || { incomes: [], stats: {} });
      setAnalytics(an.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicle) loadData();
  }, [vehicle, loadData]);

  const onRefresh = () => loadData();

  // Delete handler
  const handleDelete = useCallback(async (type: string, itemId: string) => {
    Alert.alert('O\'chirish', 'O\'chirishni tasdiqlaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O\'chirish',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/maintenance/${type}/${itemId}`);
            loadData();
          } catch (err) {
            Alert.alert('Xatolik', 'O\'chirishda xatolik');
          }
        },
      },
    ]);
  }, [loadData]);

  // Tabs config
  const TABS = [
    { id: 'summary', icon: BarChart3, label: 'Umumiy', color: COLORS.primary },
    { id: 'income', icon: DollarSign, label: 'Daromad', color: COLORS.success },
    { id: 'fuel', icon: Fuel, label: 'Yoqilg\'i', color: COLORS.info },
    { id: 'oil', icon: Droplets, label: 'Moy', color: COLORS.warning },
    { id: 'tires', icon: CircleIcon, label: 'Shina', color: COLORS.violet },
    { id: 'services', icon: Wrench, label: 'Xizmat', color: COLORS.cyan },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Mashina topilmadi</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Orqaga</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
          <Text style={styles.vehicleInfo}>{vehicle.brand} {vehicle.model || ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'income') setModalType('income');
            else if (activeTab === 'fuel') setModalType('fuel');
            else if (activeTab === 'oil') setModalType('oil');
            else if (activeTab === 'tires') setModalType('tire');
            else if (activeTab === 'services') setModalType('service');
          }}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && { backgroundColor: tab.color }]}
                onPress={() => setActiveTab(tab.id as TabId)}
              >
                <Icon size={16} color={isActive ? '#fff' : COLORS.textMuted} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );  
          })}
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {activeTab === 'summary' && <SummaryTab analytics={analytics} />}
        {activeTab === 'income' && <IncomeTab data={incomeData} onDelete={(id) => handleDelete('income', id)} />}
        {activeTab === 'fuel' && <FuelTab data={fuelData} vehicle={vehicle} onDelete={(id) => handleDelete('fuel', id)} />}
        {activeTab === 'oil' && <OilTab data={oilData} onDelete={(id) => handleDelete('oil', id)} />}
        {activeTab === 'tires' && <TiresTab data={tires} onDelete={(id) => handleDelete('tires', id)} />}
        {activeTab === 'services' && <ServicesTab data={services} onDelete={(id) => handleDelete('services', id)} />}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <AddModal
        visible={!!modalType}
        type={modalType}
        vehicleId={vehicleId}
        vehicle={vehicle}
        onClose={() => { setModalType(null); setEditItem(null); }}
        onSuccess={() => { setModalType(null); setEditItem(null); loadData(); }}
      />
    </SafeAreaView>
  );
}


// ==================== SUMMARY TAB ====================
function SummaryTab({ analytics }: { analytics: any }) {
  const summary = analytics?.summary || {};
  const expenseBreakdown = analytics?.expenseBreakdown || {};
  const alerts = analytics?.alerts || [];

  return (
    <View style={styles.tabContent}>
      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsBox}>
          <View style={styles.alertsHeader}>
            <Bell size={18} color={COLORS.warning} />
            <Text style={styles.alertsTitle}>Diqqat! ({alerts.length} ta)</Text>
          </View>
          {alerts.slice(0, 3).map((alert: any, i: number) => (
            <View key={i} style={[styles.alertItem, { borderLeftColor: alert.severity === 'danger' ? COLORS.danger : COLORS.warning }]}>
              <AlertTriangle size={14} color={alert.severity === 'danger' ? COLORS.danger : COLORS.warning} />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Main Stats */}
      <View style={[styles.profitCard, { backgroundColor: summary.isProfitable ? COLORS.successLight : COLORS.dangerLight }]}>
        <View style={styles.profitHeader}>
          <View style={[styles.profitIcon, { backgroundColor: summary.isProfitable ? COLORS.success : COLORS.danger }]}>
            {summary.isProfitable ? <TrendingUp size={24} color="#fff" /> : <TrendingDown size={24} color="#fff" />}
          </View>
          <View>
            <Text style={styles.profitLabel}>Sof foyda/zarar (30 kun)</Text>
            <Text style={[styles.profitValue, { color: summary.isProfitable ? COLORS.success : COLORS.danger }]}>
              {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
            </Text>
          </View>
        </View>
        <View style={styles.profitStats}>
          <View style={styles.profitStatItem}>
            <ArrowUpRight size={16} color={COLORS.success} />
            <View>
              <Text style={styles.profitStatLabel}>Daromad</Text>
              <Text style={styles.profitStatValue}>{fmt(summary.totalIncome || 0)}</Text>
            </View>
          </View>
          <View style={styles.profitStatItem}>
            <ArrowDownRight size={16} color={COLORS.danger} />
            <View>
              <Text style={styles.profitStatLabel}>Xarajat</Text>
              <Text style={styles.profitStatValue}>{fmt(summary.totalExpenses || 0)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Expense Breakdown */}
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <View style={[styles.breakdownIcon, { backgroundColor: COLORS.infoLight }]}>
            <PieChart size={18} color={COLORS.info} />
          </View>
          <Text style={styles.breakdownTitle}>Xarajat taqsimoti</Text>
        </View>
        <ExpenseBar label="Yoqilg'i" data={expenseBreakdown.fuel} color={COLORS.info} />
        <ExpenseBar label="Moy" data={expenseBreakdown.oil} color={COLORS.warning} />
        <ExpenseBar label="Shinalar" data={expenseBreakdown.tires} color={COLORS.violet} />
        <ExpenseBar label="Xizmat" data={expenseBreakdown.service} color={COLORS.success} />
      </View>
    </View>
  );
}

function ExpenseBar({ label, data, color }: { label: string; data: any; color: string }) {
  const amount = data?.amount || 0;
  const percent = data?.percent || 0;
  return (
    <View style={styles.expenseBar}>
      <View style={styles.expenseBarHeader}>
        <Text style={styles.expenseBarLabel}>{label}</Text>
        <Text style={styles.expenseBarValue}>{fmt(amount)} ({percent}%)</Text>
      </View>
      <View style={styles.expenseBarTrack}>
        <View style={[styles.expenseBarFill, { width: `${Math.max(percent, 2)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ==================== INCOME TAB ====================
function IncomeTab({ data, onDelete }: { data: any; onDelete: (id: string) => void }) {
  const { incomes = [], stats = {} } = data;
  const INCOME_TYPES: any = {
    trip: { label: 'Marshrut', icon: Truck, color: COLORS.info },
    rental: { label: 'Ijara', icon: Gift, color: COLORS.violet },
    other: { label: 'Boshqa', icon: DollarSign, color: COLORS.warning },
  };

  return (
    <View style={styles.tabContent}>
      <View style={[styles.statCard, { backgroundColor: COLORS.successLight }]}>
        <View style={[styles.statIcon, { backgroundColor: COLORS.success }]}>
          <DollarSign size={18} color="#fff" />
        </View>
        <Text style={[styles.statValue, { color: COLORS.success }]}>{fmt(stats.totalIncome || 0)}</Text>
        <Text style={styles.statLabel}>Jami daromad</Text>
      </View>

      {incomes.length === 0 ? (
        <EmptyState icon={TrendingUp} text="Daromad yo'q" />
      ) : (
        incomes.map((item: any) => {
          const config = INCOME_TYPES[item.type] || INCOME_TYPES.other;
          const Icon = config.icon;
          return (
            <TouchableOpacity key={item._id} style={styles.listItem} onLongPress={() => onDelete(item._id)}>
              <View style={[styles.listItemIcon, { backgroundColor: config.color + '20' }]}>
                <Icon size={18} color={config.color} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{config.label}</Text>
                <Text style={styles.listItemDate}>{fmtDate(item.date)}</Text>
              </View>
              <Text style={[styles.listItemAmount, { color: COLORS.success }]}>+{fmt(item.amount)}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

// ==================== FUEL TAB ====================
function FuelTab({ data, vehicle, onDelete }: { data: any; vehicle: any; onDelete: (id: string) => void }) {
  const { refills = [], stats = {} } = data;
  const fuelType = vehicle?.fuelType?.toLowerCase() || '';
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan';
  const unit = isGas ? 'kub' : 'litr';

  return (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.successLight, flex: 1 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success }]}>
            <DollarSign size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{fmt(stats.totalCost || 0)}</Text>
          <Text style={styles.statLabel}>Jami xarajat</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.infoLight, flex: 1 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.info }]}>
            <Fuel size={16} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: COLORS.info }]}>{fmt(stats.totalLiters || 0)}</Text>
          <Text style={styles.statLabel}>Jami {unit}</Text>
        </View>
      </View>

      {refills.length === 0 ? (
        <EmptyState icon={Fuel} text="Yoqilg'i ma'lumotlari yo'q" />
      ) : (
        refills.map((item: any) => (
          <TouchableOpacity key={item._id} style={styles.listItem} onLongPress={() => onDelete(item._id)}>
            <View style={[styles.listItemIcon, { backgroundColor: COLORS.infoLight }]}>
              <Fuel size={18} color={COLORS.info} />
            </View>
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemTitle}>{item.liters} {unit}</Text>
              <Text style={styles.listItemDate}>{fmtDate(item.date)}</Text>
            </View>
            <Text style={[styles.listItemAmount, { color: COLORS.danger }]}>-{fmt(item.cost)}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}


// ==================== OIL TAB ====================
function OilTab({ data, onDelete }: { data: any; onDelete: (id: string) => void }) {
  const { changes = [], status, remainingKm } = data;
  const statusConfig: any = {
    ok: { label: 'Yaxshi', color: COLORS.success, bg: COLORS.successLight },
    approaching: { label: 'Yaqin', color: COLORS.warning, bg: COLORS.warningLight },
    overdue: { label: "O'tgan", color: COLORS.danger, bg: COLORS.dangerLight },
  };
  const s = statusConfig[status] || statusConfig.ok;

  return (
    <View style={styles.tabContent}>
      <View style={[styles.statCard, { backgroundColor: s.bg }]}>
        <View style={[styles.statIcon, { backgroundColor: s.color }]}>
          <Droplets size={18} color="#fff" />
        </View>
        <Text style={[styles.statValue, { color: s.color }]}>{s.label}</Text>
        <Text style={styles.statLabel}>{fmt(remainingKm)} km qoldi</Text>
      </View>

      {changes.length === 0 ? (
        <EmptyState icon={Droplets} text="Moy almashtirish tarixi yo'q" />
      ) : (
        changes.map((item: any) => (
          <TouchableOpacity key={item._id} style={styles.listItem} onLongPress={() => onDelete(item._id)}>
            <View style={[styles.listItemIcon, { backgroundColor: COLORS.warningLight }]}>
              <Droplets size={18} color={COLORS.warning} />
            </View>
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemTitle}>{item.oilBrand || item.oilType || 'Moy'}</Text>
              <Text style={styles.listItemDate}>{fmtDate(item.date)} • {fmt(item.odometer)} km</Text>
            </View>
            <Text style={[styles.listItemAmount, { color: COLORS.danger }]}>-{fmt(item.cost)}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ==================== TIRES TAB ====================
function TiresTab({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  const TIRE_STATUS: any = {
    new: { label: 'Yangi', color: COLORS.success },
    used: { label: 'Ishlatilgan', color: COLORS.info },
    worn: { label: 'Eskirgan', color: COLORS.danger },
  };

  return (
    <View style={styles.tabContent}>
      <View style={[styles.statCard, { backgroundColor: COLORS.violetLight }]}>
        <View style={[styles.statIcon, { backgroundColor: COLORS.violet }]}>
          <CircleIcon size={18} color="#fff" />
        </View>
        <Text style={[styles.statValue, { color: COLORS.violet }]}>{data.length}</Text>
        <Text style={styles.statLabel}>Jami shinalar</Text>
      </View>

      {data.length === 0 ? (
        <EmptyState icon={CircleIcon} text="Shina ma'lumotlari yo'q" />
      ) : (
        data.map((item: any) => {
          const s = TIRE_STATUS[item.status] || TIRE_STATUS.used;
          return (
            <TouchableOpacity key={item._id} style={styles.listItem} onLongPress={() => onDelete(item._id)}>
              <View style={[styles.listItemIcon, { backgroundColor: COLORS.violetLight }]}>
                <CircleIcon size={18} color={COLORS.violet} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{item.position}</Text>
                <Text style={styles.listItemDate}>{item.brand} {item.size}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: s.color + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

// ==================== SERVICES TAB ====================
function ServicesTab({ data, onDelete }: { data: any; onDelete: (id: string) => void }) {
  const { services = [], stats = {} } = data;

  return (
    <View style={styles.tabContent}>
      <View style={[styles.statCard, { backgroundColor: COLORS.cyanLight }]}>
        <View style={[styles.statIcon, { backgroundColor: COLORS.cyan }]}>
          <Wrench size={18} color="#fff" />
        </View>
        <Text style={[styles.statValue, { color: COLORS.cyan }]}>{fmt(stats.totalCost || 0)}</Text>
        <Text style={styles.statLabel}>Jami xizmat xarajati</Text>
      </View>

      {services.length === 0 ? (
        <EmptyState icon={Wrench} text="Xizmat tarixi yo'q" />
      ) : (
        services.map((item: any) => (
          <TouchableOpacity key={item._id} style={styles.listItem} onLongPress={() => onDelete(item._id)}>
            <View style={[styles.listItemIcon, { backgroundColor: COLORS.cyanLight }]}>
              <Wrench size={18} color={COLORS.cyan} />
            </View>
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemTitle}>{item.type}</Text>
              <Text style={styles.listItemDate}>{fmtDate(item.date)} • {item.serviceName || ''}</Text>
            </View>
            <Text style={[styles.listItemAmount, { color: COLORS.danger }]}>-{fmt(item.cost)}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ==================== EMPTY STATE ====================
function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={32} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ==================== ADD MODAL ====================
function AddModal({ visible, type, vehicleId, vehicle, onClose, onSuccess }: {
  visible: boolean;
  type: string | null;
  vehicleId: string;
  vehicle: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (visible) {
      const odo = vehicle?.currentOdometer?.toString() || '';
      if (type === 'income') setForm({ type: 'trip', date: today(), amount: '', fromCity: '', toCity: '' });
      else if (type === 'fuel') setForm({ date: today(), liters: '', cost: '', odometer: odo, fuelType: vehicle?.fuelType || 'diesel' });
      else if (type === 'oil') setForm({ date: today(), oilType: '', cost: '', odometer: odo });
      else if (type === 'tire') setForm({ position: 'Old chap', brand: '', size: '', installOdometer: odo });
      else if (type === 'service') setForm({ type: 'TO-1', date: today(), cost: '', odometer: odo });
    }
  }, [visible, type, vehicle]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'tire' ? 'tires' : type === 'service' ? 'services' : type;
      await api.post(`/maintenance/vehicles/${vehicleId}/${endpoint}`, form);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Xatolik', err.response?.data?.message || 'Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const titles: any = {
    income: 'Daromad qo\'shish',
    fuel: 'Yoqilg\'i qo\'shish',
    oil: 'Moy almashtirish',
    tire: 'Shina qo\'shish',
    service: 'Xizmat qo\'shish',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{titles[type || ''] || 'Qo\'shish'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {type === 'income' && <IncomeForm form={form} setForm={setForm} />}
            {type === 'fuel' && <FuelForm form={form} setForm={setForm} vehicle={vehicle} />}
            {type === 'oil' && <OilForm form={form} setForm={setForm} />}
            {type === 'tire' && <TireForm form={form} setForm={setForm} />}
            {type === 'service' && <ServiceForm form={form} setForm={setForm} />}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Saqlash</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


// ==================== FORMS ====================
function IncomeForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const types = [
    { value: 'trip', label: 'Marshrut' },
    { value: 'rental', label: 'Ijara' },
    { value: 'other', label: 'Boshqa' },
  ];
  return (
    <View>
      <Text style={styles.inputLabel}>Turi</Text>
      <View style={styles.typeButtons}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.typeButton, form.type === t.value && styles.typeButtonActive]}
            onPress={() => setForm({ ...form, type: t.value })}
          >
            <Text style={[styles.typeButtonText, form.type === t.value && styles.typeButtonTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormInput label="Sana" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
      <FormInput label="Summa" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" />
      {form.type === 'trip' && (
        <>
          <FormInput label="Qayerdan" value={form.fromCity} onChangeText={(v) => setForm({ ...form, fromCity: v })} />
          <FormInput label="Qayerga" value={form.toCity} onChangeText={(v) => setForm({ ...form, toCity: v })} />
        </>
      )}
    </View>
  );
}

function FuelForm({ form, setForm, vehicle }: { form: any; setForm: (f: any) => void; vehicle: any }) {
  const fuelType = vehicle?.fuelType?.toLowerCase() || '';
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan';
  const unit = isGas ? 'kub' : 'litr';
  return (
    <View>
      <FormInput label="Sana" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
      <FormInput label={`Miqdor (${unit})`} value={form.liters} onChangeText={(v) => setForm({ ...form, liters: v })} keyboardType="numeric" />
      <FormInput label="Narx (so'm)" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} keyboardType="numeric" />
      <FormInput label="Spidometr (km)" value={form.odometer} onChangeText={(v) => setForm({ ...form, odometer: v })} keyboardType="numeric" />
    </View>
  );
}

function OilForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <View>
      <FormInput label="Sana" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
      <FormInput label="Moy turi" value={form.oilType} onChangeText={(v) => setForm({ ...form, oilType: v })} placeholder="5W-40" />
      <FormInput label="Narx (so'm)" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} keyboardType="numeric" />
      <FormInput label="Spidometr (km)" value={form.odometer} onChangeText={(v) => setForm({ ...form, odometer: v })} keyboardType="numeric" />
    </View>
  );
}

function TireForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const positions = ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng'];
  return (
    <View>
      <Text style={styles.inputLabel}>Pozitsiya</Text>
      <View style={styles.typeButtons}>
        {positions.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.typeButton, form.position === p && styles.typeButtonActive]}
            onPress={() => setForm({ ...form, position: p })}
          >
            <Text style={[styles.typeButtonText, form.position === p && styles.typeButtonTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormInput label="Brend" value={form.brand} onChangeText={(v) => setForm({ ...form, brand: v })} placeholder="Michelin" />
      <FormInput label="O'lcham" value={form.size} onChangeText={(v) => setForm({ ...form, size: v })} placeholder="315/80 R22.5" />
      <FormInput label="Narx (so'm)" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} keyboardType="numeric" />
    </View>
  );
}

function ServiceForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const types = ['TO-1', 'TO-2', 'Tormoz', 'Dvigatel', 'Boshqa'];
  return (
    <View>
      <Text style={styles.inputLabel}>Xizmat turi</Text>
      <View style={styles.typeButtons}>
        {types.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeButton, form.type === t && styles.typeButtonActive]}
            onPress={() => setForm({ ...form, type: t })}
          >
            <Text style={[styles.typeButtonText, form.type === t && styles.typeButtonTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormInput label="Sana" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
      <FormInput label="Narx (so'm)" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} keyboardType="numeric" />
      <FormInput label="Spidometr (km)" value={form.odometer} onChangeText={(v) => setForm({ ...form, odometer: v })} keyboardType="numeric" />
    </View>
  );
}

function FormInput({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}
  

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  plateNumber: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  vehicleInfo: { fontSize: 13, color: COLORS.textSecondary },
  addButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  tabsContainer: { backgroundColor: '#fff', maxHeight: 56 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },

  content: { flex: 1 },
  tabContent: { padding: 16 },

  // Alerts
  alertsBox: { backgroundColor: COLORS.warningLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#fcd34d' },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertsTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: 12, marginBottom: 6, borderLeftWidth: 3 },
  alertText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },

  // Profit Card
  profitCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  profitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  profitIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  profitLabel: { fontSize: 12, color: COLORS.textSecondary },
  profitValue: { fontSize: 22, fontWeight: '700' },
  profitStats: { flexDirection: 'row', gap: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  profitStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  profitStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  profitStatValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  // Breakdown Card
  breakdownCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  breakdownIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // Expense Bar
  expenseBar: { marginBottom: 12 },
  expenseBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  expenseBarLabel: { fontSize: 13, color: COLORS.textSecondary },
  expenseBarValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  expenseBarTrack: { height: 8, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' },
  expenseBarFill: { height: '100%', borderRadius: 4 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { borderRadius: 14, padding: 14, marginBottom: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // List Items
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  listItemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listItemInfo: { flex: 1, marginLeft: 12 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  listItemDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  listItemAmount: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { padding: 20 },
  submitButton: { margin: 20, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Forms
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  typeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  typeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  typeButtonTextActive: { color: '#fff' },
});
