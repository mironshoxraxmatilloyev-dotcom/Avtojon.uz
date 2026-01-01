# Avtojon SMS Gateway - Android App

Bu Android app serverdan SMS buyruqlarini qabul qilib, telefon SIM-kartasi orqali yuboradi.

## Qanday ishlaydi?

1. App har **5 sekundda** serverdan navbatni tekshiradi
2. Agar yangi SMS bo'lsa - oladi va SIM orqali yuboradi
3. SMS'lar orasida **2 sekund** kutadi (spam bo'lmasligi uchun)
4. Yuborish natijasini serverga qaytaradi

## O'rnatish

### 1. Android Studio'da ochish

1. Android Studio'ni oching
2. File > Open > `apps/android-sms-gateway` papkasini tanlang
3. Gradle sync tugashini kuting

### 2. APK yaratish

1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. APK fayl: `app/build/outputs/apk/debug/app-debug.apk`

### 3. Telefonga o'rnatish

1. APK faylni telefonga ko'chiring
2. "Noma'lum manbalardan o'rnatish" ga ruxsat bering
3. APK'ni o'rnating

## Sozlash

1. App'ni oching
2. **Server URL**: `https://api.avtojon.uz` (yoki sizning server)
3. **Gateway Token**: SuperAdmin paneldan oling
4. "Ulash" tugmasini bosing
5. SMS permission bering

## SuperAdmin panelda

1. SuperAdmin panelga kiring
2. "SMS Gateway" bo'limini oching
3. "Yangi Gateway qo'shish" bosing
4. Token'ni Android app'ga kiriting

## Texnik ma'lumotlar

- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Til**: Kotlin + Jetpack Compose
- **Network**: Retrofit + OkHttp

## Permissions

```xml
SEND_SMS - SMS yuborish
INTERNET - Server bilan aloqa
RECEIVE_BOOT_COMPLETED - Telefon qayta ishga tushganda auto-start
FOREGROUND_SERVICE - Background'da ishlash
POST_NOTIFICATIONS - Notification ko'rsatish
```

## Rate Limits

- Kunlik limit: 500 SMS (sozlanishi mumkin)
- SMS orasida: 2 sekund kutish
- Polling interval: 5 sekund
