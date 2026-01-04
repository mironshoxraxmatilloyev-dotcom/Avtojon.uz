import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, fmt, fmtDate, today } from '../../constants/theme';

const SERVICE_TYPES = ['TO-1', 'TO-2', 'Moy almashtirish', 'Tormoz', 'Shina', 'Dvigatel', 'Uzatmalar qutisi', 'Elektrika', 'Kuzov', 'Boshqa'];

export default function ServicesTab({ data, vehicle, onAdd, onDelete }) {
  const { services = [], stats = {} } = data;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleSubmit = (form) => {
    onAdd({
      type: form.type,
      date: form.date || today(),
      odometer: parseFloat(form.odometer) || vehicle?.currentOdometer || 0,
      cost: parseFloat(form.cost) || 0,
      description: form.description || '',
      serviceName: form.serviceName || '',
    });
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={[styles.statCard, { backgroundColor: COLORS.cyan50 }]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Jami xizmatlar</Text>
            <Text style={[styles.statValue, { color: COLORS.cyan500 }]}>{services.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Jami xarajat</Text>
            <Text style={[styles.statValue, { color: COLORS.cyan500 }]}>{fmt(stats.totalCost || 0)}</Text>
          </View>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.cyan500 }]} onPress={() => setShowAddModal(true)}>
        <Icon name="tool" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Xizmat qo'shish</Text>
      </TouchableOpacity>

      {/* List */}
      {services.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Xizmatlar tarixi</Text>
          {services.map(s => (
            <TouchableOpacity key={s._id} style={styles.listItem} onPress={() => setSelectedService(s)}>
              <View style={styles.listItemLeft}>
                <View style={[styles.listItemIcon, { backgroundColor: COLORS.cyan50 }]}>
                  <Icon name="tool" size={18} color={COLORS.cyan500} />
                </View>
                <View>
                  <Text style={styles.listItemValue}>{s.type}</Text>
                  <Text style={styles.listItemDate}>{fmtDate(s.date)}</Text>
                </View>
              </View>
              <Text style={styles.listItemCost}>-{fmt(s.cost)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <EmptyState />
      )}

      <AddServiceModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleSubmit} vehicle={vehicle} />
      {selectedService && <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} onDelete={() => { onDelete(selectedService._id); setSelectedService(null); }} />}
    </View>
  );
}

const AddServiceModal = ({ visible, onClose, onSubmit, vehicle }) => {
  const [form, setForm] = useState({ type: SERVICE_TYPES[0], date: today(), odometer: vehicle?.currentOdometer?.toString() || '', cost: '', description: '', serviceName: '' });
  const handleSubmit = () => { if (!form.cost) return; onSubmit(form); setForm({ type: SERVICE_TYPES[0], date: today(), odometer: vehicle?.currentOdometer?.toString() || '', cost: '', description: '', serviceName: '' }); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Xizmat qo'shish</Text><TouchableOpacity onPress={onClose}><Icon name="x" size={24} color={COLORS.slate400} /></TouchableOpacity></View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Xizmat turi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.typeGrid}>{SERVICE_TYPES.map(t => (<TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]} onPress={() => setForm({ ...form, type: t })}><Text style={[styles.typeText, form.type === t && styles.typeTextActive]}>{t}</Text></TouchableOpacity>))}</View></ScrollView>
            </View>
            <View style={styles.inputRow}><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Sana</Text><TextInput style={styles.input} value={form.date} onChangeText={t => setForm({ ...form, date: t })} /></View><View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Spidometr</Text><TextInput style={styles.input} value={form.odometer} onChangeText={t => setForm({ ...form, odometer: t })} keyboardType="numeric" /></View></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Narx (so'm) *</Text><TextInput style={styles.input} value={form.cost} onChangeText={t => setForm({ ...form, cost: t })} placeholder="500000" keyboardType="numeric" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Servis nomi</Text><TextInput style={styles.input} value={form.serviceName} onChangeText={t => setForm({ ...form, serviceName: t })} placeholder="Avtoservis nomi" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Izoh</Text><TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.description} onChangeText={t => setForm({ ...form, description: t })} placeholder="Qo'shimcha ma'lumot" multiline /></View>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.cyan500 }]} onPress={handleSubmit}><Text style={styles.submitBtnText}>Qo'shish</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ServiceDetailModal = ({ service, onClose, onDelete }) => (
  <Modal visible animationType="fade" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{service.type}</Text><TouchableOpacity onPress={onClose}><Icon name="x" size={24} color={COLORS.slate400} /></TouchableOpacity></View>
        <View style={styles.detailContent}>
          <View style={[styles.detailAmount, { backgroundColor: COLORS.cyan50 }]}><Text style={styles.detailAmountLabel}>Xarajat</Text><Text style={[styles.detailAmountValue, { color: COLORS.cyan500 }]}>-{fmt(service.cost)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Sana</Text><Text style={styles.detailValue}>{fmtDate(service.date)}</Text></View>
          {service.odometer > 0 && <View style={styles.detailRow}><Text style={styles.detailLabel}>Spidometr</Text><Text style={styles.detailValue}>{fmt(service.odometer)} km</Text></View>}
          {service.serviceName && <View style={styles.detailRow}><Text style={styles.detailLabel}>Servis</Text><Text style={styles.detailValue}>{service.serviceName}</Text></View>}
          {service.description && <View style={styles.detailRow}><Text style={styles.detailLabel}>Izoh</Text><Text style={styles.detailValue}>{service.description}</Text></View>}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}><Icon name="trash-2" size={18} color={COLORS.red600} /><Text style={styles.deleteBtnText}>O'chirish</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const EmptyState = () => (<View style={styles.emptyContainer}><Icon name="tool" size={40} color={COLORS.slate300} /><Text style={styles.emptyText}>Xizmatlar tarixi yo'q</Text></View>);

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
  listItemDate: { fontSize: 12, color: COLORS.slate400 },
  listItemCost: { fontSize: 16, fontWeight: '700', color: COLORS.red500 },
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
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.slate100 },
  typeBtnActive: { backgroundColor: COLORS.cyan500 },
  typeText: { fontSize: 12, fontWeight: '500', color: COLORS.slate600 },
  typeTextActive: { color: COLORS.white },
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
