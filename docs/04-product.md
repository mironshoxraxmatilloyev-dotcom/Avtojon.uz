# 4️⃣ PRODUCT DOCUMENTATION

## 🎯 PRODUCT VISION

> Yuk tashish kompaniyalari uchun eng oddiy va samarali boshqaruv platformasi yaratish.

**Asosiy tamoyillar:**
- Mobile-first
- Voice-first (ovoz bilan boshqarish)
- Offline-ready
- Mahalliy (O'zbek tili)

---

## 📦 MVP SCOPE

### Modul 1: Dashboard (Reyslar boshqaruvi)

| Funksiya | Status | Prioritet |
|----------|--------|-----------|
| Shofyorlar ro'yxati | ✅ Done | P0 |
| Reys ochish/yopish | ✅ Done | P0 |
| Xarajatlar kiritish | ✅ Done | P0 |
| Foyda hisoblash | ✅ Done | P0 |
| Ovozli kiritish | ✅ Done | P1 |
| GPS tracking | ✅ Done | P1 |
| Hisobotlar | ✅ Done | P2 |

### Modul 2: Fleet (Avtopark)

| Funksiya | Status | Prioritet |
|----------|--------|-----------|
| Mashinalar ro'yxati | ✅ Done | P0 |
| Yoqilg'i tracking | ✅ Done | P0 |
| Moy almashtirish | ✅ Done | P1 |
| Shina tracking | ✅ Done | P1 |
| Texnik xizmat | ✅ Done | P1 |
| Ovozli kiritish | ✅ Done | P2 |

---

## 🗺️ FEATURE ROADMAP

### Q1 2025 (Yanvar-Mart)
- [ ] Push notifications
- [ ] Offline mode yaxshilash
- [ ] iOS app
- [ ] Telegram bot integratsiya

### Q2 2025 (Aprel-Iyun)
- [ ] Mijozlar bazasi (CRM)
- [ ] Shartnomalar boshqaruvi
- [ ] Avtomatik hisobotlar
- [ ] API for integrations

### Q3 2025 (Iyul-Sentyabr)
- [ ] Yuk birjasi integratsiya
- [ ] GPS tracker integratsiya
- [ ] Predictive maintenance
- [ ] Multi-company support

### Q4 2025 (Oktyabr-Dekabr)
- [ ] Marketplace (ehtiyot qismlar)
- [ ] Insurance integratsiya
- [ ] Advanced analytics
- [ ] White-label solution

---

## 🎨 UX/UI PRINSIPLARI

### Design System

**Ranglar:**
```
Primary:    #6366f1 (Indigo)
Secondary:  #10b981 (Emerald)
Warning:    #f59e0b (Amber)
Error:      #ef4444 (Red)
Background: #f8fafc (Slate-50)
```

**Typography:**
- Font: Inter
- Headings: Bold
- Body: Regular

### UX Qoidalari:

1. **3-click rule** - Har qanday amal 3 bosqichda
2. **Thumb-friendly** - Bir qo'l bilan ishlatish
3. **Progressive disclosure** - Kerakli ma'lumotni ko'rsatish
4. **Instant feedback** - Har bir amalga javob

---

## 🏗️ TEXNIK ARXITEKTURA

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React + Vite + TailwindCSS + Zustand                  │
│  Capacitor (Android/iOS)                               │
├─────────────────────────────────────────────────────────┤
│                      BACKEND                            │
│  Node.js + Express + MongoDB + Redis                   │
│  Socket.io (Real-time)                                 │
├─────────────────────────────────────────────────────────┤
│                      AI/ML                              │
│  Groq Whisper (Speech-to-Text)                         │
│  Llama 3.3 (NLU)                                       │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                        │
│  VPS (Hetzner) + Nginx + PM2 + Let's Encrypt          │
└─────────────────────────────────────────────────────────┘
```

### Database Schema (Asosiy)

```
Users
├── Businessman (kompaniya egasi)
├── Driver (shofyor)
└── SuperAdmin

Businessman
├── drivers[]
├── vehicles[]
└── subscription

Flight (Reys)
├── driver
├── legs[] (buyurtmalar)
├── expenses[] (xarajatlar)
└── status

Vehicle (Mashina)
├── maintenance (fuel, oil, tires, services)
└── income[]
```

---

## 📱 SAHIFALAR STRUKTURASI

### Web App Routes

```
/                     Landing page
/login               Kirish
/register            Ro'yxatdan o'tish

/dashboard           Bosh sahifa
/dashboard/drivers   Shofyorlar
/dashboard/drivers/:id
/dashboard/flights   Reyslar
/dashboard/flights/:id
/dashboard/reports   Hisobotlar

/fleet               Avtopark
/fleet/vehicle/:id   Mashina tafsilotlari

/driver              Shofyor paneli

/superadmin          Admin panel
```
