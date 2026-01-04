import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const WAVE_COUNT = 30;

export default function VoiceRecorder({ visible, onClose, onResult, context = 'vehicle' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const waveAnims = useRef([...Array(WAVE_COUNT)].map(() => new Animated.Value(0.3))).current;
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Wave animation
  useEffect(() => {
    if (isRecording) {
      const animations = waveAnims.map((anim, i) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 100 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 100 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        );
      });
      Animated.parallel(animations).start();
    } else {
      waveAnims.forEach(anim => anim.setValue(0.3));
    }
  }, [isRecording]);

  // Pulse animation for mic button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Mikrofon ruxsati',
            message: 'Ovoz yozish uchun mikrofon ruxsati kerak',
            buttonPositive: 'Ruxsat berish',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Xatolik', 'Mikrofon ruxsati berilmagan');
      return;
    }
    setIsRecording(true);
    // TODO: Implement actual recording with react-native-audio-recorder-player
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setProcessing(false);
      // Mock result based on context
      const mockResults = {
        vehicle: { type: 'vehicle', plateNumber: '01A123BC', brand: 'Chevrolet', model: 'Cobalt' },
        fuel: { type: 'fuel', amount: 150000, liters: 40, pricePerLiter: 3750 },
        oil: { type: 'oil', brand: 'Mobil', cost: 450000, mileage: 125000 },
        income: { type: 'income', amount: 500000, description: 'Yuk tashish' },
        service: { type: 'service', serviceType: 'brake', cost: 200000, description: 'Tormoz kolodkasi' },
      };
      onResult?.(mockResults[context] || mockResults.vehicle);
      onClose();
    }, 1500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContextText = () => {
    const texts = {
      vehicle: 'Mashina ma\'lumotlarini ayting...',
      fuel: 'Yoqilg\'i ma\'lumotlarini ayting...',
      oil: 'Moy almashtirish haqida ayting...',
      income: 'Daromad haqida ayting...',
      service: 'Xizmat haqida ayting...',
      tire: 'Shina haqida ayting...',
    };
    return texts[context] || 'Ma\'lumotlarni ayting...';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={24} color={COLORS.slate400} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>
            {processing ? 'Qayta ishlanmoqda...' : isRecording ? 'Tinglayapman...' : 'Ovoz bilan qo\'shish'}
          </Text>
          <Text style={styles.subtitle}>{getContextText()}</Text>

          {/* Wave visualization */}
          <View style={styles.waveContainer}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveLine,
                  {
                    transform: [{ scaleY: anim }],
                    backgroundColor: isRecording ? COLORS.indigo500 : COLORS.slate300,
                  },
                ]}
              />
            ))}
          </View>

          {/* Timer */}
          {isRecording && (
            <Text style={styles.timer}>{formatTime(recordTime)}</Text>
          )}

          {/* Mic button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                isRecording && styles.micBtnRecording,
                processing && styles.micBtnProcessing,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={processing}
            >
              <Icon
                name={processing ? 'loader' : isRecording ? 'square' : 'mic'}
                size={32}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Instructions */}
          <Text style={styles.instruction}>
            {processing
              ? 'Iltimos kuting...'
              : isRecording
              ? 'To\'xtatish uchun bosing'
              : 'Boshlash uchun bosing'}
          </Text>

          {/* Examples */}
          {!isRecording && !processing && (
            <View style={styles.examples}>
              <Text style={styles.exampleTitle}>Misol:</Text>
              {context === 'vehicle' && (
                <Text style={styles.exampleText}>"01A123BC raqamli Cobalt mashina qo'sh"</Text>
              )}
              {context === 'fuel' && (
                <Text style={styles.exampleText}>"40 litr benzin 150 ming so'mga quyildim"</Text>
              )}
              {context === 'oil' && (
                <Text style={styles.exampleText}>"Mobil moy 450 mingga almashtirildi, probeg 125 ming"</Text>
              )}
              {context === 'income' && (
                <Text style={styles.exampleText}>"Bugun 500 ming daromad qildim yuk tashishdan"</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 40,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.slate900,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 8,
    textAlign: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginVertical: 24,
    gap: 3,
  },
  waveLine: {
    width: 4,
    height: 60,
    borderRadius: 2,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.indigo500,
    marginBottom: 16,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.indigo500,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  micBtnRecording: {
    backgroundColor: COLORS.red500,
  },
  micBtnProcessing: {
    backgroundColor: COLORS.slate400,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 16,
  },
  examples: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    width: '100%',
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate500,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontStyle: 'italic',
  },
});
