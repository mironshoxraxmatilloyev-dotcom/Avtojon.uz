import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, SHADOWS } from '../constants/theme';
import VoiceRecorder from '../components/VoiceRecorder';

// Tabs
import SummaryTab from '../components/tabs/SummaryTab';
import IncomeTab from '../components/tabs/IncomeTab';
import FuelTab from '../components/tabs/FuelTab';
import OilTab from '../components/tabs/OilTab';
import TiresTab from '../components/tabs/TiresTab';
import ServicesTab from '../components/tabs/ServicesTab';

const TABS = [
  { id: 'summary', icon: 'bar-chart-2', label: 'Umumiy' },
  { id: 'income', icon: 'dollar-sign', label: 'Daromad' },
  { id: 'fuel', icon: 'droplet', label: 'Yoqilg\'i' },
  { id: 'oil', icon: 'disc', label: 'Moy' },
  { id: 'tires', icon: 'circle', label: 'Shina' },
  { id: 'services', icon: 'tool', label: 'Xizmat' },
];

export default function VehicleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showVoice, setShowVoice] = useState(false);
  const [voiceData, setVoiceData] = useState(null); // Voice dan kelgan data - modal uchun

  // Data states
  const [fuelData, setFuelData] = useState({ refills: [], stats: {} });
  const [oilData, setOilData] = useState({ changes: [], status: 'ok', remainingKm: 10000 });
  const [tires, setTires] = useState([]);
  const [services, setServices] = useState({ services: [], stats: {} });
  const [incomeData, setIncomeData] = useState({ incomes: [], stats: {} });

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const { data } = await api.get(`/vehicles/${id}`);
      setVehicle(data.data);
    } catch (e) {
      Alert.alert('Xatolik', 'Mashina topilmadi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [f, o, t, s, inc] = await Promise.all([
        api.get(`/maintenance/vehicles/${id}/fuel`).catch(() => ({ data: { data: { refills: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${id}/oil`).catch(() => ({ data: { data: { changes: [], status: 'ok', remainingKm: 10000 } } })),
        api.get(`/maintenance/vehicles/${id}/tires`).catch(() => ({ data: { data: [] } })),
        api.get(`/maintenance/vehicles/${id}/services`).catch(() => ({ data: { data: { services: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${id}/income`).catch(() => ({ data: { data: { incomes: [], stats: {} } } })),
      ]);
      setFuelData(f.data.data || { refills: [], stats: {} });
      setOilData(o.data.data || { changes: [], status: 'ok', remainingKm: 10000 });
      setTires(t.data.data || []);
      setServices(s.data.data || { services: [], stats: {} });
      setIncomeData(inc.data.data || { incomes: [], stats: {} });
    } catch (e) {
      console.error('Data yuklashda xatolik:', e);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (vehicle) loadData();
  }, [vehicle]);

  const onRefresh = () => {
    loadVehicle();
    loadData();
  };

  // Voice result handler - modal ochish uchun data ni saqlash
  const handleVoiceResult = (result) => {
    console.log('Voice result:', result);
    // Voice dan kelgan data ni to'g'ri formatga o'tkazish
    let formattedData = { ...result };
    
    if (result.type === 'fuel') {
      formattedData = {
        date: new Date().toISOString().split('T')[0],
        liters: result.liters || 0,
        cost: result.amount || result.cost || 0, // amount -> cost
        odometer: vehicle?.currentOdometer || 0,
        fuelType: result.fuelType || vehicle?.fuelType || 'diesel',
        station: result.station || '',
      };
      setVoiceData({ type: 'fuel', data: formattedData });
      setActiveTab('fuel'); // Fuel tab ga o'tish
    } else if (result.type === 'oil') {
      formattedData = {
        date: new Date().toISOString().split('T')[0],
        oilBrand: result.oilBrand || result.brand || '',
        oilType: result.oilType || '10W-40',
        liters: result.liters || 0,
        cost: result.cost || result.amount || 0,
        odometer: vehicle?.currentOdometer || 0,
      };
      setVoiceData({ type: 'oil', data: formattedData });
      setActiveTab('oil');
    } else if (result.type === 'income') {
      formattedData = {
        date: new Date().toISOString().split('T')[0],
        amount: result.amount || 0,
        description: result.description || '',
      };
      setVoiceData({ type: 'income', data: formattedData });
      setActiveTab('income');
    } else if (result.type === 'service') {
      formattedData = {
        date: new Date().toISOString().split('T')[0],
        serviceType: result.serviceType || 'other',
        cost: result.cost || result.amount || 0,
        description: result.description || '',
        odometer: vehicle?.currentOdometer || 0,
      };
      setVoiceData({ type: 'service', data: formattedData });
      setActiveTab('services');
    }
  };

  // CRUD handlers
  const handleAddFuel = async (fuelForm) => {
    try {
      console.log('💾 Fuel saqlash:', fuelForm);
      const { data } = await api.post(`/maintenance/vehicles/${id}/fuel`, fuelForm);
      console.log('✅ Fuel javob:', data);
      if (data.data) {
        setFuelData(prev => ({ ...prev, refills: [data.data, ...prev.refills] }));
        Alert.alert('Muvaffaqiyat', 'Yoqilg\'i qo\'shildi!');
      }
    } catch (e) {
      console.error('❌ Fuel xato:', e.message, e.response?.status, e.response?.data);
      Alert.alert('Xatolik', e.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleAddOil = async (oilForm) => {
    try {
      console.log('💾 Oil saqlash:', oilForm);
      const { data } = await api.post(`/maintenance/vehicles/${id}/oil`, oilForm);
      console.log('✅ Oil javob:', data);
      if (data.data) {
        setOilData(prev => ({ ...prev, changes: [data.data, ...prev.changes], status: 'ok' }));
        Alert.alert('Muvaffaqiyat', 'Moy almashtirish qo\'shildi!');
      }
    } catch (e) {
      console.error('❌ Oil xato:', e.message, e.response?.status, e.response?.data);
      Alert.alert('Xatolik', e.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleAddTire = async (tireForm) => {
    try {
      const { data } = await api.post(`/maintenance/vehicles/${id}/tires`, tireForm);
      if (data.data) {
        setTires(prev => [...prev, data.data]);
        Alert.alert('Muvaffaqiyat', 'Shina qo\'shildi!');
      }
    } catch (e) {
      Alert.alert('Xatolik', 'Saqlashda xatolik');
    }
  };

  const handleAddService = async (serviceForm) => {
    try {
      console.log('💾 Service saqlash:', serviceForm);
      const { data } = await api.post(`/maintenance/vehicles/${id}/services`, serviceForm);
      console.log('✅ Service javob:', data);
      if (data.data) {
        setServices(prev => ({ ...prev, services: [data.data, ...prev.services] }));
        Alert.alert('Muvaffaqiyat', 'Xizmat qo\'shildi!');
      }
    } catch (e) {
      console.error('❌ Service xato:', e.message, e.response?.status, e.response?.data);
      Alert.alert('Xatolik', e.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleAddIncome = async (incomeForm) => {
    try {
      console.log('💾 Income saqlash:', incomeForm);
      const { data } = await api.post(`/maintenance/vehicles/${id}/income`, incomeForm);
      console.log('✅ Income javob:', data);
      if (data.data) {
        setIncomeData(prev => ({ ...prev, incomes: [data.data, ...prev.incomes] }));
        Alert.alert('Muvaffaqiyat', 'Daromad qo\'shildi!');
      }
    } catch (e) {
      console.error('❌ Income xato:', e.message, e.response?.status, e.response?.data);
      Alert.alert('Xatolik', e.response?.data?.message || 'Saqlashda xatolik');
    }
  };

  const handleDelete = async (type, itemId) => {
    Alert.alert('O\'chirish', 'O\'chirishni tasdiqlaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O\'chirish',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/maintenance/${type}/${itemId}`);
            if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: prev.refills.filter(r => r._id !== itemId) }));
            else if (type === 'oil') setOilData(prev => ({ ...prev, changes: prev.changes.filter(c => c._id !== itemId) }));
            else if (type === 'tires') setTires(prev => prev.filter(t => t._id !== itemId));
            else if (type === 'services') setServices(prev => ({ ...prev, services: prev.services.filter(s => s._id !== itemId) }));
            else if (type === 'income') setIncomeData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i._id !== itemId) }));
          } catch (e) {
            Alert.alert('Xatolik', 'O\'chirishda xatolik');
          }
        },
      },
    ]);
  };

  // Get voice context based on active tab
  const getVoiceContext = () => {
    const contexts = {
      fuel: 'fuel',
      oil: 'oil',
      income: 'income',
      services: 'service',
      tires: 'tire',
    };
    return contexts[activeTab] || 'vehicle';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.indigo500} />
        </View>
      </SafeAreaView>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab vehicle={vehicle} />;
      case 'income':
        return <IncomeTab data={incomeData} onAdd={handleAddIncome} onDelete={(id) => handleDelete('income', id)} />;
      case 'fuel':
        return <FuelTab data={fuelData} vehicle={vehicle} onAdd={handleAddFuel} onDelete={(id) => handleDelete('fuel', id)} voiceData={voiceData?.type === 'fuel' ? voiceData.data : null} onVoiceDataClear={() => setVoiceData(null)} />;
      case 'oil':
        return <OilTab data={oilData} vehicle={vehicle} onAdd={handleAddOil} onDelete={(id) => handleDelete('oil', id)} />;
      case 'tires':
        return <TiresTab data={tires} vehicle={vehicle} onAdd={handleAddTire} onDelete={(id) => handleDelete('tires', id)} />;
      case 'services':
        return <ServicesTab data={services} vehicle={vehicle} onAdd={handleAddService} onDelete={(id) => handleDelete('services', id)} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={COLORS.slate600} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.plateNumber}>{vehicle?.plateNumber}</Text>
          <Text style={styles.brand}>{vehicle?.brand} • {vehicle?.year}</Text>
        </View>
        {/* Voice button in header */}
        <TouchableOpacity style={styles.voiceHeaderBtn} onPress={() => setShowVoice(true)}>
          <Icon name="mic" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.indigo500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTab()}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? COLORS.indigo500 : COLORS.slate400}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        visible={showVoice}
        onClose={() => setShowVoice(false)}
        onResult={handleVoiceResult}
        context={getVoiceContext()}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  brand: {
    fontSize: 13,
    color: COLORS.slate500,
    marginTop: 2,
  },
  voiceHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingBottom: 20,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.indigo500,
    marginTop: -1,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.slate400,
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.indigo500,
  },
});
