import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phone || !password) {
      Alert.alert('Xatolik', 'Barcha maydonlarni to\'ldiring');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    const success = await register({ fullName, phone, password, companyName });
    setLoading(false);

    if (!success) {
      Alert.alert('Xatolik', 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Orqaga</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleWhite}>avto</Text>
            <Text style={styles.titleYellow}>JON</Text>
          </View>
          <Text style={styles.subtitle}>Biznesingizni yangi bosqichga olib chiqing</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
        <Text style={styles.welcomeText}>Ro'yxatdan o'ting</Text>
        <Text style={styles.descText}>Bir necha daqiqada hisob yarating</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>To'liq ism</Text>
          <TextInput
            style={styles.input}
            placeholder="Ism Familiya"
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Telefon raqam</Text>
          <TextInput
            style={styles.input}
            placeholder="+998 90 123 45 67"
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Kompaniya nomi (ixtiyoriy)</Text>
          <TextInput
            style={styles.input}
            placeholder="Kompaniya nomi"
            placeholderTextColor="#94a3b8"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Parol</Text>
          <TextInput
            style={styles.input}
            placeholder="Kamida 6 ta belgi"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ro'yxatdan o'tish</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.loginText}>
            Hisobingiz bormi? <Text style={styles.loginTextBold}>Kirish</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleWhite: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  titleYellow: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fbbf24',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginTextBold: {
    color: '#10b981',
    fontWeight: '600',
  },
});
