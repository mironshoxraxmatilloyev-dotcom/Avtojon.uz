# avtoJON Mobile App

React Native da qurilgan avtoJON Fleet Management ilovasi.

## Xususiyatlar

- Login sahifasi (app ochilganda darhol login)
- Fleet Dashboard - barcha mashinalar ro'yxati
- Statistika - moliyaviy tahlil va mashinalar reytingi
- Diqqat - ogohlantirishlar va xizmat kerak bo'lgan mashinalar
- Profil - foydalanuvchi ma'lumotlari va sozlamalar
- Mashina qo'shish
- Mashina tafsilotlari:
  - Umumiy ko'rinish (daromad/xarajat)
  - Daromad qo'shish
  - Yoqilg'i qo'shish
  - Moy almashtirish
  - Shina qo'shish
  - Xizmat qo'shish

## O'rnatish

```bash
cd apps/mobile
npm install
```

## Ishga tushirish

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

## APK yaratish

```bash
cd android
./gradlew assembleRelease
```

APK fayl: `android/app/build/outputs/apk/release/app-release.apk`

## Texnologiyalar

- React Native 0.74
- React Navigation 6
- Zustand (state management)
- Axios (API calls)
- TypeScript

## Struktura

```
src/
├── components/
│   └── Icons.tsx          # SVG iconlar
├── constants/
│   └── theme.ts           # Ranglar va konstantalar
├── navigation/
│   └── AppNavigator.tsx   # Navigation konfiguratsiyasi
├── screens/
│   ├── LoginScreen.tsx
│   ├── FleetDashboardScreen.tsx
│   ├── StatsScreen.tsx
│   ├── AlertsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── VehicleDetailScreen.tsx
│   └── AddVehicleScreen.tsx
├── services/
│   └── api.ts             # API konfiguratsiyasi
└── store/
    └── authStore.ts       # Auth state
```
