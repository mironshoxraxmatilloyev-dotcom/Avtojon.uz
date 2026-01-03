# Avtojon Mobile App

React Native da qurilgan Avtojon Fleet Management ilovasi.

## O'rnatish

```bash
cd apps/mobile
npm install
```

## Ishga tushirish

### Android
```bash
# Metro bundler
npm start

# Boshqa terminalda
npm run android
```

### APK yaratish

```bash
cd android
./gradlew assembleRelease
```

APK fayl: `android/app/build/outputs/apk/release/app-release.apk`

## Xususiyatlar

- ✅ Login (username/parol)
- ✅ Token AsyncStorage da saqlanadi (uzoq vaqt login qilmaslik)
- ✅ Avtopark ro'yxati
- ✅ Mashina qo'shish
- ✅ Mashina tafsilotlari (Summary, Daromad, Yoqilg'i, Moy, Shina, Xizmat)
- ✅ Moliyaviy analitika
- ✅ Profil va chiqish

## Texnologiyalar

- React Native 0.74
- React Navigation 6
- Zustand (state management)
- Axios (API)
- AsyncStorage (token saqlash)
