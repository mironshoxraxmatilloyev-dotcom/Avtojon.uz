# 🚛 Avtojon.uz

Yuk tashish kompaniyalari uchun to'liq boshqaruv tizimi.

## 📋 Tizim Imkoniyatlari

### 👨‍💼 SuperAdmin Panel
- Biznesmenlar va foydalanuvchilarni boshqarish
- Obuna tizimi (trial, pro)
- SMS Gateway orqali xabar yuborish
- Umumiy statistika

### 🏢 Biznesmen Panel (Dashboard)
- Shofyorlarni boshqarish
- Mashrutlarni ochish/yopish
- Xarajatlarni kuzatish
- Real-time yangilanishlar

### 🚗 Fleet Panel (Avtopark)
- Mashinalarni boshqarish
- Yoqilg'i hisobi
- Moy almashtirish tarixi
- Shina nazorati
- Texnik xizmat
- Daromad/xarajat hisoboti
- Ovozli kiritish (AI)

### 📱 Haydovchi Panel
- Faol marshrutni ko'rish
- Xarajat qo'shish
- GPS tracking

## 🛠️ Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Backend | Node.js, Express, MongoDB, Socket.io |
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Android | Kotlin, Jetpack Compose |
| AI | Groq (Whisper + LLM) |
| To'lov | Payme |

## 📁 Loyiha Strukturasi

```
avtojon/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── config/         # DB, Redis config
│   │   │   ├── middleware/     # Auth, rate limiter
│   │   │   ├── models/         # Mongoose models
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic (voiceAI)
│   │   │   └── utils/          # Helpers
│   │   └── package.json
│   │
│   ├── web/                    # Frontend (React)
│   │   ├── src/
│   │   │   ├── components/     # UI komponentlar
│   │   │   │   ├── admin/      # Admin panel
│   │   │   │   ├── drivers/    # Shofyor
│   │   │   │   ├── driverPanel/# Haydovchi panel
│   │   │   │   ├── fleet/      # Avtopark
│   │   │   │   ├── layout/     # Layout
│   │   │   │   ├── superadmin/ # SuperAdmin
│   │   │   │   └── ui/         # Umumiy UI
│   │   │   ├── pages/          # Sahifalar
│   │   │   ├── services/       # API, Socket
│   │   │   └── store/          # Zustand
│   │   └── package.json
│   │
│   └── android-sms-gateway/    # SMS Gateway App
│       └── app/src/main/
│           └── java/.../
│               ├── MainActivity.kt
│               ├── SmsGatewayService.kt
│               └── BootReceiver.kt
│
├── deploy/                     # Deploy skriptlari
│   ├── deploy.sh
│   ├── nginx.conf
│   └── ecosystem.config.js
│
├── docs/                       # Hujjatlar
│   ├── SMS_GATEWAY_GUIDE.md
│   └── ...
│
├── scripts/                    # Utility skriptlar
│
├── .env                        # Environment (root)
├── .env.example
├── package.json                # Monorepo root
└── README.md
```

## 🚀 O'rnatish

### 1. Dependencylar

```bash
npm install
```

### 2. Environment

```bash
# Root .env
cp .env.example .env

# API .env
cp apps/api/.env.example apps/api/.env
```

### 3. Environment Variables

```env
# apps/api/.env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/avtojon
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
GROQ_API_KEY=your-groq-key
PAYME_MERCHANT_ID=your-merchant-id
PAYME_KEY=your-payme-key
SUPER_ADMIN_LOGIN=super_admin
SUPER_ADMIN_PASSWORD=YourPassword123
```

## 🏃 Ishga Tushirish

```bash
# Development (API + Web)
npm run dev

# Faqat API
npm run api:dev

# Faqat Web
npm run web:dev
```

## 🌐 Deploy

```bash
# Serverga deploy
./deploy/deploy.sh
```

## 📱 Android SMS Gateway

SMS Gateway app haqida to'liq ma'lumot: [docs/SMS_GATEWAY_GUIDE.md](docs/SMS_GATEWAY_GUIDE.md)

```bash
# APK build
cd apps/android-sms-gateway
./gradlew assembleDebug
```

## 🔐 Xavfsizlik

- JWT Access/Refresh token
- Rate limiting
- Input validation (Joi)
- HTTPS (production)
- Helmet (security headers)

## 📞 Aloqa

- Website: https://avtojon.uz
- Telegram: @avtojon_support

## 📄 Litsenziya

MIT
