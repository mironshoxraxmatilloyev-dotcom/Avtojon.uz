import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS } from '../constants/theme';

const FUEL_TYPES = [
  { value: 'diesel', label: 'Dizel' },
  { value: 'petrol', label: 'Benzin' },
  { value: 'gas', label: 'Gaz' },
  { value: 'metan', label: 'Metan' },
];

export default function AddVehicleModal({ visible, onClose, onSubmit }) {
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'diesel',
    fuelTankCapacity: '',
    currentOdometer: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.plateNumber.trim()) e.plateNumber = 'Majburiy';
    if (!form.brand.trim()) e.brand = 'Majburiy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    onSubmit({
      plateNumber: form.plateNumber.toUpperCase(),
      brand: form.brand,
      year: parseInt(form.year) || new Date().getFullYear(),
      fuelType: form.fuelType,
      fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
      currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
      status: 'normal',
    });

    // Reset form
    setForm({
      plateNumber: '',
      brand: '',
      year: new Date().getFullYear().toString(),
      fuelType: 'diesel',
      fuelTankCapacity: '',
      currentOdometer: '',
    });
    setErrors({});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="truck" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.headerTitle}>Yangi mashina</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Icon name="x" size={20} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Plate Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Davlat raqami <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.plateNumber && styles.inputError]}
                value={form.plateNumber}
                onChangeText={(t) => {
                  setForm({ ...form, plateNumber: t.toUpperCase() });
                  if (errors.plateNumber) setErrors({ ...errors, plateNumber: null });
                }}
                placeholder="01A123BC"
                placeholderTextColor={COLORS.slate400}
                autoCapitalize="characters"
              />
              {errors.plateNumber && (
                <Text style={styles.errorText}>{errors.plateNumber}</Text>
              )}
            </View>

            {/* Brand & Year */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Marka <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.brand && styles.inputError]}
                  value={form.brand}
                  onChangeText={(t) => {
                    setForm({ ...form, brand: t });
                    if (errors.brand) setErrors({ ...errors, brand: null });
                  }}
                  placeholder="MAN"
                  placeholderTextColor={COLORS.slate400}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Yil</Text>
                <TextInput
                  style={styles.input}
                  value={form.year}
                  onChangeText={(t) => setForm({ ...form, year: t })}
                  placeholder="2020"
                  placeholderTextColor={COLORS.slate400}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yoqilg'i turi</Text>
              <View style={styles.fuelTypes}>
                {FUEL_TYPES.map((fuel) => (
                  <TouchableOpacity
                    key={fuel.value}
                    style={[
                      styles.fuelBtn,
                      form.fuelType === fuel.value && styles.fuelBtnActive,
                    ]}
                    onPress={() => setForm({ ...form, fuelType: fuel.value })}
                  >
                    <Text
                      style={[
                        styles.fuelBtnText,
                        form.fuelType === fuel.value && styles.fuelBtnTextActive,
                      ]}
                    >
                      {fuel.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tank & Odometer */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Bak ({form.fuelType === 'metan' ? 'kub' : 'L'})
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.fuelTankCapacity}
                  onChangeText={(t) => setForm({ ...form, fuelTankCapacity: t })}
                  placeholder="400"
                  placeholderTextColor={COLORS.slate400}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Spidometr (km)</Text>
                <TextInput
                  style={styles.input}
                  value={form.currentOdometer}
                  onChangeText={(t) => setForm({ ...form, currentOdometer: t })}
                  placeholder="0"
                  placeholderTextColor={COLORS.slate400}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Qo'shish</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  closeBtn: {
    padding: 8,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: 8,
  },
  required: {
    color: COLORS.red500,
  },
  input: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.slate900,
  },
  inputError: {
    borderColor: COLORS.red500,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red500,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fuelTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  fuelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    alignItems: 'center',
  },
  fuelBtnActive: {
    backgroundColor: COLORS.indigo50,
    borderColor: COLORS.indigo500,
  },
  fuelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
  },
  fuelBtnTextActive: {
    color: COLORS.indigo600,
  },
  submitBtn: {
    backgroundColor: COLORS.indigo500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    ...SHADOWS.md,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
