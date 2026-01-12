# 4. MAHSULOT HUJJATLARI

## MAHSULOT VIZYONI

> Avtojon - yuk tashish va avtopark boshqaruvini oddiy, tez va samarali qiladigan platforma. Ovoz bilan boshqaring, real vaqtda kuzating, avtomatik hisobot oling.

---

## PLATFORMA TUZILISHI

### Umumiy Arxitektura:

```
┌─────────────────────────────────────────────────────────────┐
│                      AVTOJON PLATFORMASI                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  BIZNESMEN  │  │  HAYDOVCHI  │  │       FLEET         │  │
│  │   PANEL     │  │    PANEL    │  │       PANEL         │  │
│  │   (Web)     │  │  (Mobile)   │  │   (Web/Mobile)      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    BACKEND API                        │  │
│  │  • Authentication  • Flights  • Vehicles  • Reports   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐           │
│  │  MongoDB  │    │   Redis   │    │  Groq AI  │           │
│  │ (Database)│    │  (Cache)  │    │  (Voice)  │           │
│  └───────────┘    └───────────┘    └───────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## BIZNESMEN PANEL

### Modullar va Funksiyalar:

#### 1. Dashboard
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Statistika kartlari | Haydovchilar, mashinalar, reyslar | Tayyor |
| Jonli xarita | GPS tracking, haydovchi joylashuvi | Tayyor |
| Faol marshrutlar | Hozirgi reyslar ro'yxati | Tayyor |
| Oxirgi marshrutlar | Tarix | Tayyor |
| Tezkor amallar | Yangi reys, haydovchi qo'shish | Tayyor |

#### 2. Reyslar (Flights)
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Marshrut yaratish | Haydovchi, mashina, yo'nalish | Tayyor |
| Buyurtmalar | Yuk olish/topshirish nuqtalari | Tayyor |
| Xarajatlar | Yoqilg'i, ovqat, yo'l to'lovi | Tayyor |
| Xalqaro reyslar | Ko'p valyuta, chegara | Tayyor |
| Ovozli kiritish | AI bilan xarajat qo'shish | Tayyor |
| Marshrutni yopish | Hisob-kitob, foyda | Tayyor |

#### 3. Haydovchilar
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Ro'yxat | Barcha haydovchilar | Tayyor |
| Profil | Ma'lumotlar, rasm | Tayyor |
| GPS tracking | Real-time joylashuv | Tayyor |
| Ish tarixi | O'tgan marshrutlar | Tayyor |
| Oylik hisob | Maosh, bonus, jarima | Tayyor |
| SMS yuborish | Xabarnoma | Tayyor |

#### 4. Hisobotlar
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Moliyaviy hisobot | Daromad, xarajat, foyda | Tayyor |
| Haydovchi hisoboti | Ish samaradorligi | Tayyor |
| Yoqilg'i hisoboti | Sarflanish tahlili | Tayyor |
| Excel eksport | Yuklab olish | Tayyor |
| Grafik va diagrammalar | Vizual tahlil | Tayyor |

#### 5. Sozlamalar
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Kompaniya ma'lumotlari | Nom, manzil, logo | Tayyor |
| Obuna boshqaruvi | Reja, to'lov | Tayyor |
| SMS Gateway | Android ilova sozlash | Tayyor |
| Bildirishnomalar | Push, SMS sozlamalari | Tayyor |

---

## HAYDOVCHI PANEL (Mobile)

### Funksiyalar:

| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Faol marshrut | Joriy reys ma'lumotlari | Tayyor |
| Buyurtmalar | Yuk olish/topshirish | Tayyor |
| Xarajat kiritish | Yoqilg'i, ovqat, yo'l | Tayyor |
| Xarajat tasdiqlash | Biznesmen qo'shgan xarajatlar | Tayyor |
| GPS yuborish | Background tracking | Tayyor |
| Tarix | O'tgan marshrutlar | Tayyor |
| Til tanlash | O'zbek/Rus | Tayyor |
| Offline rejim | Internetisz ishlash | Tayyor |

### Texnik Xususiyatlar:
- **Platform:** Capacitor (Android/iOS)
- **Min Android:** 7.0+
- **Min iOS:** 13.0+
- **Offline:** LocalStorage + Sync

---

## FLEET PANEL

### Modullar va Funksiyalar:

#### 1. Mashinalar
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Ro'yxat | Barcha mashinalar | Tayyor |
| Qo'shish | Yangi mashina | Tayyor |
| Profil | Ma'lumotlar, rasm | Tayyor |
| Statistika | Umumiy ko'rsatkichlar | Tayyor |

#### 2. Yoqilg'i
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Yozuv qo'shish | Sana, miqdor, narx | Tayyor |
| Ovozli kiritish | AI bilan | Tayyor |
| Sarflanish grafigi | Vizual tahlil | Tayyor |
| Statistika | O'rtacha sarflanish | Tayyor |

#### 3. Moy
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Almashtirish yozuvi | Sana, turi, km | Tayyor |
| Eslatma | Keyingi almashtirish | Tayyor |
| Tarix | O'tgan almashtirishlar | Tayyor |

#### 4. Shina
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Holat | Hozirgi shinalar | Tayyor |
| Almashtirish | Yangi shina | Tayyor |
| Eslatma | Tekshirish vaqti | Tayyor |

#### 5. Xizmatlar
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Ta'mir yozuvi | Turi, narx, tavsif | Tayyor |
| Texnik xizmat | Reglament ishlari | Tayyor |
| Eslatmalar | Keyingi xizmat | Tayyor |

#### 6. Daromad
| Funksiya | Tavsif | Status |
|----------|--------|--------|
| Daromad kiritish | Taksi, ijara | Tayyor |
| Statistika | Oylik/yillik | Tayyor |
| Foyda/zarar | Xarajat - daromad | Tayyor |

---

## TEXNIK ARXITEKTURA

### Frontend Stack:
```
React 18
├── Vite 5 (build tool)
├── TailwindCSS 3 (styling)
├── Lucide React (icons)
├── React Router 6 (routing)
├── Zustand (state management)
├── Socket.io Client (real-time)
├── Leaflet (maps)
└── Capacitor 5 (mobile)
```

### Backend Stack:
```
Node.js 20 LTS
├── Express 4 (framework)
├── MongoDB 7 (database)
├── Mongoose 8 (ODM)
├── Redis 7 (cache, sessions)
├── Socket.io 4 (real-time)
├── JWT (authentication)
├── bcrypt (password hashing)
└── Groq SDK (AI)
```

### AI/ML:
```
Groq Cloud
├── Whisper (Speech-to-Text)
└── LLaMA (Text parsing)
```

---

## UX/UI PRINSIPLARI

### Dizayn Prinsiplari:

1. **Oddiylik** - Minimal UI, aniq amallar
2. **Tezlik** - 3 bosqichda istalgan amal
3. **Mobil-first** - Telefonda qulay
4. **Accessibility** - Katta shriftlar, kontrast

### Rang Palitrasi:
```
Primary:    #10B981 (Emerald)
Secondary:  #3B82F6 (Blue)
Accent:     #F59E0B (Amber)
Background: #F8FAFC (Slate-50)
Text:       #1E293B (Slate-800)
Error:      #EF4444 (Red)
Success:    #22C55E (Green)
```

### Tipografiya:
```
Font: Inter
Headings: 600-700 weight
Body: 400-500 weight
Sizes: 12px - 32px
```

---

## FEATURE ROADMAP

### 2026 Q1 (Yanvar-Mart):
- [ ] iOS App Store release
- [ ] Telegram bot integratsiyasi
- [ ] Advanced analytics dashboard
- [ ] Multi-language (rus tili)

### 2026 Q2 (Aprel-Iyun):
- [ ] Yuk birjasi MVP
- [ ] CRM integratsiya
- [ ] API documentation
- [ ] Webhook support

### 2026 Q3 (Iyul-Sentabr):
- [ ] AI route optimization
- [ ] Fuel price tracking
- [ ] Partner API
- [ ] White-label option

### 2026 Q4 (Oktabr-Dekabr):
- [ ] Qozog'iston launch
- [ ] Advanced reporting
- [ ] Mobile offline sync v2
- [ ] Performance optimization

---

## API HUJJATLARI

### Authentication:
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Flights:
```
GET    /api/flights
POST   /api/flights
GET    /api/flights/:id
PUT    /api/flights/:id
DELETE /api/flights/:id
POST   /api/flights/:id/legs
POST   /api/flights/:id/expenses
PUT    /api/flights/:id/complete
```

### Drivers:
```
GET    /api/drivers
POST   /api/drivers
GET    /api/drivers/:id
PUT    /api/drivers/:id
DELETE /api/drivers/:id
GET    /api/drivers/locations
```

### Fleet:
```
GET    /api/fleet/vehicles
POST   /api/fleet/vehicles
GET    /api/fleet/vehicles/:id
POST   /api/fleet/vehicles/:id/fuel
POST   /api/fleet/vehicles/:id/oil
POST   /api/fleet/vehicles/:id/services
```

### Voice:
```
POST   /api/voice/transcribe
POST   /api/voice/parse-expense
```

---

*Keyingi bo'lim: [Biznes Model](./05-business-model.md)*
