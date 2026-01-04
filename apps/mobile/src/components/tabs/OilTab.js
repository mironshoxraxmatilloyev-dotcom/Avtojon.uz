import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, fmt, fmtDate, today } from '../../constants/theme';

export default function OilTab({ data, vehicle, onAdd, onDelete }) {
  const { changes = [], status, remainingKm } = data;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOil, setSelectedOil] = useState(null);

  const totalCost = changes.reduce((sum, c) => sum + (c.cost || 0), 0);

  const handleSubmit = (form) => {
    const odometer = parseFloat(form.odometer) || vehicle?.currentOdometer || 0;
    onAdd({
      date: form.date || today(),
      odometer,
      oilType: form.oilType || '',
      oilBrand: form.oilBrand || '',
      liters: parseFloat(form.liters) || 0,
      cost: parseFloat(form.cost) || 0,
      nextChangeOdometer: odometer + (parseFloat(form.nextChangeKm) || 10000),
    });
    setShowAddModal(false);
  };

  const getStatusColor = () => {
    if (status === 'overdue') return COLORS.red500;
    if (status === 'approaching') return COLORS.amber500;
    return COLORS.emerald500;
  };

  const getStatusLabel = () => {
    if (status === 'overdue') return 'O\'tgan';
    if (status === 'approaching') return 'Yaqin';
    return 'Yaxshi';
  };

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <View style={[styles.statusIcon, { backgroundColor: getStatusColor() }]}>
          <Icon name="disc" size={20} color={COLORS.white} />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Moy holati</Text>
          <Text style={[styles.statusValue, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
          <Text style={styles.statusKm}>{fmt(remainingKm || 0)} km qoldi</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statCard, { backgroundColor: COLORS.amber50 }]}>
        <Text style={styles.statLabel}>Jami xarajat</Text>
        <Text style={[styles.statValue, { color: COLORS.amber600 }]}>{fmt(totalCost)}</Text>
        <Text style={styles.statUnit}>so'm</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.amber500 }]} onPress={() => setShowAddModal(true)}>
        <Icon name="disc" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Moy almashtirish</Text>
      </TouchableOpacity>

      {/* List */}
      {changes.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Tarix</Text>
          {changes.map(c => (
            <TouchableOpacity key={c._id} style={styles.listItem} onPress={() => setSelectedOil(c)}>
              <View style={styles.listItemLeft}>
                <View style={[styles.listItemIcon, { backgroundColor: COLORS.amber50 }]}>
                  <Icon name="disc" size={18} color={COLORS.amber500} />
                </View>
                <View>
                  <Text style={styles.listItemValue}>{c.oilBrand || c.oilType || 'Moy'}</Text>
                  <Text style={styles.listItemDate}>{fmtDate(c.date)}</Text>
                </View>
              </View>
              <Text style={styles.listItemCost}>-{fmt(c.cost)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <EmptyState />
      )}

      <AddOilModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleSubmit} vehicle={vehicle} />
      {selectedOil && <OilDetailModal oil={selectedOil} onClose={() => setSelectedOil(null)} onDelete={() => { onDelete(selectedOil._id); setSelectedOil(null); }} />}
    </View>
  );
}

const AddOilModal = ({ visible, onClose, onSubmit, vehicle }) => {
  const [form, setForm] = useState({ date: today(), odometer: vehicle?.currentOdometer?.toString() || '', oilType: '', oilBrand: '', liters: '', cost: '', nextChangeKm: '10000' });
  const handleSubmit = () => { if (!form.cost) return; onSubmit(form); setForm({ date: today(), odometer: vehicle?.currentOdometer?.toString() || '', oilType: '', oilBrand: '', liters: '', cost: '', nextChangeKm: '10000' }); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Moy almashtirish</Text><TouchableOpacity onPress={onClose}><Icon name="x" size={24} color={COLORS.slate400} /></TouchableOpacity></View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputRow}><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Sana</Text><TextInput style={styles.input} value={form.date} onChangeText={t => setForm({ ...form, date: t })} /></View><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Spidometr</Text><TextInput style={styles.input} value={form.odometer} onChangeText={t => setForm({ ...form, odometer: t })} keyboardType="numeric" /></View></View>
            <View style={styles.inputRow}><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Moy turi</Text><TextInput style={styles.input} value={form.oilType} onChangeText={t => setForm({ ...form, oilType: t })} placeholder="10W-40" /></View><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Brend</Text><TextInput style={styles.input} value={form.oilBrand} onChangeText={t => setForm({ ...form, oilBrand: t })} placeholder="Mobil" /></View></View>
            <View style={styles.inputRow}><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Litr</Text><TextInput style={styles.input} value={form.liters} onChangeText={t => setForm({ ...form, liters: t })} keyboardType="numeric" /></View><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Narx *</Text><TextInput style={styles.input} value={form.cost} onChangeText={t => setForm({ ...form, cost: t })} keyboardType="numeric" /></View></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Keyingi almashtirish (km)</Text><TextInput style={styles.input} value={form.nextChangeKm} onChangeText={t => setForm({ ...form, nextChangeKm: t })} keyboardType="numeric" /></View>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.amber500 }]} onPress={handleSubmit}><Text style={styles.submitBtnText}>Qo'shish</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const OilDetailModal = ({ oil, onClose, onDelete }) => (
  <Modal visible animationType="fade" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Moy almashtirish</Text><TouchableOpacity onPress={onClose}><Icon name="x" size={24} color={COLORS.slate400} /></TouchableOpacity></View>
        <View style={styles.detailContent}>
          <View style={[styles.detailAmount, { backgroundColor: COLORS.amber50 }]}><Text style={styles.detailAmountLabel}>Xarajat</Text><Text style={[styles.detailAmountValue, { color: COLORS.amber600 }]}>-{fmt(oil.cost)}</Text></View>
          {oil.oilBrand && <View style={styles.detailRow}><Text style={styles.detailLabel}>Brend</Text><Text style={styles.detailValue}>{oil.oilBrand}</Text></View>}
          {oil.oilType && <View style={styles.detailRow}><Text style={styles.detailLabel}>Turi</Text><Text style={styles.detailValue}>{oil.oilType}</Text></View>}
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Sana</Text><Text style={styles.detailValue}>{fmtDate(oil.date)}</Text></View>
          {oil.odometer > 0 && <View style={styles.detailRow}><Text style={styles.detailLabel}>Spidometr</Text><Text style={styles.detailValue}>{fmt(oil.odometer)} km</Text></View>}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}><Icon name="trash-2" size={18} color={COLORS.red600} /><Text style={styles.deleteBtnText}>O'chirish</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const EmptyState = () => (<View style={styles.emptyContainer}><Icon name="disc" size={40} color={COLORS.slate300} /><Text style={styles.emptyText}>Moy almashtirish tarixi yo'q</Text></View>);

const styles = StyleSheet.create({
  container: { gap: 16 },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 2, gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statusInfo: {},
  statusLabel: { fontSize: 12, color: COLORS.slate500 },
  statusValue: { fontSize: 18, fontWeight: '700' },
  statusKm: { fontSize: 13, color: COLORS.slate500 },
  statCard: { borderRadius: 16, padding: 16, alignItems: 'center' },
  statLabel: { fontSize: 13, color: COLORS.slate500 },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  statUnit: { fontSize: 12, color: COLORS.slate400 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  listContainer: { gap: 10 },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.slate200 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listItemValue: { fontSize: 15, fontWeight: '600', color: COLORS.slate900 },
  listItemDate: { fontSize: 12, color: COLORS.slate400 },
  listItemCost: { fontSize: 18, fontWeight: '700', color: COLORS.red500 },
  emptyContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate200 },
  emptyText: { fontSize: 14, color: COLORS.slate500, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slate900 },
  modalContent: { padding: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.slate700, marginBottom: 6 },
  input: { backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.slate900 },
  inputRow: { flexDirection: 'row', gap: 12 },
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
