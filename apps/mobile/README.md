# avtoJON Mobile App

React Native bilan yaratilgan avtoJON mobil ilovasi.

## Talablar

- Node.js 18+
- React Native CLI
- Android Studio (Android uchun)
- Xcode (iOS uchun, faqat macOS)

## O'rnatish

### 1. Android SDK o'rnatish (Linux/Ubuntu)

```bash
# Android Studio yuklab olish
# https://developer.android.com/studio

# Environment variables qo'shish (~/.bashrc yoki ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Qayta yuklash
source ~/.bashrc
```

### 2. Dependencies o'rnatish

```bash
cd apps/mobile
npm install
```

### 3. Android uchun build

```bash
# Metro bundler ishga tushirish
npm start

# Yangi terminalda Android app ishga tushirish
npm run android
```

### 4. APK yaratish

```bash
cd android
./gradlew assembleRelease
```

APK fayl: `android/app/build/outputs/apk/release/app-release.apk`

## Loyiha strukturasi

```
apps/mobile/
├── src/
│   ├── assets/          # Rasmlar, fontlar
│   │   └── logo.jpg     # App logosi
│   ├── navigation/      # Navigation
│   │   └── MainTabs.tsx
│   ├── screens/         # Ekranlar
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── VehiclesScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/        # API
│   │   └── api.ts
│   └── store/           # State management
│       └── authStore.tsx
├── App.tsx              # Root component
├── index.js             # Entry point
└── package.json
```

## API konfiguratsiya

`src/services/api.ts` faylida API URL ni o'zgartiring:

```typescript
// Production
const API_URL = 'https://avtojon.uz/api';

// Development (local)
const API_URL = 'http://192.168.1.100:3000/api';
```

## Xususiyatlar

- ✅ Login/Register
- ✅ Mashinalar ro'yxati
- ✅ Statistika
- ✅ Profil
- 🔄 Yoqilg'i qo'shish
- 🔄 Xizmat qo'shish
- 🔄 Push notifications
- 🔄 Offline rejim

## Aloqa

- Telegram: @avtojon_support
- Website: https://avtojon.uz
