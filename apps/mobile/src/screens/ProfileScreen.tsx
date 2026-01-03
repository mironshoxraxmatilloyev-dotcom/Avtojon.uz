import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Haqiqatan ham chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'Foydalanuvchi'}</Text>
        <Text style={styles.role}>{user?.role === 'businessman' ? 'Tadbirkor' : user?.role}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{user?.role || '-'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  content: { flex: 1, alignItems: 'center', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },
  username: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  role: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginTop: 32 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  logoutBtn: { backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginTop: 32 },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
