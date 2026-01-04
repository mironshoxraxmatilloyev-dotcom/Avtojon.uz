import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, fmt, fmtDate, today } from '../../constants/theme';

const INCOME_TYPES = [
  { value: 'trip', label: 'Marshrut', icon: 'truck' },
  { value: 'rental', label: 'Ijara', icon: 'home' },
  { value: 'other', label: 'Boshqa', icon: 'gift' },
];

export default function IncomeTab({ data, onAdd, onDelete }) {
  const { incomes = [], stats = {} } = data;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  const handleSubmit = (form) => {
    const amount = form.type === 'rental' && form.rentalDays && form.rentalRate
      ? parseInt(form.rentalDays) * parseInt(form.rentalRate)
      : parseInt(form.amount) || 0;

    onAdd({
      type: form.type,
      date: form.date || today(),
      amount,
      fromCity: form.fromCity || '',
      toCity: form.toCity || '',
      cargoWeight: parseFloat(form.cargoWeight) || 0,
      clientName: form.clientName || '',
      rentalDays: parseInt(form.rentalDays) || 0,
      rentalRate: parseInt(form.rentalRate) || 0,
      description: form.description || '',
    });
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={[styles.statCard, { backgroundColor: COLORS.emerald50 }]}>
        <Text style={styles.statLabel}>Jami daromad</Text>
        <Text style={[styles.statValue, { color: COLORS.emerald600 }]}>{fmt(stats.totalIncome || 0)}</Text>
        <Text style={styles.statUnit}>so'm</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Icon name="trending-up" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Daromad qo'shish</Text>
      </TouchableOpacity>

      {/* List */}
      {incomes.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Daromadlar tarixi</Text>
          {incomes.map(inc => {
            const typeConfig = INCOME_TYPES.find(t => t.value === inc.type) || INCOME_TYPES[2];
            return (
              <TouchableOpacity
                key={inc._id}
                style={styles.listItem}
                onPress={() => setSelectedIncome(inc)}
              >
                <View style={styles.listItemLeft}>
                  <View style={styles.listItemIcon}>
                    <Icon name={typeConfig.icon} size={18} color={COLORS.emerald500} />
                  </View>
                  <Text style={styles.listItemLabel}>{typeConfig.label}</Text>
                </View>
                <Text style={styles.listItemAmount}>+{fmt(inc.amount)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      )}

      {/* Add Modal */}
      <AddIncomeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
      />

      {/* Detail Modal */}
      {selectedIncome && (
        <IncomeDetailModal
          income={selectedIncome}
          onClose={() => setSelectedIncome(null)}
          onDelete={() => {
            onDelete(selectedIncome._id);
            setSelectedIncome(null);
          }}
        />
      )}
    </View>
  );
}

const AddIncomeModal = ({ visible, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    type: 'trip',
    date: today(),
    amount: '',
    fromCity: '',
    toCity: '',
    cargoWeight: '',
    clientName: '',
    rentalDays: '',
    rentalRate: '',
    description: '',
  });

  const handleSubmit = () => {
    if (form.type === 'rental') {
      if (!form.rentalDays || !form.rentalRate) return;
    } else {
      if (!form.amount) return;
    }
    onSubmit(form);
    setForm({ type: 'trip', date: today(), amount: '', fromCity: '', toCity: '', cargoWeight: '', clientName: '', rentalDays: '', rentalRate: '', description: '' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daromad qo'shish</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daromad turi</Text>
              <View style={styles.typeGrid}>
                {INCOME_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeBtn, form.type === t.value && styles.typeBtnActive]}
                    onPress={() => setForm({ ...form, type: t.value })}
                  >
                    <Icon name={t.icon} size={16} color={form.type === t.value ? COLORS.emerald600 : COLORS.slate400} />
                    <Text style={[styles.typeText, form.type === t.value && styles.typeTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sana</Text>
              <TextInput style={styles.input} value={form.date} onChangeText={t => setForm({ ...form, date: t })} placeholder="2024-01-15" />
            </View>

            {form.type !== 'rental' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Summa (so'm) *</Text>
                <TextInput style={styles.input} value={form.amount} onChangeText={t => setForm({ ...form, amount: t })} placeholder="5000000" keyboardType="numeric" />
              </View>
            )}

            {form.type === 'trip' && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Qayerdan</Text>
                    <TextInput style={styles.input} value={form.fromCity} onChangeText={t => setForm({ ...form, fromCity: t })} placeholder="Toshkent" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Qayerga</Text>
                    <TextInput style={styles.input} value={form.toCity} onChangeText={t => setForm({ ...form, toCity: t })} placeholder="Samarqand" />
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Yuk (t)</Text>
                    <TextInput style={styles.input} value={form.cargoWeight} onChangeText={t => setForm({ ...form, cargoWeight: t })} placeholder="20" keyboardType="numeric" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Mijoz</Text>
                    <TextInput style={styles.input} value={form.clientName} onChangeText={t => setForm({ ...form, clientName: t })} placeholder="Mijoz nomi" />
                  </View>
                </View>
              </>
            )}

            {form.type === 'rental' && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Kunlar *</Text>
                    <TextInput style={styles.input} value={form.rentalDays} onChangeText={t => setForm({ ...form, rentalDays: t })} placeholder="7" keyboardType="numeric" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Kunlik narx *</Text>
                    <TextInput style={styles.input} value={form.rentalRate} onChangeText={t => setForm({ ...form, rentalRate: t })} placeholder="500000" keyboardType="numeric" />
                  </View>
                </View>
                {form.rentalDays && form.rentalRate && (
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Jami:</Text>
                    <Text style={styles.totalValue}>{fmt(parseInt(form.rentalDays || 0) * parseInt(form.rentalRate || 0))} so'm</Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Izoh</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.description} onChangeText={t => setForm({ ...form, description: t })} placeholder="Qo'shimcha ma'lumot" multiline />
            </View>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.emerald500 }]} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Qo'shish</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const IncomeDetailModal = ({ income, onClose, onDelete }) => {
  const typeConfig = INCOME_TYPES.find(t => t.value === income.type) || INCOME_TYPES[2];
  
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{typeConfig.label}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
          <View style={styles.detailContent}>
            <View style={[styles.detailAmount, { backgroundColor: COLORS.emerald50 }]}>
              <Text style={styles.detailAmountLabel}>Daromad summasi</Text>
              <Text style={[styles.detailAmountValue, { color: COLORS.emerald600 }]}>+{fmt(income.amount)}</Text>
              <Text style={styles.detailAmountUnit}>so'm</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sana</Text>
              <Text style={styles.detailValue}>{fmtDate(income.date)}</Text>
            </View>
            {income.fromCity && income.toCity && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Marshrut</Text>
                <Text style={styles.detailValue}>{income.fromCity} → {income.toCity}</Text>
              </View>
            )}
            {income.clientName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mijoz</Text>
                <Text style={styles.detailValue}>{income.clientName}</Text>
              </View>
            )}
            {income.cargoWeight > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Yuk</Text>
                <Text style={styles.detailValue}>{income.cargoWeight} t</Text>
              </View>
            )}
            {income.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Izoh</Text>
                <Text style={styles.detailValue}>{income.description}</Text>
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
};

const EmptyState = ({ onAdd }) => (
  <View style={styles.emptyContainer}>
    <Icon name="trending-up" size={40} color={COLORS.emerald300} />
    <Text style={styles.emptyTitle}>Daromad yo'q</Text>
    <Text style={styles.emptyText}>Mashina keltirgan daromadlarni qo'shing</Text>
    <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: COLORS.emerald500 }]} onPress={onAdd}>
      <Icon name="plus" size={18} color={COLORS.white} />
      <Text style={styles.emptyBtnText}>Daromad qo'shish</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 16 },
  statCard: { borderRadius: 16, padding: 16, alignItems: 'center' },
  statLabel: { fontSize: 13, color: COLORS.slate500 },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  statUnit: { fontSize: 12, color: COLORS.slate400 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.emerald500, borderRadius: 12, paddingVertical: 14, gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  listContainer: { gap: 10 },
  listTitle: { fontSize: 14, fontWeight: '500', color: COLORS.slate500 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.slate200 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.emerald50, justifyContent: 'center', alignItems: 'center' },
  listItemLabel: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  listItemAmount: { fontSize: 18, fontWeight: '700', color: COLORS.emerald600 },
  emptyContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.slate200 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.slate900, marginTop: 12 },
  emptyText: { fontSize: 14, color: COLORS.slate500, marginTop: 4, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slate900 },
  modalContent: { padding: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.slate700, marginBottom: 6 },
  input: { backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.slate900 },
  inputRow: { flexDirection: 'row', gap: 12 },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200 },
  typeBtnActive: { backgroundColor: COLORS.emerald50, borderColor: COLORS.emerald300 },
  typeText: { fontSize: 13, fontWeight: '500', color: COLORS.slate600 },
  typeTextActive: { color: COLORS.emerald600 },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.emerald50, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.emerald200 },
  totalLabel: { fontSize: 14, color: COLORS.emerald600 },
  totalValue: { fontSize: 14, fontWeight: '700', color: COLORS.emerald700 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailModal: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailContent: { padding: 16 },
  detailAmount: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  detailAmountLabel: { fontSize: 13, color: COLORS.slate500 },
  detailAmountValue: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  detailAmountUnit: { fontSize: 13, color: COLORS.slate400 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  detailLabel: { fontSize: 14, color: COLORS.slate500 },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.slate900 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.red50, margin: 16, borderRadius: 12, paddingVertical: 14, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.red600 },
});
