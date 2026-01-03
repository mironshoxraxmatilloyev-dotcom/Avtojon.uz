import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#4f46e5', '#7c3aed', '#ec4899']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleWhite}>avto</Text>
          <Text style={styles.titleYellow}>JON</Text>
        </View>
        <Text style={styles.subtitle}>Yuk tashish platformasi</Text>
      </View>
      
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleWhite: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  titleYellow: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fbbf24',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});
