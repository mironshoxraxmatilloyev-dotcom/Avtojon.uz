# Avtojon Mobile App

Fleet Management mobile ilovasi - React Native CLI bilan qurilgan.

## Talablar

- Node.js 18+
- Java JDK 17
- Android Studio (Android SDK)
- React Native CLI

## O'rnatish

```bash
cd apps/mobile
npm install
```

## Ishga tushirish

### Metro bundler
```bash
npm start
```

### Android
```bash
npm run android
```

### APK build
```bash
npm run build:android
```

APK fayl: `android/app/build/outputs/apk/release/app-release.apk`

## Loyiha strukturasi

```
src/
├── App.js                 # Asosiy app komponenti
├── assets/               # Rasmlar, fontlar
├── components/           # Qayta ishlatiladigan komponentlar
│   ├── tabs/            # VehicleDetail tablari
│   ├── AddVehicleModal.js
│   └── VehicleCard.js
├── constants/           # Ranglar, stillar
├── navigation/          # React Navigation
├── screens/             # Ekranlar
│   ├── LoginScreen.js
│   ├── FleetDashboardScreen.js
│   ├── VehicleDetailScreen.js
│   ├── StatsScreen.js
│   ├── AlertsScreen.js
│   └── ProfileScreen.js
├── services/            # API
└── store/               # Zustand state
```

## Funksiyalar

- ✅ Login sahifasi
- ✅ Fleet Dashboard (mashinalar ro'yxati)
- ✅ Mashina qo'shish
- ✅ Mashina tafsilotlari (6 ta tab):
  - Umumiy (Summary) - statistika
  - Daromad (Income) - marshrut, ijara
  - Yoqilg'i (Fuel) - zapravka
  - Moy (Oil) - moy almashtirish
  - Shina (Tires) - shinalar
  - Xizmat (Services) - texnik xizmat
- ✅ Statistika sahifasi
- ✅ Diqqat talab mashinalar
- ✅ Profil va chiqish
