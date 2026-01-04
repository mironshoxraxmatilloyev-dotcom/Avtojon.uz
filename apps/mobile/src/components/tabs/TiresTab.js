import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, fmt, fmtDate, today } from '../../constants/theme';

const TIRE_POSITIONS = ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)'];
const TIRE_COUNTS = [
  { value: 1, label: '1 ta' },
  { value: 2, label: '2 ta' },
  { value: 4, label: '4 ta' },
  { value: 6, label: '6 ta' },
];

export default function TiresTab({ data, vehicle, onAdd, onDelete }) {
  const tires = data || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTire, setSelectedTire] = useState(null);

  const totalCost = tires.reduce((sum, t) => sum + (t.cost || 0), 0);

  const handleSubmit = (formData) => {
    // Agar to'liq almashtirish bo'lsa, har bir pozitsiya uchun alohida qo'shish
    if (formData.count > 1) {
      const positions = TIRE_POSITIONS.slice(0, formData.count);
      const costPerTire = Math.round(formData.totalCost / formData.count);
      positions.forEach(position => {
        onAdd({
          position,
          brand: formData.brand,
          size: formData.size || '',
          installDate: formData.installDate || today(),
          installOdometer: parseFloat(formData.installOdometer) || vehicle?.currentOdometer || 0,
          cost: costPerTire,
        });
      });
    } else {
      // 1 ta shina
      onAdd({
        position: formData.position,
        brand: formData.brand,
        size: formData.size || '',
        installDate: formData.installDate || today(),
        installOdometer: parseFloat(formData.installOdometer) || vehicle?.currentOdometer || 0,
        cost: parseFloat(formData.totalCost) || 0,
      });
    }
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={[styles.statCard, { backgroundColor: COLORS.violet50 }]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Jami shinalar</Text>
            <Text style={[styles.statValue, { color: COLORS.violet600 }]}>{tires.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Jami xarajat</Text>
            <Text style={[styles.statValue, { color: COLORS.violet600 }]}>{fmt(totalCost)}</Text>
          </View>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.violet500 }]} onPress={() => setShowAddModal(true)}>
        <Icon name="circle" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Shina qo'shish</Text>
      </TouchableOpacity>

      {/* List */}
      {tires.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Shinalar</Text>
          {tires.map(t => (
            <TouchableOpacity key={t._id} style={styles.listItem} onPress={() => setSelectedTire(t)}>
              <View style={styles.listItemLeft}>
                <View style={[styles.listItemIcon, { backgroundColor: COLORS.violet50 }]}>
                  <Icon name="circle" size={18} color={COLORS.violet500} />
                </View>
                <View>
                  <Text style={styles.listItemValue}>{t.position}</Text>
                  <Text style={styles.listItemBrand}>{t.brand} {t.size}</Text>
                </View>
              </View>
              {t.cost > 0 && <Text style={styles.listItemCost}>-{fmt(t.cost)}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <EmptyState />
      )}

      <AddTireModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleSubmit} vehicle={vehicle} />
      {selectedTire && <TireDetailModal tire={selectedTire} onClose={() => setSelectedTire(null)} onDelete={() => { onDelete(selectedTire._id); setSelectedTire(null); }} />}
    </View>
  );
}

const AddTireModal = ({ visible, onClose, onSubmit, vehicle }) => {
  const [mode, setMode] = useState('single'); // 'single' yoki 'full'
  const [count, setCount] = useState(1);
  const [form, setForm] = useState({
    position: TIRE_POSITIONS[0],
    brand: '',
    size: '',
    installDate: today(),
    installOdometer: vehicle?.currentOdometer?.toString() || '',
    totalCost: '',
  });

  const handleSubmit = () => {
    if (!form.brand) return;
    onSubmit({
      ...form,
      count: mode === 'single' ? 1 : count,
    });
    setForm({
      position: TIRE_POSITIONS[0],
      brand: '',
      size: '',
      installDate: today(),
      installOdometer: vehicle?.currentOdometer?.toString() || '',
      totalCost: '',
    });
    setMode('single');
    setCount(1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Shina qo'shish</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Mode tanlash */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'single' && styles.modeBtnActive]}
                onPress={() => setMode('single')}
              >
                <Icon name="circle" size={16} color={mode === 'single' ? COLORS.white : COLORS.violet500} />
                <Text style={[styles.modeBtnText, mode === 'single' && styles.modeBtnTextActive]}>1 ta shina</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'full' && styles.modeBtnActive]}
                onPress={() => setMode('full')}
              >
                <Icon name="layers" size={16} color={mode === 'full' ? COLORS.white : COLORS.violet500} />
                <Text style={[styles.modeBtnText, mode === 'full' && styles.modeBtnTextActive]}>To'liq almashtirish</Text>
              </TouchableOpacity>
            </View>

            {/* 1 ta shina - pozitsiya tanlash */}
            {mode === 'single' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pozitsiya</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.positionGrid}>
                    {TIRE_POSITIONS.map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.positionBtn, form.position === p && styles.positionBtnActive]}
                        onPress={() => setForm({ ...form, position: p })}
                      >
                        <Text style={[styles.positionText, form.position === p && styles.positionTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* To'liq almashtirish - soni tanlash */}
            {mode === 'full' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nechta shina?</Text>
                <View style={styles.countSelector}>
                  {TIRE_COUNTS.filter(c => c.value > 1).map(c => (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.countBtn, count === c.value && styles.countBtnActive]}
                      onPress={() => setCount(c.value)}
                    >
                      <Text style={[styles.countBtnText, count === c.value && styles.countBtnTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Brend *</Text>
                <TextInput
                  style={styles.input}
                  value={form.brand}
                  onChangeText={t => setForm({ ...form, brand: t })}
                  placeholder="Michelin"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>O'lcham</Text>
                <TextInput
                  style={styles.input}
                  value={form.size}
                  onChangeText={t => setForm({ ...form, size: t })}
                  placeholder="315/80R22.5"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Spidometr</Text>
                <TextInput
                  style={styles.input}
                  value={form.installOdometer}
                  onChangeText={t => setForm({ ...form, installOdometer: t })}
                  keyboardType="numeric"
                  placeholder="150000"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{mode === 'full' ? `Jami narx (${count} ta)` : 'Narx'}</Text>
                <TextInput
                  style={styles.input}
                  value={form.totalCost}
                  onChangeText={t => setForm({ ...form, totalCost: t })}
                  keyboardType="numeric"
                  placeholder={mode === 'full' ? '6000000' : '1500000'}
                />
              </View>
            </View>

            {mode === 'full' && form.totalCost && count > 1 && (
              <View style={styles.perTireInfo}>
                <Text style={styles.perTireText}>
                  Jami: {fmt(parseInt(form.totalCost.replace(/\D/g, '') || 0))} so'm ({count} ta shina)
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.violet500 }]} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                {mode === 'full' ? `${count} ta shina qo'shish` : 'Qo\'shish'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const TireDetailModal = ({ tire, onClose, onDelete }) => (
  <Modal visible animationType="fade" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{tire.position}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" size={24} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>
        <View style={styles.detailContent}>
          {tire.cost > 0 && (
            <View style={[styles.detailAmount, { backgroundColor: COLORS.violet50 }]}>
              <Text style={styles.detailAmountLabel}>Narx</Text>
              <Text style={[styles.detailAmountValue, { color: COLORS.violet600 }]}>-{fmt(tire.cost)}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brend</Text>
            <Text style={styles.detailValue}>{tire.brand}</Text>
          </View>
          {tire.size && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>O'lcham</Text>
              <Text style={styles.detailValue}>{tire.size}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>O'rnatilgan</Text>
            <Text style={styles.detailValue}>{fmtDate(tire.installDate)}</Text>
          </View>
          {tire.installOdometer > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Spidometr</Text>
              <Text style={styles.detailValue}>{fmt(tire.installOdometer)} km</Text>
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

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Icon name="circle" size={40} color={COLORS.slate300} />
    <Text style={styles.emptyText}>Shinalar yo'q</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 16 },
  statCard: { borderRadius: 16, padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: COLORS.slate500 },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  listContainer: { gap: 10 },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.slate200 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listItemValue: { fontSize: 15, fontWeight: '600', color: COLORS.slate900 },
  listItemBrand: { fontSize: 12, color: COLORS.slate400 },
  listItemCost: { fontSize: 16, fontWeight: '700', color: COLORS.red500 },
  emptyContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate200 },
  emptyText: { fontSize: 14, color: COLORS.slate500, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slate900 },
  modalContent: { padding: 16 },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.violet50, borderWidth: 2, borderColor: COLORS.violet200 },
  modeBtnActive: { backgroundColor: COLORS.violet500, borderColor: COLORS.violet500 },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.violet600 },
  modeBtnTextActive: { color: COLORS.white },
  countSelector: { flexDirection: 'row', gap: 10 },
  countBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.slate100, alignItems: 'center' },
  countBtnActive: { backgroundColor: COLORS.violet500 },
  countBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.slate600 },
  countBtnTextActive: { color: COLORS.white },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.slate700, marginBottom: 6 },
  input: { backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.slate900 },
  inputRow: { flexDirection: 'row', gap: 12 },
  positionGrid: { flexDirection: 'row', gap: 8 },
  positionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.slate100 },
  positionBtnActive: { backgroundColor: COLORS.violet500 },
  positionText: { fontSize: 12, fontWeight: '500', color: COLORS.slate600 },
  positionTextActive: { color: COLORS.white },
  perTireInfo: { backgroundColor: COLORS.emerald50, padding: 12, borderRadius: 10, marginBottom: 14, alignItems: 'center' },
  perTireText: { fontSize: 14, fontWeight: '600', color: COLORS.emerald600 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailModal: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { padding: 16 },
  detailAmount: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  detailAmountLabel: { fontSize: 13, color: COLORS.slate500 },
  detailAmountValue: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  detailLabel: { fontSize: 14, color: COLORS.slate500 },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.slate900 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.red50, margin: 16, borderRadius: 12, paddingVertical: 14, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.red600 },
});
