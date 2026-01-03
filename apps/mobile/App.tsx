import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Simple Icon component using emoji/text
const ICONS: Record<string, string> = {
  'home': '🏠',
  'truck': '🚛',
  'bar-chart-2': '📊',
  'alert-triangle': '⚠️',
  'plus': '+',
  'x': '✕',
  'chevron-right': '›',
  'arrow-left': '←',
  'dollar-sign': '💰',
  'trending-up': '📈',
  'trending-down': '📉',
  'droplet': '⛽',
  'tool': '🔧',
  'activity': '📍',
  'search': '🔍',
  'bell': '🔔',
  'users': '👥',
  'navigation': '🧭',
  'check-circle': '✅',
  'alert-circle': '⚡',
  'award': '🏆',
  'filter': '🔲',
  'circle': '⭕',
  'disc': '💿',
  'mic': '🎤',
};

function Icon({ name, size = 20, color = '#000' }: { name: string; size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size * 0.8, color, textAlign: 'center' }}>
      {ICONS[name] || '•'}
    </Text>
  );
}

const API_URL = 'https://avtojon.uz/api';
const { width } = Dimensions.get('window');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Constants
const FUEL: Record<string, string> = { petrol: 'Benzin', diesel: 'Dizel', gas: 'Gaz', metan: 'Metan' };
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  excellent: { label: "A'lo", color: '#10b981' },
  normal: { label: 'Yaxshi', color: '#3b82f6' },
  attention: { label: 'Diqqat', color: '#f59e0b' },
  critical: { label: 'Kritik', color: '#ef4444' },
};

// Format number
const fmt = (n: number) => {
  const abs = Math.abs(n || 0);
  if (abs >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('uz-UZ').format(n || 0);
};

// ==================== LOGIN SCREEN ====================
function LoginScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Xatolik', 'Username va parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username: username.trim(), password });
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        if (accessToken) {
          await AsyncStorage.setItem('token', accessToken);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          onLogin(accessToken, user);
        } else {
          Alert.alert('Xatolik', 'Token olinmadi');
        }
      } else {
        Alert.alert('Xatolik', response.data.message || 'Kirish xatosi');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Server bilan bog\'lanishda xatolik';
      Alert.alert('Xatolik', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.loginContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.logoContainer}>
        <Image source={require('./src/assets/logo.jpg')} style={styles.logo} />
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>avto</Text>
          <Text style={styles.titleYellow}>JON</Text>
        </View>
        <Text style={styles.subtitle}>Fleet Management Pro</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.welcomeText}>Xush kelibsiz!</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Parol</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Kirish</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ==================== VEHICLE CARD ====================
function VehicleCard({ vehicle, onPress }: { vehicle: any; onPress: () => void }) {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal;
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical';

  return (
    <TouchableOpacity style={[styles.vehicleCard, isWarning && styles.vehicleCardWarning]} onPress={onPress}>
      <View style={[styles.vehicleIcon, isWarning && { backgroundColor: status.color + '20' }]}>
        <Icon name="truck" size={22} color={isWarning ? status.color : '#4f46e5'} />
      </View>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.vehicleBrand}>{vehicle.brand} {vehicle.year ? `• ${vehicle.year}` : ''}</Text>
        <View style={styles.vehicleStats}>
          <View style={styles.vehicleStat}>
            <Icon name="activity" size={12} color="#94a3b8" />
            <Text style={styles.vehicleStatText}>{fmt(vehicle.currentOdometer || 0)} km</Text>
          </View>
          <View style={styles.vehicleStat}>
            <Icon name="droplet" size={12} color="#94a3b8" />
            <Text style={styles.vehicleStatText}>{FUEL[vehicle.fuelType] || '-'}</Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}

// ==================== STAT CARD ====================
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color + '10', borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={16} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ==================== ADD VEHICLE MODAL ====================
function AddVehicleModal({ visible, onClose, onAdd, token }: { visible: boolean; onClose: () => void; onAdd: () => void; token: string }) {
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'diesel',
    currentOdometer: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.plateNumber || !form.brand) {
      Alert.alert('Xatolik', 'Raqam va marka majburiy');
      return;
    }

    setLoading(true);
    try {
      await api.post('/vehicles', {
        plateNumber: form.plateNumber,
        brand: form.brand,
        year: parseInt(form.year) || new Date().getFullYear(),
        fuelType: form.fuelType,
        currentOdometer: parseFloat(form.currentOdometer) || 0,
        status: 'normal',
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert('Muvaffaqiyat', 'Mashina qo\'shildi');
      setForm({ plateNumber: '', brand: '', year: new Date().getFullYear().toString(), fuelType: 'diesel', currentOdometer: '' });
      onAdd();
      onClose();
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Mashina qo\'shishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mashina qo'shish</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Davlat raqami *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="01 A 123 BC"
              value={form.plateNumber}
              onChangeText={(v) => setForm({ ...form, plateNumber: v })}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Marka *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="MAN, Volvo, Mercedes..."
              value={form.brand}
              onChangeText={(v) => setForm({ ...form, brand: v })}
            />

            <Text style={styles.inputLabel}>Yil</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2020"
              value={form.year}
              onChangeText={(v) => setForm({ ...form, year: v })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Yoqilg'i turi</Text>
            <View style={styles.fuelTypes}>
              {Object.entries(FUEL).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.fuelType, form.fuelType === key && styles.fuelTypeActive]}
                  onPress={() => setForm({ ...form, fuelType: key })}
                >
                  <Text style={[styles.fuelTypeText, form.fuelType === key && styles.fuelTypeTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Spidometr (km)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              value={form.currentOdometer}
              onChangeText={(v) => setForm({ ...form, currentOdometer: v })}
              keyboardType="numeric"
            />
          </ScrollView>

          <TouchableOpacity style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Qo'shish</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


// ==================== VEHICLE DETAIL SCREEN ====================
function VehicleDetailScreen({ vehicle, token, onBack, onUpdate }: { vehicle: any; token: string; onBack: () => void; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get(`/maintenance/vehicle/${vehicle._id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal;

  const tabs = [
    { id: 'summary', label: 'Umumiy', icon: 'home' },
    { id: 'fuel', label: 'Yoqilg\'i', icon: 'droplet' },
    { id: 'service', label: 'Xizmat', icon: 'tool' },
    { id: 'income', label: 'Daromad', icon: 'dollar-sign' },
  ];

  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.detailHeaderInfo}>
          <Text style={styles.detailPlate}>{vehicle.plateNumber}</Text>
          <Text style={styles.detailBrand}>{vehicle.brand} {vehicle.year ? `(${vehicle.year})` : ''}</Text>
        </View>
        <View style={[styles.detailStatus, { backgroundColor: status.color + '30' }]}>
          <Text style={[styles.detailStatusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size={16} color={activeTab === tab.id ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.detailContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : activeTab === 'summary' ? (
          <SummaryTab vehicle={vehicle} analytics={analytics} />
        ) : activeTab === 'fuel' ? (
          <FuelTab vehicle={vehicle} token={token} onUpdate={onUpdate} />
        ) : activeTab === 'service' ? (
          <ServiceTab vehicle={vehicle} token={token} onUpdate={onUpdate} />
        ) : (
          <IncomeTab vehicle={vehicle} token={token} onUpdate={onUpdate} />
        )}
      </ScrollView>
    </View>
  );
}

// Summary Tab
function SummaryTab({ vehicle, analytics }: { vehicle: any; analytics: any }) {
  const totalIncome = analytics?.summary?.totalIncome || 0;
  const totalExpenses = analytics?.summary?.totalExpenses || 0;
  const netProfit = totalIncome - totalExpenses;

  return (
    <View style={styles.tabContent}>
      {/* Stats */}
      <View style={styles.summaryStats}>
        <View style={[styles.summaryStatCard, { backgroundColor: '#10b98110' }]}>
          <Icon name="trending-up" size={20} color="#10b981" />
          <Text style={[styles.summaryStatValue, { color: '#10b981' }]}>{fmt(totalIncome)}</Text>
          <Text style={styles.summaryStatLabel}>Daromad</Text>
        </View>
        <View style={[styles.summaryStatCard, { backgroundColor: '#ef444410' }]}>
          <Icon name="trending-down" size={20} color="#ef4444" />
          <Text style={[styles.summaryStatValue, { color: '#ef4444' }]}>{fmt(totalExpenses)}</Text>
          <Text style={styles.summaryStatLabel}>Xarajat</Text>
        </View>
        <View style={[styles.summaryStatCard, { backgroundColor: netProfit >= 0 ? '#10b98110' : '#ef444410' }]}>
          <Icon name="dollar-sign" size={20} color={netProfit >= 0 ? '#10b981' : '#ef4444'} />
          <Text style={[styles.summaryStatValue, { color: netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
            {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
          </Text>
          <Text style={styles.summaryStatLabel}>Foyda</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Mashina ma'lumotlari</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Spidometr</Text>
          <Text style={styles.infoValue}>{fmt(vehicle.currentOdometer || 0)} km</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Yoqilg'i turi</Text>
          <Text style={styles.infoValue}>{FUEL[vehicle.fuelType] || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bak sig'imi</Text>
          <Text style={styles.infoValue}>{vehicle.fuelTankCapacity || '-'} L</Text>
        </View>
      </View>
    </View>
  );
}


// Fuel Tab
function FuelTab({ vehicle, token, onUpdate }: { vehicle: any; token: string; onUpdate: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ liters: '', pricePerLiter: '', odometer: '', station: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    try {
      const { data } = await api.get(`/maintenance/vehicle/${vehicle._id}/fuel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.liters || !form.pricePerLiter) {
      Alert.alert('Xatolik', 'Litr va narxni kiriting');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/maintenance/vehicle/${vehicle._id}/fuel`, {
        liters: parseFloat(form.liters),
        pricePerLiter: parseFloat(form.pricePerLiter),
        totalCost: parseFloat(form.liters) * parseFloat(form.pricePerLiter),
        odometer: parseFloat(form.odometer) || vehicle.currentOdometer,
        station: form.station,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ liters: '', pricePerLiter: '', odometer: '', station: '' });
      setShowAdd(false);
      loadRecords();
      onUpdate();
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addRecordButton} onPress={() => setShowAdd(!showAdd)}>
        <Icon name={showAdd ? 'x' : 'plus'} size={18} color="#fff" />
        <Text style={styles.addRecordText}>{showAdd ? 'Bekor qilish' : 'Yoqilg\'i qo\'shish'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Litr *</Text>
              <TextInput style={styles.formInput} placeholder="50" value={form.liters} onChangeText={(v) => setForm({ ...form, liters: v })} keyboardType="numeric" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Narx/L *</Text>
              <TextInput style={styles.formInput} placeholder="12500" value={form.pricePerLiter} onChangeText={(v) => setForm({ ...form, pricePerLiter: v })} keyboardType="numeric" />
            </View>
          </View>
          <Text style={styles.formLabel}>Spidometr</Text>
          <TextInput style={styles.formInput} placeholder={`${vehicle.currentOdometer || 0}`} value={form.odometer} onChangeText={(v) => setForm({ ...form, odometer: v })} keyboardType="numeric" />
          <Text style={styles.formLabel}>Zapravka</Text>
          <TextInput style={styles.formInput} placeholder="Zapravka nomi" value={form.station} onChangeText={(v) => setForm({ ...form, station: v })} />
          <TouchableOpacity style={[styles.submitButton, submitting && styles.buttonDisabled]} onPress={handleAdd} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Saqlash</Text>}
          </TouchableOpacity>
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="droplet" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Yoqilg'i yozuvlari yo'q</Text>
        </View>
      ) : (
        records.map((r, i) => (
          <View key={i} style={styles.recordCard}>
            <View style={styles.recordIcon}>
              <Icon name="droplet" size={18} color="#f59e0b" />
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>{r.liters} L • {fmt(r.pricePerLiter)} so'm/L</Text>
              <Text style={styles.recordSubtitle}>{r.station || 'Noma\'lum'} • {new Date(r.date).toLocaleDateString('uz-UZ')}</Text>
            </View>
            <Text style={styles.recordAmount}>-{fmt(r.totalCost)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// Service Tab
function ServiceTab({ vehicle, token, onUpdate }: { vehicle: any; token: string; onUpdate: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'oil', description: '', cost: '', odometer: '' });
  const [submitting, setSubmitting] = useState(false);

  const serviceTypes = [
    { id: 'oil', label: 'Moy', icon: 'droplet' },
    { id: 'tire', label: 'Shina', icon: 'circle' },
    { id: 'brake', label: 'Tormoz', icon: 'disc' },
    { id: 'filter', label: 'Filtr', icon: 'filter' },
    { id: 'other', label: 'Boshqa', icon: 'tool' },
  ];

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    try {
      const { data } = await api.get(`/maintenance/vehicle/${vehicle._id}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.cost) {
      Alert.alert('Xatolik', 'Narxni kiriting');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/maintenance/vehicle/${vehicle._id}/services`, {
        type: form.type,
        description: form.description,
        cost: parseFloat(form.cost),
        odometer: parseFloat(form.odometer) || vehicle.currentOdometer,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ type: 'oil', description: '', cost: '', odometer: '' });
      setShowAdd(false);
      loadRecords();
      onUpdate();
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addRecordButton} onPress={() => setShowAdd(!showAdd)}>
        <Icon name={showAdd ? 'x' : 'plus'} size={18} color="#fff" />
        <Text style={styles.addRecordText}>{showAdd ? 'Bekor qilish' : 'Xizmat qo\'shish'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>Xizmat turi</Text>
          <View style={styles.serviceTypes}>
            {serviceTypes.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.serviceType, form.type === t.id && styles.serviceTypeActive]} onPress={() => setForm({ ...form, type: t.id })}>
                <Icon name={t.icon} size={16} color={form.type === t.id ? '#fff' : '#64748b'} />
                <Text style={[styles.serviceTypeText, form.type === t.id && styles.serviceTypeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.formLabel}>Tavsif</Text>
          <TextInput style={styles.formInput} placeholder="Xizmat tavsifi" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
          <Text style={styles.formLabel}>Narx *</Text>
          <TextInput style={styles.formInput} placeholder="500000" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} keyboardType="numeric" />
          <TouchableOpacity style={[styles.submitButton, submitting && styles.buttonDisabled]} onPress={handleAdd} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Saqlash</Text>}
          </TouchableOpacity>
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="tool" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Xizmat yozuvlari yo'q</Text>
        </View>
      ) : (
        records.map((r, i) => (
          <View key={i} style={styles.recordCard}>
            <View style={[styles.recordIcon, { backgroundColor: '#8b5cf620' }]}>
              <Icon name="tool" size={18} color="#8b5cf6" />
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>{r.description || r.type}</Text>
              <Text style={styles.recordSubtitle}>{new Date(r.date).toLocaleDateString('uz-UZ')}</Text>
            </View>
            <Text style={styles.recordAmount}>-{fmt(r.cost)}</Text>
          </View>
        ))
      )}
    </View>
  );
}


// Income Tab
function IncomeTab({ vehicle, token, onUpdate }: { vehicle: any; token: string; onUpdate: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', client: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    try {
      const { data } = await api.get(`/maintenance/vehicle/${vehicle._id}/income`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.amount) {
      Alert.alert('Xatolik', 'Summani kiriting');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/maintenance/vehicle/${vehicle._id}/income`, {
        amount: parseFloat(form.amount),
        description: form.description,
        client: form.client,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ amount: '', description: '', client: '' });
      setShowAdd(false);
      loadRecords();
      onUpdate();
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={[styles.addRecordButton, { backgroundColor: '#10b981' }]} onPress={() => setShowAdd(!showAdd)}>
        <Icon name={showAdd ? 'x' : 'plus'} size={18} color="#fff" />
        <Text style={styles.addRecordText}>{showAdd ? 'Bekor qilish' : 'Daromad qo\'shish'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>Summa *</Text>
          <TextInput style={styles.formInput} placeholder="5000000" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" />
          <Text style={styles.formLabel}>Tavsif</Text>
          <TextInput style={styles.formInput} placeholder="Yuk tashish" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
          <Text style={styles.formLabel}>Mijoz</Text>
          <TextInput style={styles.formInput} placeholder="Mijoz nomi" value={form.client} onChangeText={(v) => setForm({ ...form, client: v })} />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#10b981' }, submitting && styles.buttonDisabled]} onPress={handleAdd} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Saqlash</Text>}
          </TouchableOpacity>
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="dollar-sign" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Daromad yozuvlari yo'q</Text>
        </View>
      ) : (
        records.map((r, i) => (
          <View key={i} style={styles.recordCard}>
            <View style={[styles.recordIcon, { backgroundColor: '#10b98120' }]}>
              <Icon name="dollar-sign" size={18} color="#10b981" />
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>{r.description || 'Daromad'}</Text>
              <Text style={styles.recordSubtitle}>{r.client || 'Noma\'lum'} • {new Date(r.date).toLocaleDateString('uz-UZ')}</Text>
            </View>
            <Text style={[styles.recordAmount, { color: '#10b981' }]}>+{fmt(r.amount)}</Text>
          </View>
        ))
      )}
    </View>
  );
}


// ==================== FLEET PANEL (Main) ====================
function FleetPanel({ user, token, onLogout }: { user: any; token: string; onLogout: () => void }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [fleetAnalytics, setFleetAnalytics] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [vehiclesRes, analyticsRes] = await Promise.all([
        api.get('/vehicles', { headers }),
        api.get('/maintenance/fleet/analytics', { headers }).catch(() => ({ data: { data: null } })),
      ]);
      setVehicles(vehiclesRes.data.data || []);
      setFleetAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filteredVehicles = vehicles.filter(v =>
    v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: vehicles.length,
    excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
    attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length,
  };

  const totalIncome = fleetAnalytics?.summary?.totalIncome || 0;
  const totalExpenses = fleetAnalytics?.summary?.totalExpenses || 0;
  const netProfit = fleetAnalytics?.summary?.netProfit || 0;
  const alertsCount = fleetAnalytics?.alertsCount || 0;

  if (selectedVehicle) {
    return (
      <VehicleDetailScreen
        vehicle={selectedVehicle}
        token={token}
        onBack={() => setSelectedVehicle(null)}
        onUpdate={loadData}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('./src/assets/logo.jpg')} style={styles.headerLogo} />
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitleWhite}>avto</Text>
              <Text style={styles.headerTitleYellow}>JON</Text>
            </View>
            <Text style={styles.headerSubtitle}>{stats.total} ta mashina</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on tab */}
      {activeTab === 'home' && (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard icon="dollar-sign" label="Daromad" value={fmt(totalIncome)} color="#10b981" />
            <StatCard icon="trending-down" label="Xarajat" value={fmt(totalExpenses)} color="#ef4444" />
            <StatCard icon="trending-up" label="Foyda" value={`${netProfit >= 0 ? '+' : ''}${fmt(netProfit)}`} color={netProfit >= 0 ? '#10b981' : '#ef4444'} />
            <StatCard icon="alert-triangle" label="Diqqat" value={alertsCount} color="#f59e0b" />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Mashina qidirish..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="x" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Vehicles */}
          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
          ) : filteredVehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="truck" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>{search ? 'Natija topilmadi' : 'Avtopark bo\'sh'}</Text>
              <Text style={styles.emptyText}>{search ? 'Boshqa so\'rov bilan urinib ko\'ring' : 'Birinchi mashinangizni qo\'shing'}</Text>
              {!search && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={styles.emptyButtonText}>Mashina qo'shish</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredVehicles.map((v) => (
              <VehicleCard key={v._id} vehicle={v} onPress={() => setSelectedVehicle(v)} />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'stats' && <StatsScreen vehicles={vehicles} token={token} />}
      {activeTab === 'service' && <ServiceScreen vehicles={vehicles} token={token} onVehiclePress={setSelectedVehicle} />}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <View style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>
            <Icon name="home" size={20} color={activeTab === 'home' ? '#fff' : '#64748b'} />
          </View>
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Avtopark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('stats')}>
          <View style={[styles.navIcon, activeTab === 'stats' && styles.navIconActive]}>
            <Icon name="bar-chart-2" size={20} color={activeTab === 'stats' ? '#fff' : '#64748b'} />
          </View>
          <Text style={[styles.navLabel, activeTab === 'stats' && styles.navLabelActive]}>Statistika</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setShowAddModal(true)}>
          <View style={[styles.navIcon, styles.navIconAdd]}>
            <Icon name="plus" size={22} color="#fff" />
          </View>
          <Text style={styles.navLabel}>Qo'shish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('service')}>
          <View style={[styles.navIcon, activeTab === 'service' && styles.navIconActive]}>
            <Icon name="alert-triangle" size={20} color={activeTab === 'service' ? '#fff' : '#64748b'} />
          </View>
          <Text style={[styles.navLabel, activeTab === 'service' && styles.navLabelActive]}>Diqqat</Text>
          {stats.attention > 0 && <View style={styles.navBadge}><Text style={styles.navBadgeText}>{stats.attention}</Text></View>}
        </TouchableOpacity>
      </View>

      <AddVehicleModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={loadData} token={token} />
    </View>
  );
}


// Stats Screen
function StatsScreen({ vehicles, token }: { vehicles: any[]; token: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/maintenance/fleet/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1, marginTop: 100 }} />;
  }

  const summary = analytics?.summary || {};
  const vehicleStats = analytics?.vehicleStats || [];

  return (
    <ScrollView style={styles.content}>
      <Text style={styles.screenTitle}>Moliyaviy tahlil</Text>

      {/* Summary */}
      <View style={styles.statsGrid}>
        <StatCard icon="dollar-sign" label="Daromad" value={fmt(summary.totalIncome || 0)} color="#10b981" />
        <StatCard icon="trending-down" label="Xarajat" value={fmt(summary.totalExpenses || 0)} color="#ef4444" />
        <StatCard icon="trending-up" label="Foyda" value={`${(summary.netProfit || 0) >= 0 ? '+' : ''}${fmt(summary.netProfit || 0)}`} color={(summary.netProfit || 0) >= 0 ? '#10b981' : '#ef4444'} />
        <StatCard icon="award" label="Foydali" value={`${summary.profitableCount || 0}/${summary.totalVehicles || 0}`} color="#f59e0b" />
      </View>

      {/* Vehicle Rankings */}
      <Text style={styles.sectionTitle}>Mashinalar reytingi</Text>
      {vehicleStats.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="bar-chart-2" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Ma'lumot yo'q</Text>
        </View>
      ) : (
        vehicleStats.map((v: any, i: number) => (
          <View key={v._id} style={styles.rankCard}>
            <View style={[styles.rankBadge, i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : i === 2 ? styles.rankBronze : styles.rankDefault]}>
              <Text style={styles.rankNumber}>{i + 1}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankPlate}>{v.plateNumber}</Text>
              <Text style={styles.rankBrand}>{v.brand}</Text>
            </View>
            <View style={styles.rankStats}>
              <Text style={[styles.rankProfit, { color: v.profit >= 0 ? '#10b981' : '#ef4444' }]}>
                {v.profit >= 0 ? '+' : ''}{fmt(v.profit)}
              </Text>
              <Text style={styles.rankLabel}>foyda</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Service/Alerts Screen
function ServiceScreen({ vehicles, token, onVehiclePress }: { vehicles: any[]; token: string; onVehiclePress: (v: any) => void }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const { data } = await api.get('/maintenance/fleet/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const attentionVehicles = vehicles.filter(v => v.status === 'attention' || v.status === 'critical');

  if (loading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1, marginTop: 100 }} />;
  }

  return (
    <ScrollView style={styles.content}>
      <Text style={styles.screenTitle}>Diqqat talab</Text>

      {/* Summary */}
      <View style={styles.alertSummary}>
        <View style={[styles.alertSummaryCard, { backgroundColor: '#ef444410' }]}>
          <Icon name="alert-triangle" size={20} color="#ef4444" />
          <Text style={[styles.alertSummaryValue, { color: '#ef4444' }]}>{vehicles.filter(v => v.status === 'critical').length}</Text>
          <Text style={styles.alertSummaryLabel}>Kritik</Text>
        </View>
        <View style={[styles.alertSummaryCard, { backgroundColor: '#f59e0b10' }]}>
          <Icon name="alert-circle" size={20} color="#f59e0b" />
          <Text style={[styles.alertSummaryValue, { color: '#f59e0b' }]}>{vehicles.filter(v => v.status === 'attention').length}</Text>
          <Text style={styles.alertSummaryLabel}>Diqqat</Text>
        </View>
        <View style={[styles.alertSummaryCard, { backgroundColor: '#10b98110' }]}>
          <Icon name="check-circle" size={20} color="#10b981" />
          <Text style={[styles.alertSummaryValue, { color: '#10b981' }]}>{vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length}</Text>
          <Text style={styles.alertSummaryLabel}>Yaxshi</Text>
        </View>
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Ogohlantirishlar</Text>
          {alerts.map((alert, i) => (
            <TouchableOpacity key={i} style={styles.alertCard} onPress={() => {
              const v = vehicles.find(veh => veh._id === alert.vehicleId);
              if (v) onVehiclePress(v);
            }}>
              <View style={[styles.alertIcon, { backgroundColor: alert.severity === 'danger' ? '#ef444420' : '#f59e0b20' }]}>
                <Icon name="alert-triangle" size={18} color={alert.severity === 'danger' ? '#ef4444' : '#f59e0b'} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertPlate}>{alert.plateNumber}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Attention Vehicles */}
      {attentionVehicles.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Xizmat kerak</Text>
          {attentionVehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} onPress={() => onVehiclePress(v)} />
          ))}
        </>
      )}

      {alerts.length === 0 && attentionVehicles.length === 0 && (
        <View style={styles.allGoodState}>
          <Icon name="check-circle" size={48} color="#10b981" />
          <Text style={styles.allGoodTitle}>Hammasi yaxshi!</Text>
          <Text style={styles.allGoodText}>Barcha mashinalar yaxshi holatda</Text>
        </View>
      )}
    </ScrollView>
  );
}


// ==================== BIZNESMEN PANEL ====================
function BusinessmanPanel({ user, token, onLogout }: { user: any; token: string; onLogout: () => void }) {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, flights: 0, income: 0, expense: 0 });
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
        api.get('/drivers', { headers }).catch(() => ({ data: { data: [] } })),
        api.get('/vehicles', { headers }).catch(() => ({ data: { data: [] } })),
        api.get('/flights', { headers }).catch(() => ({ data: { data: [] } })),
      ]);
      
      const flightsData = flightsRes.data.data || [];
      const totalIncome = flightsData.reduce((s: number, f: any) => s + (f.totalIncome || 0), 0);
      const totalExpense = flightsData.reduce((s: number, f: any) => s + (f.totalExpense || 0), 0);
      
      setStats({
        drivers: driversRes.data.data?.length || 0,
        vehicles: vehiclesRes.data.data?.length || 0,
        flights: flightsData.length,
        income: totalIncome,
        expense: totalExpense,
      });
      setFlights(flightsData.slice(0, 5));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Biznesmen Panel</Text>
          <Text style={styles.userName}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.statsGrid}>
          <StatCard icon="users" label="Haydovchilar" value={stats.drivers} color="#4f46e5" />
          <StatCard icon="truck" label="Mashinalar" value={stats.vehicles} color="#8b5cf6" />
          <StatCard icon="navigation" label="Reyslar" value={stats.flights} color="#10b981" />
          <StatCard icon="dollar-sign" label="Foyda" value={fmt(stats.income - stats.expense)} color="#f59e0b" />
        </View>

        <Text style={styles.sectionTitle}>So'nggi reyslar</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" />
        ) : flights.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="navigation" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Reyslar topilmadi</Text>
          </View>
        ) : (
          flights.map((flight) => (
            <View key={flight._id} style={styles.flightCard}>
              <View style={styles.flightHeader}>
                <Text style={styles.flightRoute}>{flight.fromCity} → {flight.toCity}</Text>
                <View style={[styles.flightStatus, { backgroundColor: flight.status === 'completed' ? '#dcfce7' : '#fef3c7' }]}>
                  <Text style={[styles.flightStatusText, { color: flight.status === 'completed' ? '#22c55e' : '#f59e0b' }]}>
                    {flight.status === 'completed' ? 'Tugadi' : 'Jarayonda'}
                  </Text>
                </View>
              </View>
              <Text style={styles.flightDriver}>🚛 {flight.driver?.fullName || 'Haydovchi'}</Text>
              <View style={styles.flightFooter}>
                <Text style={styles.flightIncome}>+{fmt(flight.totalIncome || 0)}</Text>
                <Text style={styles.flightExpense}>-{fmt(flight.totalExpense || 0)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ==================== DRIVER PANEL ====================
function DriverPanel({ user, token, onLogout }: { user: any; token: string; onLogout: () => void }) {
  const [activeFlight, setActiveFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadActiveFlight(); }, []);

  const loadActiveFlight = async () => {
    try {
      const response = await api.get('/driver-panel/active-flight', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveFlight(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadActiveFlight(); };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#1e293b' }]}>
        <View>
          <Text style={styles.greeting}>Haydovchi Panel</Text>
          <Text style={styles.userName}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : activeFlight ? (
          <View style={styles.activeFlightCard}>
            <View style={styles.activeFlightHeader}>
              <Text style={styles.activeFlightTitle}>Faol reys</Text>
              <View style={styles.activeFlightBadge}>
                <Text style={styles.activeFlightBadgeText}>Jarayonda</Text>
              </View>
            </View>
            <Text style={styles.activeFlightRoute}>{activeFlight.fromCity} → {activeFlight.toCity}</Text>
            <View style={styles.activeFlightStats}>
              <View style={styles.activeFlightStat}>
                <Text style={styles.activeFlightStatValue}>{fmt(activeFlight.totalIncome || 0)}</Text>
                <Text style={styles.activeFlightStatLabel}>Daromad</Text>
              </View>
              <View style={styles.activeFlightStat}>
                <Text style={[styles.activeFlightStatValue, { color: '#ef4444' }]}>{fmt(activeFlight.totalExpense || 0)}</Text>
                <Text style={styles.activeFlightStatLabel}>Xarajat</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noFlightCard}>
            <Icon name="truck" size={48} color="#cbd5e1" />
            <Text style={styles.noFlightTitle}>Faol reys yo'q</Text>
            <Text style={styles.noFlightText}>Sizga yangi reys tayinlanganda bu yerda ko'rinadi</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


// ==================== MAIN APP ====================
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (newToken: string, newUser: any) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // Splash screen
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('./src/assets/logo.jpg')} style={styles.splashLogo} />
        <View style={styles.titleRow}>
          <Text style={styles.splashTitleWhite}>avto</Text>
          <Text style={styles.splashTitleYellow}>JON</Text>
        </View>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 30 }} />
      </View>
    );
  }

  // Login screen
  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  // Determine which panel to show based on user role
  const renderPanel = () => {
    const role = user?.role;
    
    if (role === 'driver') {
      return <DriverPanel user={user} token={token} onLogout={handleLogout} />;
    }
    
    if (role === 'businessman') {
      return <BusinessmanPanel user={user} token={token} onLogout={handleLogout} />;
    }
    
    // Default - Fleet panel (user role)
    return <FleetPanel user={user} token={token} onLogout={handleLogout} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      {renderPanel()}
    </SafeAreaView>
  );
}


// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, padding: 16 },
  
  // Splash
  splashContainer: { flex: 1, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 100, height: 100, borderRadius: 24 },
  splashTitleWhite: { fontSize: 36, fontWeight: '800', color: '#fff' },
  splashTitleYellow: { fontSize: 36, fontWeight: '800', color: '#fbbf24' },
  
  // Login
  loginContainer: { flexGrow: 1, backgroundColor: '#f8fafc' },
  logoContainer: { backgroundColor: '#4f46e5', paddingTop: 60, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  titleWhite: { fontSize: 28, fontWeight: '800', color: '#fff' },
  titleYellow: { fontSize: 28, fontWeight: '800', color: '#fbbf24' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: 24 },
  welcomeText: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1e293b', marginBottom: 16 },
  loginButton: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
  
  // Header
  header: { backgroundColor: '#4f46e5', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogo: { width: 40, height: 40, borderRadius: 12 },
  headerTitleWhite: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerTitleYellow: { fontSize: 18, fontWeight: '800', color: '#fbbf24' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  statCard: { width: (width - 48) / 2, borderRadius: 16, padding: 14, borderWidth: 1 },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  
  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#1e293b' },
  
  // Vehicle Card
  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  vehicleCardWarning: { borderColor: '#fbbf24', borderWidth: 1.5 },
  vehicleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  vehicleInfo: { flex: 1 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  plateNumber: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  vehicleBrand: { fontSize: 12, color: '#64748b' },
  vehicleStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  vehicleStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleStatText: { fontSize: 11, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  
  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  
  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 20, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', position: 'relative' },
  navIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  navIconActive: { backgroundColor: '#4f46e5' },
  navIconAdd: { backgroundColor: '#8b5cf6' },
  navLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  navLabelActive: { color: '#4f46e5', fontWeight: '600' },
  navBadge: { position: 'absolute', top: 0, right: 20, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  fuelTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fuelType: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  fuelTypeActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  fuelTypeText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  fuelTypeTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  // Detail Screen
  detailContainer: { flex: 1, backgroundColor: '#f8fafc' },
  detailHeader: { backgroundColor: '#4f46e5', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailHeaderInfo: { flex: 1 },
  detailPlate: { fontSize: 20, fontWeight: '700', color: '#fff' },
  detailBrand: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  detailStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailStatusText: { fontSize: 12, fontWeight: '600' },
  tabsContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  detailContent: { flex: 1, padding: 16 },
  tabContent: { paddingBottom: 40 },
  
  // Summary Tab
  summaryStats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryStatCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryStatValue: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  summaryStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  
  // Records
  addRecordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, marginBottom: 16 },
  addRecordText: { color: '#fff', fontWeight: '600' },
  addForm: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  formRow: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  serviceTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceType: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  serviceTypeActive: { backgroundColor: '#4f46e5' },
  serviceTypeText: { fontSize: 12, color: '#64748b' },
  serviceTypeTextActive: { color: '#fff' },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  recordIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f59e0b20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  recordSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  recordAmount: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  
  // Stats Screen
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 12 },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  rankBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankGold: { backgroundColor: '#fef3c7' },
  rankSilver: { backgroundColor: '#e2e8f0' },
  rankBronze: { backgroundColor: '#fed7aa' },
  rankDefault: { backgroundColor: '#f1f5f9' },
  rankNumber: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  rankInfo: { flex: 1 },
  rankPlate: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  rankBrand: { fontSize: 11, color: '#64748b' },
  rankStats: { alignItems: 'flex-end' },
  rankProfit: { fontSize: 14, fontWeight: '700' },
  rankLabel: { fontSize: 10, color: '#94a3b8' },
  
  // Service Screen
  alertSummary: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  alertSummaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  alertSummaryValue: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  alertSummaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  alertIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertInfo: { flex: 1 },
  alertPlate: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  alertMessage: { fontSize: 12, color: '#64748b', marginTop: 2 },
  allGoodState: { alignItems: 'center', paddingVertical: 60, backgroundColor: '#10b98110', borderRadius: 16, marginTop: 20 },
  allGoodTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  allGoodText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  
  // Flight Cards
  flightCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flightRoute: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  flightStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  flightStatusText: { fontSize: 11, fontWeight: '600' },
  flightDriver: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  flightFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  flightIncome: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  flightExpense: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  activeFlightCard: { backgroundColor: '#4f46e5', borderRadius: 20, padding: 20, marginBottom: 16 },
  activeFlightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activeFlightTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  activeFlightBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  activeFlightBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  activeFlightRoute: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  activeFlightStats: { flexDirection: 'row', justifyContent: 'space-around' },
  activeFlightStat: { alignItems: 'center' },
  activeFlightStatValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  activeFlightStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  noFlightCard: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  noFlightTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  noFlightText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
});
