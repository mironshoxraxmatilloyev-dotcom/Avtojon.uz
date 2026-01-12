# AVTOJON STARTUP PLAYBOOK

> Yuk tashish va avtopark boshqaruv platformasi uchun operatsion qo'llanma

**Versiya:** 3.0  
**Sana:** 2026-yil Yanvar  
**Status:** Pre-MVP (Bozorga chiqish kutilmoqda)

---

## HOZIRGI HOLAT

| Ko'rsatkich | Qiymat |
|-------------|--------|
| MVP Status | Tayyor emas |
| Foydalanuvchilar | 1 ta |
| Daromad | $0 |
| Maqsad | MVP ga chiqish |

---

## PLATFORMA TUZILISHI

```
AVTOJON
│
├── KORPORATIV MIJOZLAR (B2B)
│   ├── Biznesmen Panel (Web)
│   │   ├── Dashboard
│   │   ├── Reyslar boshqaruvi
│   │   ├── Haydovchilar
│   │   ├── Hisobotlar
│   │   └── Sozlamalar
│   │
│   └── Haydovchi Panel (Mobile)
│       ├── Faol marshrut
│       ├── Xarajat kiritish
│       ├── GPS tracking
│       └── Xarajat tasdiqlash
│
└── ODDIY MIJOZLAR (B2C)
    └── Fleet Panel (Web/Mobile)
        ├── Mashinalar ro'yxati
        ├── Yoqilg'i hisobi
        ├── Moy almashtirish
        ├── Shina holati
        ├── Texnik xizmatlar
        └── Daromad hisobi
```

---

## NARXLASH MODELI

### Korporativ Mijozlar (Biznesmen Panel)

| Mashinalar soni | Narx (mashina/oy) | Jami oylik |
|-----------------|-------------------|------------|
| 1 ta | 30,000 so'm | 30,000 so'm |
| 5 ta | 30,000 so'm | 150,000 so'm |
| 10 ta | 30,000 so'm | 300,000 so'm |
| 20 ta | 30,000 so'm | 600,000 so'm |

### Oddiy Mijozlar (Fleet Panel)

| Mashinalar soni | Narx (mashina/oy) | Jami oylik |
|-----------------|-------------------|------------|
| 1 ta | 20,000 so'm | 20,000 so'm |  
| 3 ta | 20,000 so'm | 60,000 so'm |
| 5 ta | 20,000 so'm | 100,000 so'm |
| 10 ta | 20,000 so'm | 200,000 so'm |

### Narx Farqi Sababi

| Segment | Narx | Sabab |
|---------|------|-------|
| Korporativ | 30,000 so'm | Reyslar, haydovchilar, GPS, hisobotlar |
| Fleet | 20,000 so'm | Faqat mashina boshqaruvi |

---

## MAHSULOT FUNKSIYALARI

### Biznesmen Panel (Korporativ)

| Modul | Funksiyalar | Status |
|-------|-------------|--------|
| Dashboard | Statistika, jonli xarita, faol reyslar | ✅ Tayyor |
| Reyslar | Marshrut yaratish, xarajatlar, xalqaro | ✅ Tayyor |
| Haydovchilar | Ro'yxat, GPS tracking, ish tarixi | ✅ Tayyor |
| Hisobotlar | Moliyaviy tahlil, Excel eksport | ✅ Tayyor |
| Sozlamalar | Obuna, SMS Gateway | ✅ Tayyor |
| To'lov | Payme integratsiya | 🔄 Jarayonda |

### Haydovchi Panel (Mobile)

| Funksiya | Status |
|----------|--------|
| Faol marshrut ko'rish | ✅ Tayyor |
| Xarajat kiritish | ✅ Tayyor |
| Xarajat tasdiqlash | ✅ Tayyor |
| GPS tracking | ✅ Tayyor |
| Offline rejim | ✅ Tayyor |

### Fleet Panel (Oddiy mijozlar)

| Modul | Funksiyalar | Status |
|-------|-------------|--------|
| Mashinalar | Ro'yxat, profil, rasm | ✅ Tayyor |
| Yoqilg'i | Sarflanish hisobi, grafik | ✅ Tayyor |
| Moy | Almashtirish, eslatma | ✅ Tayyor |
| Shina | Holat, almashtirish | ✅ Tayyor |
| Xizmatlar | Ta'mir, texnik xizmat | ✅ Tayyor |
| Daromad | Taksi/ijara hisobi | ✅ Tayyor |
| To'lov | Payme integratsiya | 🔄 Jarayonda |

---

## TEXNOLOGIYA STEKI

```
Frontend:  React 18 + Vite + TailwindCSS
Mobile:    Capacitor (Android/iOS)
Backend:   Node.js + Express
Database:  MongoDB
Realtime:  Socket.io
AI:        Groq Whisper (ovozli kiritish)
SMS:       Android SMS Gateway
To'lov:    Payme
```

---

## MAQSADLAR

### MVP Chiqish (Keyingi qadam)

- [ ] Payme to'lov integratsiyasini tugatish
- [ ] Birinchi haqiqiy mijozni topish
- [ ] Asosiy buglarni tuzatish
- [ ] Play Store'ga joylash

### Qisqa muddatli (3 oy)

| Ko'rsatkich | Maqsad |
|-------------|--------|
| Foydalanuvchilar | 50 ta |
| To'lovchi mijozlar | 10 ta |
| Oylik daromad | 500,000 so'm |

### O'rta muddatli (6 oy)

| Ko'rsatkich | Maqsad |
|-------------|--------|
| Foydalanuvchilar | 200 ta |
| To'lovchi mijozlar | 50 ta |
| Oylik daromad | 2,000,000 so'm |

### Uzoq muddatli (1 yil)

| Ko'rsatkich | Maqsad |
|-------------|--------|
| Foydalanuvchilar | 1,000 ta |
| To'lovchi mijozlar | 200 ta |
| Oylik daromad | 8,000,000 so'm |

---

## DAROMAD HISOB-KITOBI

### Misol: 100 ta to'lovchi mijoz

| Segment | Mijozlar | O'rtacha mashinalar | Narx | Jami |
|---------|----------|---------------------|------|------|
| Korporativ | 30 ta | 5 ta | 30,000 | 4,500,000 so'm |
| Fleet | 70 ta | 2 ta | 20,000 | 2,800,000 so'm |
| **Jami** | **100 ta** | - | - | **7,300,000 so'm** |

---

## RAQOBAT TAHLILI

| Raqobatchi | Narx | Kamchilik | Avtojon ustunligi |
|------------|------|-----------|-------------------|
| Excel/Qog'oz | Bepul | Avtomatlashtirish yo'q | Avtomatik hisob |
| Samsara | $300+/oy | Qimmat, ingliz | 10x arzon, o'zbek |
| Fleetio | $50+/oy | Ingliz, murakkab | Oddiy, mahalliy |

---

## KEYINGI QADAMLAR

1. **Payme integratsiyasini tugatish** - To'lov qabul qilish
2. **Birinchi mijozlarni topish** - 5-10 ta test mijoz
3. **Feedback yig'ish** - Muammolarni aniqlash
4. **Iteratsiya** - Tuzatish va yaxshilash
5. **Marketing boshlash** - Telegram, og'zaki

---

## KONTAKT

- **Website:** avtojon.uz
- **Telefon:** +998 88 019 19 09
- **Telegram:** @avtojon_support
