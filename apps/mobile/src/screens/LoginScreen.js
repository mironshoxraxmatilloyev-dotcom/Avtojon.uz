import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';
import { COLORS, SHADOWS } from '../constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const passwordRef = useRef(null);
  
  const { login, loading } = useAuthStore();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username kiriting';
    else if (username.length < 3) e.username = 'Kamida 3 ta belgi';
    if (!password.trim()) e.password = 'Parol kiriting';
    else if (password.length < 6) e.password = 'Kamida 6 ta belgi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    const result = await login(username, password);
    if (!result.success) {
      Alert.alert('Xatolik', result.message || 'Login yoki parol noto\'g\'ri');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/logo.jpg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <View style={styles.brandName}>
              <Text style={styles.brandAvto}>avto</Text>
              <Text style={styles.brandJon}>JON</Text>
            </View>
            <Text style={styles.subtitle}>Fleet Management</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Xush kelibsiz!</Text>
            <Text style={styles.descText}>Hisobingizga kiring</Text>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                <Icon name="user" size={20} color={errors.username ? COLORS.red500 : COLORS.slate400} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    if (errors.username) setErrors(e => ({ ...e, username: null }));
                  }}
                  placeholder="username"
                  placeholderTextColor={COLORS.slate400}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.username && (
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={12} color={COLORS.red500} />
                  <Text style={styles.errorText}>{errors.username}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parol</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Icon name="lock" size={20} color={errors.password ? COLORS.red500 : COLORS.slate400} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errors.password) setErrors(e => ({ ...e, password: null }));
                  }}
                  placeholder="••••••"
                  placeholderTextColor={COLORS.slate400}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={COLORS.slate400} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={12} color={COLORS.red500} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Kirish</Text>
                  <Icon name="arrow-right" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2024 avtoJON. Barcha huquqlar himoyalangan.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  brandAvto: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  brandJon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e40af', // to'q ko'k
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.lg,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: COLORS.slate500,
    marginBottom: 24,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: COLORS.red500,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.slate900,
    marginLeft: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red500,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue600,
    borderRadius: 12,
    height: 52,
    marginTop: 8,
    gap: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 32,
  },
});
