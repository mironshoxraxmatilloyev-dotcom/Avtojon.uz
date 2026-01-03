import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FUEL_TYPES } from '../constants/theme';

export default function AddVehicleScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'diesel',
    currentOdometer: '',
  });

  const handleSubmit = async () => {
    if (!form.plateNumber || !form.brand) {
      Alert.alert('Xatolik', 'Raqam va marka majburiy');
      return;
    }

    setLoading(true);
    try {
      await api.post('/vehicles', {
        ...form,
        year: parseInt(form.year) || new Date().getFullYear(),
        currentOdometer: parseFloat(form.currentOdometer) || 0,
        status: 'normal',
      });
      Alert.alert('Muvaffaqiyat', 'Mashina qo\'shildi', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mashina qo'shish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Davlat raqami *</Text>
        <TextInput
          style={styles.input}
          placeholder="01 A 123 BC"
          placeholderTextColor={COLORS.textMuted}
          value={form.plateNumber}
          onChangeText={(v) => setForm({ ...form, plateNumber: v })}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Marka *</Text>
        <TextInput
          style={styles.input}
          placeholder="MAN, Volvo, Mercedes..."
          placeholderTextColor={COLORS.textMuted}
          value={form.brand}
          onChangeText={(v) => setForm({ ...form, brand: v })}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          placeholder="TGX, FH16..."
          placeholderTextColor={COLORS.textMuted}
          value={form.model}
          onChangeText={(v) => setForm({ ...form, model: v })}
        />

        <Text style={styles.label}>Yil</Text>
        <TextInput
          style={styles.input}
          placeholder="2020"
          placeholderTextColor={COLORS.textMuted}
          value={form.year}
          onChangeText={(v) => setForm({ ...form, year: v })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Yoqilg'i turi</Text>
        <View style={styles.fuelTypes}>
          {Object.entries(FUEL_TYPES).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.fuelType, form.fuelType === key && styles.fuelTypeActive]}
              onPress={() => setForm({ ...form, fuelType: key })}
            >
              <Text style={[styles.fuelTypeText, form.fuelType === key && styles.fuelTypeTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Spidometr (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={COLORS.textMuted}
          value={form.currentOdometer}
          onChangeText={(v) => setForm({ ...form, currentOdometer: v })}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Qo'shish</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  fuelTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fuelType: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  fuelTypeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fuelTypeText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  fuelTypeTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
