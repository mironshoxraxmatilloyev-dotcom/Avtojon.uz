# Avtojon SMS Gateway - Android App

Bu Android app serverdan SMS buyruqlarini qabul qilib, telefon SIM-kartasi orqali yuboradi.

## 📱 Qanday ishlaydi?

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SuperAdmin │────▶│   Server    │────▶│ Android App │
│  Web Panel  │     │   (API)     │     │ (Bu app)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        📱 SMS yuborish
                                        (SIM karta orqali)
```

1. SuperAdmin web panelda SMS yuboradi
2. Server SMS ni navbatga qo'shadi
3. Android app har **5 sekundda** navbatni tekshiradi
4. Yangi SMS bo'lsa - SIM orqali yuboradi
5. Natijani serverga qaytaradi

## 🚀 Tez Boshlash

### 1-qadam: APK o'rnatish

APK faylni telefoningizga o'rnating. APK ni GitHub Releases dan yoki qo'lda build qilib oling.

### 2-qadam: Ruxsatlar berish

App quyidagi ruxsatlarni so'raydi - barchasiga ruxsat bering:
- ✅ SMS yuborish
- ✅ Bildirishnomalar
- ✅ Fonda ishlash

### 3-qadam: Sozlash

1. App'ni oching
2. **Server URL** kiriting: `https://avtojon.uz`
3. **Gateway Token** kiriting (SuperAdmin paneldan oling)
4. **"Ulanish"** tugmasini bosing
5. **"Xizmatni boshlash"** tugmasini bosing

### 4-qadam: Token olish

1. https://avtojon.uz/super-admin ga kiring
2. "SMS Gateway" menyusini tanlang
3. "Gateway'lar" tabini oching
4. "Yangi Gateway qo'shish" bosing
5. Nom kiriting va yarating
6. Ko'rsatilgan **TOKEN** ni nusxalang

## 🛠️ O'zingiz Build Qilish

### Android Studio'da

1. Android Studio'ni oching
2. File > Open > `apps/android-sms-gateway` papkasini tanlang
3. Gradle sync tugashini kuting
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. APK: `app/build/outputs/apk/debug/app-debug.apk`

### Command line'da

```bash
cd apps/android-sms-gateway
./gradlew assembleDebug
```

## 📋 Texnik Ma'lumotlar

| Parametr | Qiymat |
|----------|--------|
| Min SDK | 24 (Android 7.0) |
| Target SDK | 34 (Android 14) |
| Til | Kotlin |
| UI | Jetpack Compose |
| Network | Retrofit + OkHttp |

### Permissions

```xml
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Sozlamalar

| Sozlama | Qiymat | Tavsif |
|---------|--------|--------|
| Poll interval | 5 sek | Navbatni tekshirish oralig'i |
| SMS delay | 2 sek | SMS'lar orasidagi kutish |
| Heartbeat | 30 sek | Server'ga "tirik" signal |
| Kunlik limit | 500 | Maksimal SMS soni |

## 🔧 Muammolarni Hal Qilish

### "Server bilan bog'lanib bo'lmadi"

- Internet ulanishini tekshiring
- Server URL to'g'riligini tekshiring (`https://` bilan)
- Token to'g'riligini tekshiring

### "SMS yuborilmadi"

- SMS ruxsati berilganligini tekshiring
- SIM karta balansini tekshiring
- Telefon aloqa zonasida ekanligini tekshiring

### App o'chirilgandan keyin ishlamayapti

- "Xizmatni boshlash" tugmasini qayta bosing
- Battery optimization'dan app'ni chiqaring
- Auto-start ruxsatini bering (Xiaomi, Huawei uchun)

## 📁 Fayl Strukturasi

```
app/src/main/
├── java/uz/avtojon/smsgateway/
│   ├── MainActivity.kt        # Asosiy UI
│   ├── SmsGatewayService.kt   # Background service
│   └── BootReceiver.kt        # Auto-start
├── res/
│   ├── values/
│   │   ├── strings.xml        # Matnlar
│   │   └── themes.xml         # Tema
│   └── xml/
│       └── network_security_config.xml
└── AndroidManifest.xml        # App konfiguratsiyasi
```

## 📞 Yordam

Muammo bo'lsa: @avtojon_support (Telegram)
