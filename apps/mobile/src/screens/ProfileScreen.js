import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';
import { COLORS, SHADOWS } from '../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobdan chiqmoqchimisiz?',
      [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Chiqish', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Foydalanuvchi'}</Text>
            <Text style={styles.userPhone}>{user?.phone || user?.username}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          <MenuItem icon="user" label="Shaxsiy ma'lumotlar" />
          <MenuItem icon="bell" label="Bildirishnomalar" />
          <MenuItem icon="help-circle" label="Yordam" />
          <MenuItem icon="info" label="Ilova haqida" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={20} color={COLORS.red600} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Versiya 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIcon}>
        <Icon name={icon} size={18} color={COLORS.slate600} />
      </View>
      <Text style={styles.menuItemLabel}>{label}</Text>
    </View>
    <Icon name="chevron-right" size={18} color={COLORS.slate400} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate200 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate900 },
  content: { padding: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, ...SHADOWS.md },
  avatar: { width: 60, height: 60, borderRadius: 16, backgroundColor: COLORS.indigo500, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  userInfo: { marginLeft: 16 },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.slate900 },
  userPhone: { fontSize: 14, color: COLORS.slate500, marginTop: 4 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', marginBottom: 16, ...SHADOWS.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.slate100, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuItemLabel: { fontSize: 15, color: COLORS.slate700 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.red50, borderRadius: 12, paddingVertical: 14, gap: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red600 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.slate400, marginTop: 24 },
});
