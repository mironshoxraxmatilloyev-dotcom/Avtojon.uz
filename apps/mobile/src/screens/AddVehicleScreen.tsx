import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS } from '../constants/theme';
import { ChevronLeft, Truck, Plus } from '../components/Icons';

export default function AddVehicleScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'diesel',
    fuelTankCapacity: '',
    currentOdometer: '',
  });

  const FUEL_TYPES = [
    { value: 'diesel', label: 'Dizel' },
    { value: 'benzin', label: 'Benzin' },
    { value: 'metan', label: 'Metan' },
    { value: 'propan', label: 'Propan' },
  ];

  const handleSubmit = async () => {
    if (!form.plateNumber.trim()) {
      Alert.alert('Xatolik', 'Davlat raqamini kiriting');
      return;
    }
    if (!form.brand.trim()) {
      Alert.alert('Xatolik', 'Markani kiriting');
      return;
    }

    setLoading(true);
    try {
      const body = {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim() || undefined,
        year: parseInt(form.year) || new Date().getFullYear(),
        fuelType: form.fuelType,
        fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : undefined,
        currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
        status: 'normal',
      };

      await api.post('/vehicles', body);
      Alert.alert('Muvaffaqiyat', 'Mashina qo\'shildi', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Xatolik', err.response?.data?.message || 'Mashina qo\'shishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mashina qo'shish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Truck size={40} color={COLORS.primary} />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Davlat raqami *</Text>
            <TextInput
              style={styles.input}
              value={form.plateNumber}
              onChangeText={(v) => setForm({ ...form, plateNumber: v.toUpperCase() })}
              placeholder="01 A 123 AA"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marka *</Text>
            <TextInput
              style={styles.input}
              value={form.brand}
              onChangeText={(v) => setForm({ ...form, brand: v })}
              placeholder="MAN, Volvo, Mercedes..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={form.model}
                onChangeText={(v) => setForm({ ...form, model: v })}
                placeholder="TGX, FH16..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Yil</Text>
              <TextInput
                style={styles.input}
                value={form.year}
                onChangeText={(v) => setForm({ ...form, year: v })}
                placeholder="2020"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yoqilg'i turi</Text>
            <View style={styles.fuelTypes}>
              {FUEL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.fuelType, form.fuelType === type.value && styles.fuelTypeActive]}
                  onPress={() => setForm({ ...form, fuelType: type.value })}
                >
                  <Text style={[styles.fuelTypeText, form.fuelType === type.value && styles.fuelTypeTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Bak hajmi (L)</Text>
              <TextInput
                style={styles.input}
                value={form.fuelTankCapacity}
                onChangeText={(v) => setForm({ ...form, fuelTankCapacity: v })}
                placeholder="400"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Spidometr (km)</Text>
              <TextInput
                style={styles.input}
                value={form.currentOdometer}
                onChangeText={(v) => setForm({ ...form, currentOdometer: v })}
                placeholder="150000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Mashina qo'shish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  content: { flex: 1 },

  iconContainer: { alignItems: 'center', paddingVertical: 24 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center', alignItems: 'center',
  },

  form: { paddingHorizontal: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', gap: 12 },

  fuelTypes: { flexDirection: 'row', gap: 8 },
  fuelType: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  fuelTypeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fuelTypeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  fuelTypeTextActive: { color: '#fff' },

  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
