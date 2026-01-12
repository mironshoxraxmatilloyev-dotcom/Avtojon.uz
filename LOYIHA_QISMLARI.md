# 🚀 AVTOJON LOYIHASI - QISMLAR VA TUSHUNTIRISH

## 📋 UMUMIY STRUKTURA

Avtojon loyihasi **4 ta asosiy panel** va **1 ta landing page**dan iborat:

```
AVTOJON PLATFORMASI
│
├── 🌐 Landing Page (/)                    - Ommaviy sahifa
├── 👑 Super Admin Panel (/super-admin)    - Platformani boshqarish
├── 💼 Business Panel (/dashboard)         - Yuk tashish kompaniyalari
├── 🚛 Driver Panel (/driver)              - Haydovchilar (mobil)
└── 🚗 Fleet Panel (/fleet)                - Oddiy mashina egalari
```

---

## 1️⃣ LANDING PAGE (/)

**Maqsad:** Yangi foydalanuvchilarni jalb qilish va ro'yxatdan o'tkazish

**Fayllar:**
- `apps/web/src/pages/Landing.jsx`

**Imkoniyatlar:**
- ✅ Platformani tanishtirish
- ✅ Funksiyalarni ko'rsatish
- ✅ Narxlarni ko'rsatish
- ✅ Ro'yxatdan o'tish tugmasi
- ✅ Android/iOS yuklab olish
- ✅ Video qo'llanma (kelgusida)

**Kim ko'radi:** Barcha tashrif buyuruvchilar (login qilmagan)

---

## 2️⃣ SUPER ADMIN PANEL (/super-admin)

**Maqsad:** Butun platformani boshqarish va monitoring qilish

**Role:** `super_admin`

**Fayllar:**
- `apps/web/src/pages/superadmin/SuperAdminPanel.jsx`
- `apps/api/src/routes/superAdmin.routes.js`

**Imkoniyatlar:**
- ✅ **Biznesmenlar boshqaruvi**
  - Yangi biznesmen yaratish
  - Biznesmenlarni ko'rish/tahrirlash/o'chirish
  - Obuna holatini ko'rish
  
- ✅ **Statistika**
  - Jami biznesmenlar soni
  - Jami haydovchilar soni
  - Jami reyslar soni
  - Platformadagi faollik

- ✅ **Monitoring**
  - Obuna muddati tugagan biznesmenlar
  - Faol/nofaol foydalanuvchilar
  - Tizim holati

**Kim kiradi:** Faqat Super Admin (siz)

**Login ma'lumotlari:** `.env` faylida `SUPER_ADMIN_LOGIN` va `SUPER_ADMIN_PASSWORD`

---

## 3️⃣ BUSINESS PANEL (/dashboard)

**Maqsad:** Yuk tashish kompaniyalarini boshqarish

**Role:** `business`

**Fayllar:**
- `apps/web/src/pages/Dashboard.jsx`
- `apps/web/src/pages/Drivers.jsx`
- `apps/web/src/pages/Flights.jsx`
- `apps/web/src/pages/Reports.jsx`
- `apps/api/src/models/Businessman.js`

**Imkoniyatlar:**

### 📊 Dashboard
- Real-time statistika
- Jonli xarita (GPS tracking)
- Faol marshrutlar
- Tezkor amallar

### 🚛 Haydovchilar
- Haydovchi qo'shish/tahrirlash/o'chirish
- GPS tracking (real-time joylashuv)
- Ish tarixi
- Oylik hisob-kitob
- SMS yuborish

### ✈️ Reyslar (Flights)
- Yangi marshrut yaratish
- Buyurtmalar (yuk olish/topshirish)
- Xarajatlar kiritish (yoqilg'i, ovqat, yo'l)
- Xalqaro reyslar (ko'p valyuta)
- Ovozli kiritish (AI)
- Marshrutni yopish va hisob-kitob

### 📈 Hisobotlar
- Moliyaviy hisobot (daromad, xarajat, foyda)
- Haydovchi hisoboti
- Yoqilg'i hisoboti
- Excel eksport

**Kim kiradi:** Super Admin tomonidan yaratilgan biznesmenlar

**Qanday yaratiladi:** Super Admin `/super-admin` panelidan "Yangi biznesmen" tugmasi orqali

**Narxlash:** 30,000 so'm/mashina/oy

---

## 4️⃣ DRIVER PANEL (/driver)

**Maqsad:** Haydovchilar uchun mobil panel

**Role:** `driver`

**Fayllar:**
- `apps/web/src/pages/driver/DriverHome.jsx`
- `apps/api/src/models/Driver.js`

**Imkoniyatlar:**
- ✅ **Faol marshrut**
  - Joriy reys ma'lumotlari
  - Buyurtmalar ro'yxati
  - Yo'nalish

- ✅ **Xarajat kiritish**
  - Yoqilg'i
  - Ovqat
  - Yo'l to'lovi
  - Boshqa xarajatlar
  - Ovozli kiritish

- ✅ **Xarajat tasdiqlash**
  - Biznesmen qo'shgan xarajatlarni tasdiqlash
  - Rad etish (izoh bilan)

- ✅ **GPS yuborish**
  - Background tracking
  - Real-time joylashuv

- ✅ **Tarix**
  - O'tgan marshrutlar
  - Xarajatlar tarixi

**Kim kiradi:** Biznesmen tomonidan qo'shilgan haydovchilar

**Qanday yaratiladi:** Biznesmen `/dashboard/drivers` sahifasidan "Yangi haydovchi" tugmasi orqali

**Mobil:** Android/iOS ilova (Capacitor)

---

## 5️⃣ FLEET PANEL (/fleet)

**Maqsad:** Oddiy mashina egalari uchun avtopark boshqaruvi

**Role:** `admin`

**Fayllar:**
- `apps/web/src/pages/fleet/FleetDashboard.jsx`
- `apps/web/src/pages/fleet/VehicleDetailPanel.jsx`
- `apps/api/src/models/Vehicle.js`
- `apps/api/src/models/VehicleMaintenance.js`

**Imkoniyatlar:**

### 🚗 Mashinalar
- Mashina qo'shish/tahrirlash/o'chirish
- Mashina ma'lumotlari (raqam, marka, yil)
- Spidometr (odometer)
- Holat (normal, warning, critical)

### ⛽ Yoqilg'i (Fuel)
- Yoqilg'i quyish yozuvi
- Litr/narx
- Sarflanish hisobi (1 km ga)
- Grafik va statistika
- Ovozli kiritish

### 🛢️ Moy (Oil)
- Moy almashtirish yozuvi
- Moy brendi va turi
- Keyingi almashtirish muddati
- Ogohlantirish (warning/critical)
- Qolgan km

### 🛞 Shina (Tires)
- Shina ma'lumotlari
- Almashtirish tarixi
- Yurgan masofa
- Eslatma tizimi

### 🔧 Texnik xizmat (Services)
- Ta'mir yozuvi
- Texnik xizmat (TO-1, TO-2)
- Xarajat va sana
- Rejalashtirilgan xizmatlar

### 💰 Daromad (Income)
- Daromad kiritish (taksi, ijara)
- Kunlik/oylik statistika
- Foyda/zarar hisobi

### 📊 Umumiy statistika (Summary)
- Jami daromad
- Jami xarajat
- Sof foyda
- Grafik tahlil

**Kim kiradi:** `/register` orqali ro'yxatdan o'tganlar

**Narxlash:** 20,000 so'm/mashina/oy

---

## 🔐 FOYDALANUVCHI ROLLARI

| Role | Panel | Yaratuvchi | Narx |
|------|-------|------------|------|
| `super_admin` | Super Admin | Dasturchi (siz) | - |
| `business` | Business Panel | Super Admin | 30,000/mashina/oy |
| `driver` | Driver Panel | Biznesmen | - |
| `admin` | Fleet Panel | O'zi (register) | 20,000/mashina/oy |

---

## 🔄 FOYDALANUVCHI SAYOHATI

### Super Admin sayohati:
```
1. Login (/login) → super_admin
2. Super Admin Panel (/super-admin)
3. Yangi biznesmen yaratish
4. Platformani monitoring qilish
```

### Biznesmen sayohati:
```
1. Super Admin tomonidan yaratiladi
2. Login (/login) → business
3. Business Panel (/dashboard)
4. Haydovchi qo'shish
5. Marshrut yaratish
6. Real-time tracking
7. Hisobotlar olish
```

### Haydovchi sayohati:
```
1. Biznesmen tomonidan qo'shiladi
2. SMS orqali login ma'lumotlari
3. Login (/login) → driver
4. Driver Panel (/driver)
5. Faol marshrut ko'rish
6. Xarajat kiritish
7. GPS yuborish
```

### Fleet foydalanuvchi sayohati:
```
1. Register (/register) → admin
2. SMS orqali tasdiqlash
3. Login (/login) → admin
4. Fleet Panel (/fleet)
5. Mashina qo'shish
6. Yoqilg'i/moy/xizmat kiritish
7. Statistika ko'rish
```

---

## 📱 MOBIL ILOVALAR

### Android SMS Gateway
**Maqsad:** SMS yuborish uchun

**Fayl:** `apps/android-sms-gateway/`

**Ishlash prinsipi:**
1. Biznesmen telefoniga o'rnatiladi
2. Backend bilan bog'lanadi
3. SMS yuborish buyrug'ini oladi
4. Haydovchilarga SMS yuboradi

### Driver Mobile App
**Maqsad:** Haydovchilar uchun mobil ilova

**Texnologiya:** Capacitor (Android/iOS)

**Fayl:** `apps/web/` (bir xil kod, mobil build)

---

## 🔧 BACKEND STRUKTURA

```
apps/api/src/
├── models/
│   ├── User.js              - Fleet foydalanuvchilar (admin)
│   ├── Businessman.js       - Biznesmenlar (business)
│   ├── Driver.js            - Haydovchilar (driver)
│   ├── Vehicle.js           - Mashinalar
│   ├── Flight.js            - Marshrutlar
│   └── VehicleMaintenance.js - Texnik xizmat
│
├── routes/
│   ├── auth.routes.js       - Login/Register
│   ├── superAdmin.routes.js - Super Admin API
│   ├── businessman.routes.js - Business API
│   ├── driver.routes.js     - Driver API
│   ├── fleet.routes.js      - Fleet API
│   └── voice.routes.js      - Ovozli kiritish
│
└── middleware/
    └── auth.js              - Autentifikatsiya
```

---

## 🎯 ASOSIY FARQLAR

| Xususiyat | Business Panel | Fleet Panel |
|-----------|----------------|-------------|
| **Maqsad** | Yuk tashish kompaniyasi | Shaxsiy mashina |
| **Haydovchilar** | Ko'p haydovchi | Yo'q |
| **Marshrutlar** | Bor (Flights) | Yo'q |
| **GPS Tracking** | Bor (real-time) | Yo'q |
| **Yoqilg'i** | Marshrut ichida | Alohida modul |
| **Hisobotlar** | Moliyaviy, haydovchi | Faqat mashina |
| **Narx** | 30,000/mashina | 20,000/mashina |
| **Yaratuvchi** | Super Admin | O'zi (register) |

---

## 🚀 TEXNOLOGIYALAR

### Frontend
- React 18 + Vite
- TailwindCSS
- Zustand (state)
- Socket.io (real-time)
- Capacitor (mobile)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Redis (cache)
- JWT (auth)
- Socket.io

### AI
- Groq Whisper (ovozni matnga)
- LLaMA (matnni tahlil)

---

## 📞 QANDAY ISHLAYDI?

### 1. Super Admin platformani boshqaradi
- Biznesmenlar yaratadi
- Obunalarni kuzatadi
- Statistikani ko'radi

### 2. Biznesmen kompaniyasini boshqaradi
- Haydovchilar qo'shadi
- Marshrutlar yaratadi
- Real-time tracking
- Hisobotlar oladi

### 3. Haydovchi marshrut bajaradi
- Faol marshrut ko'radi
- Xarajat kiritadi
- GPS yuboradi
- Xarajatni tasdiqlaydi

### 4. Fleet foydalanuvchi mashinasini boshqaradi
- Yoqilg'i hisobini yuritadi
- Moy/shina almashtiradi
- Texnik xizmat qiladi
- Daromad kiritadi

---

## 💡 QISQACHA XULOSA

**Avtojon** - bu 4 ta alohida panel:

1. **Super Admin** - Platformani boshqarish (siz)
2. **Business** - Yuk tashish kompaniyalari (Super Admin yaratadi)
3. **Driver** - Haydovchilar (Biznesmen qo'shadi)
4. **Fleet** - Oddiy mashina egalari (o'zi register qiladi)

Har bir panel o'z vazifasiga ega va alohida ishlaydi!
