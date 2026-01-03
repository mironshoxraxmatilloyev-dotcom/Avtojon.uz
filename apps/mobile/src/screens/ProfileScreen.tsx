import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Chiqish', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: 'user', label: 'Profil ma\'lumotlari', screen: 'EditProfile' },
    { icon: 'bell', label: 'Bildirishnomalar', screen: 'Notifications' },
    { icon: 'shield', label: 'Xavfsizlik', screen: 'Security' },
    { icon: 'help-circle', label: 'Yordam', screen: 'Help' },
    { icon: 'info', label: 'Ilova haqida', screen: 'About' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../assets/logo.jpg')}
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Foydalanuvchi'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+998 XX XXX XX XX'}</Text>
            {user?.companyName && (
              <View style={styles.companyBadge}>
                <Icon name="briefcase" size={12} color="#4f46e5" />
                <Text style={styles.companyName}>{user.companyName}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="edit-2" size={18} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionIcon}>
              <Icon name="award" size={20} color="#f59e0b" />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>Trial</Text>
              <Text style={styles.subscriptionDesc}>30 kun bepul sinov</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeText}>Pro ga o'tish</Text>
            <Icon name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={20} color="#64748b" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-right" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>avtoJON v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  companyName: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  subscriptionDesc: {
    fontSize: 13,
    color: '#b45309',
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 12,
  },
  upgradeText: {
    color: '#fff',
    fontWeight: '700',
    marginRight: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 100,
  },
});
