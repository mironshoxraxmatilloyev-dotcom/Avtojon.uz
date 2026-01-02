# 5. BIZNES MODEL

## HOZIRGI HOLAT

> **Status:** MVP bosqichi - foydalanuvchilar yo'q, bozorga chiqish tayyorlanmoqda

### MVP Tayyor Funksiyalar:
- Biznesmen Panel (to'liq)
- Haydovchi Panel (mobil)
- Fleet Panel (to'liq)
- Ovozli kiritish (AI)
- Real-time GPS
- SMS Gateway

---

## NARXLASH MODELI

### Asosiy Prinsip:
> **Har bir mashina uchun oylik to'lov** - oddiy va tushunarli

### Korporativ Segment (B2B) - Yuk tashish kompaniyalari:

| Ko'rsatkich | Qiymat |
|-------------|--------|
| **Narx** | 30,000 so'm / mashina / oy |
| **Minimal** | 1 mashina |
| **Chegirma** | 10+ mashina - 10%, 20+ mashina - 15% |

**Misollar:**
| Mashinalar | Oylik to'lov | Chegirma |
|------------|--------------|----------|
| 5 ta | 150,000 so'm | - |
| 10 ta | 270,000 so'm | 10% |
| 20 ta | 510,000 so'm | 15% |
| 50 ta | 1,275,000 so'm | 15% |

### Oddiy Mijozlar Segment (B2C) - Fleet:

| Ko'rsatkich | Qiymat |
|-------------|--------|
| **Narx** | 20,000 so'm / mashina / oy |
| **Minimal** | 1 mashina |
| **Chegirma** | 5+ mashina - 10% |

**Misollar:**
| Mashinalar | Oylik to'lov | Chegirma |
|------------|--------------|----------|
| 1 ta | 20,000 so'm | - |
| 3 ta | 60,000 so'm | - |
| 5 ta | 90,000 so'm | 10% |
| 10 ta | 180,000 so'm | 10% |

---

## BEPUL SINOV DAVRI

### Trial Period:

| Segment | Davr | Cheklov |
|---------|------|---------|
| Korporativ | 14 kun | To'liq funksiya, 5 mashina |
| Fleet | 14 kun | To'liq funksiya, 2 mashina |

### Trial → Paid Konversiya Maqsadi:
- **Maqsad:** 20%+ konversiya
- **Taktika:** Onboarding, qo'llab-quvvatlash, follow-up

---

## DAROMAD MANBALARI

### 1. Obuna (Subscription) - 90%

Asosiy daromad - mashina boshiga oylik to'lov.

### 2. Qo'shimcha Xizmatlar - 10% (Kelajakda)

| Xizmat | Narx | Tavsif |
|--------|------|--------|
| SMS paketi | 10,000/100 SMS | Qo'shimcha SMS |
| API kirish | 50,000/oy | Tashqi integratsiya |
| Priority support | 30,000/oy | Tezkor yordam |

---

## UNIT ECONOMICS (Prognoz)

### Asosiy Ko'rsatkichlar:

| Metrika | Korporativ | Fleet |
|---------|------------|-------|
| **ARPU** (o'rtacha daromad) | 180,000 so'm (~$14) | 40,000 so'm (~$3) |
| **CAC** (jalb qilish) | $10 | $5 |
| **LTV** (umrbod qiymat) | $150 | $30 |
| **LTV/CAC** | 15x | 6x |
| **Gross Margin** | 85% | 85% |

### Hisoblash Asoslari:
```
Korporativ:
- O'rtacha mashinalar: 6 ta
- Oylik: 6 × 30,000 = 180,000 so'm
- Lifetime: 12 oy (prognoz)
- LTV: 180,000 × 12 × 0.85 / 12,800 = ~$150

Fleet:
- O'rtacha mashinalar: 2 ta
- Oylik: 2 × 20,000 = 40,000 so'm
- Lifetime: 10 oy (prognoz)
- LTV: 40,000 × 10 × 0.85 / 12,800 = ~$30
```

---

## MVP BOSQICHI STRATEGIYASI

### Bosqich 1: Soft Launch (1-2 oy)

| Faoliyat | Maqsad |
|----------|--------|
| Beta foydalanuvchilar | 20-50 ta |
| Feedback yig'ish | Muammolarni aniqlash |
| Bug fix | Barqarorlik |
| Narxni test qilish | Maqbullikni tekshirish |

### Bosqich 2: Public Launch (3-4 oy)

| Faoliyat | Maqsad |
|----------|--------|
| Marketing boshlash | Telegram, YouTube |
| Referral dasturi | Viral o'sish |
| To'lov tizimi | Payme, Click |
| Mijozlar | 100+ |

### Bosqich 3: O'sish (5-12 oy)

| Faoliyat | Maqsad |
|----------|--------|
| Kontent marketing | SEO, video |
| Hamkorliklar | Yuk tashish uyushmalari |
| Funksiya kengaytirish | Feedback asosida |
| Mijozlar | 500+ |

---

## DAROMAD PROGNOZI (MVP)

### Birinchi Yil (2026):

| Oy | Korporativ | Fleet | Jami Mijoz | MRR |
|----|------------|-------|------------|-----|
| 1-2 | 10 | 20 | 30 | $500 |
| 3-4 | 30 | 50 | 80 | $1,500 |
| 5-6 | 60 | 100 | 160 | $3,000 |
| 7-9 | 100 | 200 | 300 | $5,500 |
| 10-12 | 150 | 300 | 450 | $8,000 |

### Yillik Prognoz:

| Yil | Mijozlar | MRR | ARR |
|-----|----------|-----|-----|
| 2026 | 450 | $8,000 | $96,000 |
| 2027 | 1,500 | $25,000 | $300,000 |
| 2028 | 4,000 | $65,000 | $780,000 |

---

## XARAJAT TUZILISHI (MVP)

### Oylik Xarajatlar:

| Kategoriya | Summa | Izoh |
|------------|-------|------|
| **Server/Infra** | $100 | VPS, domain |
| **AI (Groq)** | $50 | Ovozli kiritish |
| **SMS** | $20 | Gateway |
| **Marketing** | $100 | Kontent, reklama |
| **Boshqa** | $30 | Asboblar |
| **Jami** | **$300** | |

### Break-even:
```
Oylik xarajat: $300
O'rtacha ARPU: $8
Break-even mijozlar: 300 / 8 = ~40 mijoz
```

---

## TO'LOV TIZIMLARI

### Qo'llab-quvvatlanadigan:

| Tizim | Status | Komissiya |
|-------|--------|-----------|
| Payme | Tayyor | 1.5% |
| Click | Tayyor | 1.5% |
| Uzcard | Rejalashtirilgan | 1% |
| Humo | Rejalashtirilgan | 1% |

### To'lov Jarayoni:
```
1. Mijoz obuna tanlaydi
2. Mashinalar sonini kiritadi
3. To'lov tizimini tanlaydi
4. To'lovni amalga oshiradi
5. Obuna faollashadi
```

---

## NARXLASH TAQQOSLASH

### Raqobatchilar bilan:

| Platforma | Narx (10 mashina/oy) | Avtojon |
|-----------|----------------------|---------|
| Samsara | $300-500 | 12x arzon |
| Fleetio | $50-100 | 4x arzon |
| Excel | $0 | Avtomatlashtirish |
| **Avtojon (Korporativ)** | **$24 (300,000 so'm)** | - |
| **Avtojon (Fleet)** | **$16 (200,000 so'm)** | - |

### Nima uchun bu narx:

1. **Mahalliy bozor** - O'zbekiston uchun moslashgan
2. **MVP bosqichi** - Bozorni sinash
3. **Raqobatbardosh** - Arzon, lekin qiymatli
4. **O'sish imkoniyati** - Keyinchalik oshirish mumkin

---

## MONETIZATSIYA STRATEGIYASI

### Konversiya Funnel:

```
Ro'yxatdan o'tish (100%)
        ↓
Trial boshlash (50%)
        ↓
Faol foydalanish (30%)
        ↓
Pullik obuna (15-20%)
        ↓
Retention (80%+)
```

### Retention Taktikalari:

| Taktika | Tavsif |
|---------|--------|
| Onboarding | Qo'lda yordam, video |
| Engagement | Haftalik hisobot |
| Support | Telegram, tezkor javob |
| Value | Yangi funksiyalar |

---

*Keyingi bo'lim: [Operatsiyalar](./06-operations.md)*
