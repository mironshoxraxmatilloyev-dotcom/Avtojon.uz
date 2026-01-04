import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, fmt, fmtDate, today } from '../../constants/theme';

export default function FuelTab({ data, vehicle, onAdd, onDelete, voiceData, onVoiceDataClear }) {
  const { refills = [], stats = {} } = data;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState(null);
  const [initialData, setInitialData] = useState(null);

  const fuelType = vehicle?.fuelType?.toLowerCase() || '';
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan';
  const unit = isGas ? 'kub' : 'litr';

  const totalCost = stats.totalCost || refills.reduce((sum, r) => sum + (r.cost || 0), 0);
  
  // 1km ga sarf hisoblash - oxirgi 2 ta refill orasidagi masofa va yoqilg'i
  const calculateConsumption = () => {
    if (refills.length < 2) return null;
    // Spidometr bo'yicha tartiblash (kattadan kichikka)
    const sorted = [...refills].filter(r => r.odometer > 0).sort((a, b) => b.odometer - a.odometer);
    if (sorted.length < 2) return null;
    
    const lastOdometer = sorted[0].odometer;
    const prevOdometer = sorted[1].odometer;
    const distance = lastOdometer - prevOdometer;
    const liters = sorted[0].liters;
    
    if (distance <= 0) return null;
    return (liters / distance).toFixed(3); // 1km ga sarf
  };
  
  const consumptionPerKm = calculateConsumption();

  // Voice data kelganda modal ochish
  useEffect(() => {
    if (voiceData) {
      setInitialData(voiceData);
      setShowAddModal(true);
    }
  }, [voiceData]);

  const handleSubmit = (form) => {
    onAdd({
      date: form.date || today(),
      liters: parseFloat(form.liters) || 0,
      cost: parseFloat(form.cost) || 0,
      odometer: parseFloat(form.odometer) || vehicle?.currentOdometer || 0,
      fuelType: vehicle?.fuelType || 'diesel',
    });
    setShowAddModal(false);
    setInitialData(null);
    onVoiceDataClear?.();
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setInitialData(null);
    onVoiceDataClear?.();
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.emerald50 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.emerald500 }]}>
            <Icon name="dollar-sign" size={18} color={COLORS.white} />
          </View>
          <Text style={styles.statLabel}>Jami xarajat</Text>
          <Text style={[styles.statValue, { color: COLORS.emerald600 }]}>{fmt(totalCost)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.blue50 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.blue500 }]}>
            <Icon name="activity" size={18} color={COLORS.white} />
          </View>
          <Text style={styles.statLabel}>1 km ga sarf</Text>
          <Text style={[styles.statValue, { color: COLORS.blue600 }]}>
            {consumptionPerKm ? `${consumptionPerKm} ${unit}` : '—'}
          </Text>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Icon name="droplet" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Yoqilg'i qo'shish</Text>
      </TouchableOpacity>

      {/* List */}
      {refills.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Tarix</Text>
          {refills.map(r => (
            <TouchableOpacity
              key={r._id}
              style={styles.listItem}
              onPress={() => setSelectedFuel(r)}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listItemIcon}>
                  <Icon name="droplet" size={18} color={COLORS.blue500} />
                </View>
                <View>
                  <Text style={styles.listItemValue}>{r.liters} {unit}</Text>
                  <Text style={styles.listItemDate}>{fmtDate(r.date)}</Text>
                </View>
              </View>
              <Text style={styles.listItemCost}>-{fmt(r.cost)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <EmptyState text="Yoqilg'i ma'lumotlari yo'q" />
      )}

      {/* Add Modal */}
      <AddFuelModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        unit={unit}
        vehicle={vehicle}
        initialData={initialData}
      />

      {/* Detail Modal */}
      {selectedFuel && (
        <FuelDetailModal
          fuel={selectedFuel}
          unit={unit}
          onClose={() => setSelectedFuel(null)}
          onDelete={() => {
            onDelete(selectedFuel._id);
            setSelectedFuel(null);
          }}
        />
      )}
    </View>
  );
}

const AddFuelModal = ({ visible, onClose, onSubmit, unit, vehicle, initialData }) => {
  const [form, setForm] = useState({
    date: today(),
    liters: '',
    cost: '',
    odometer: vehicle?.currentOdometer?.toString() || '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date || today(),
        liters: initialData.liters?.toString() || '',
        cost: initialData.cost?.toString() || '',
        odometer: initialData.odometer?.toString() || vehicle?.currentOdometer?.toString() || '',
      });
    } else {
      setForm({
        date: today(),
        liters: '',
        cost: '',
        odometer: vehicle?.currentOdometer?.toString() || '',
      });
    }
  }, [initialData, vehicle]);

  const handleSubmit = () => {
    if (!form.liters || !form.cost) return;
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? '🎤 Ovozdan aniqlandi' : 'Yoqilg\'i qo\'shish'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {initialData && (
              <View style={styles.voiceHint}>
                <Icon name="mic" size={16} color={COLORS.indigo500} />
                <Text style={styles.voiceHintText}>Ma'lumotlarni tekshiring va tasdiqlang</Text>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sana</Text>
              <TextInput
                style={styles.input}
                value={form.date}
                onChangeText={t => setForm({ ...form, date: t })}
                placeholder="2024-01-15"
              />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Miqdor ({unit}) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.liters}
                  onChangeText={t => setForm({ ...form, liters: t })}
                  placeholder="40"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Narx (so'm) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.cost}
                  onChangeText={t => setForm({ ...form, cost: t })}
                  placeholder="150000"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Spidometr (km) *</Text>
              <TextInput
                style={styles.input}
                value={form.odometer}
                onChangeText={t => setForm({ ...form, odometer: t })}
                placeholder="150000"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{initialData ? 'Tasdiqlash' : 'Qo\'shish'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const FuelDetailModal = ({ fuel, unit, onClose, onDelete }) => (
  <Modal visible animationType="fade" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Yoqilg'i</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" size={24} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>
        <View style={styles.detailContent}>
          <View style={styles.detailAmount}>
            <Text style={styles.detailAmountLabel}>Xarajat</Text>
            <Text style={styles.detailAmountValue}>-{fmt(fuel.cost)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Miqdor</Text>
            <Text style={styles.detailValue}>{fuel.liters} {unit}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sana</Text>
            <Text style={styles.detailValue}>{fmtDate(fuel.date)}</Text>
          </View>
          {fuel.odometer > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Spidometr</Text>
              <Text style={styles.detailValue}>{fmt(fuel.odometer)} km</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Icon name="trash-2" size={18} color={COLORS.red600} />
          <Text style={styles.deleteBtnText}>O'chirish</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const EmptyState = ({ text }) => (
  <View style={styles.emptyContainer}>
    <Icon name="droplet" size={40} color={COLORS.slate300} />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: COLORS.slate500, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blue500, borderRadius: 12, paddingVertical: 14, gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  listContainer: { gap: 10 },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.slate200 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.blue50, justifyContent: 'center', alignItems: 'center' },
  listItemValue: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  listItemDate: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  listItemCost: { fontSize: 18, fontWeight: '700', color: COLORS.red500 },
  emptyContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate200 },
  emptyText: { fontSize: 14, color: COLORS.slate500, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slate900 },
  modalContent: { padding: 16 },
  voiceHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.indigo50, padding: 12, borderRadius: 10, marginBottom: 16 },
  voiceHintText: { fontSize: 13, color: COLORS.indigo600 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.slate700, marginBottom: 6 },
  input: { backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.slate900 },
  inputRow: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: COLORS.blue500, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailModal: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { padding: 16 },
  detailAmount: { backgroundColor: COLORS.red50, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  detailAmountLabel: { fontSize: 13, color: COLORS.slate500 },
  detailAmountValue: { fontSize: 32, fontWeight: '700', color: COLORS.red500, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  detailLabel: { fontSize: 14, color: COLORS.slate500 },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.slate900 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.red50, margin: 16, borderRadius: 12, paddingVertical: 14, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.red600 },
});
