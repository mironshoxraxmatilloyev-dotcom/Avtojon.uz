# Web vs Mobile - Batafsil Funksiyalar Matritsasi

## 📋 SAHIFALAR VA EKRANLAR

### WEB PAGES (apps/web/src/pages/)

```
📁 pages/
├── Landing.jsx                    - Bosh sahifa (kirish oldin)
├── Login.jsx                      - Kirish
├── Register.jsx                   - Ro'yxatdan o'tish
├── Dashboard.jsx                  - Biznesmen dashboard
├── DriversNew.jsx                 - Haydovchilar ro'yxati
├── DriverDetail.jsx               - Haydovchi tafsilotlari
├── Flights.jsx                    - Reyslar ro'yxati
├── FlightDetail.jsx               - Reys tafsilotlari
├── Reports.jsx                    - Hisobotlar
├── Payment.jsx                    - To'lov
├── 📁 driver/
│   └── DriverHome.jsx             - Haydovchi interfeysi
├── 📁 fleet/
│   ├── FleetDashboard.jsx         - Avtopark dashboard
│   └── VehicleDetailPanel.jsx     - Mashina tafsilotlari
└── 📁 superadmin/
    └── SuperAdminPanel.jsx        - Super admin panel
```

### MOBILE SCREENS (apps/mobile/src/screens/)

```
📁 screens/
├── LoginScreen.js                 - Kirish
├── BusinessHomeScreen.js          - Biznesmen bosh ekrani
├── DriverHomeScreen.js            - Haydovchi bosh ekrani
├── FleetDashboardScreen.js        - Avtopark dashboard
├── VehicleDetailScreen.js         - Mashina tafsilotlari
├── FlightDetailScreen.js          - Reys tafsilotlari
├── StatsScreen.js                 - Statistika
├── AlertsScreen.js                - Diqqat/Ogohlantirish
├── PaymentScreen.js               - To'lov
├── ProfileScreen.js               - Profil
└── 📁 business/
    ├── BusinessDashboardScreen.js - Biznesmen dashboard
    ├── BusinessDriversScreen.js   - Haydovchilar ro'yxati
    ├── BusinessDriverDetailScreen.js - Haydovchi tafsilotlari
    ├── BusinessFlightsScreen.js   - Reyslar ro'yxati
    └── BusinessReportsScreen.js   - Hisobotlar
```

---

## 🎨 KOMPONENTLAR TAQQOSLASH

### DASHBOARD KOMPONENTLAR

#### Web Dashboard
```
📁 components/dashboard/
├── DashboardHeader.jsx            - Header
├── ActiveFlights.jsx              - Faol reyslar
├── RecentFlights.jsx              - So'nggi reyslar
├── StatsCards.jsx                 - Statistika kartalar
├── DashboardMap.jsx               - Xarita
└── LiveMap.jsx                    - Jonli xarita
```

#### Mobile Dashboard
```
📁 components/businessPanel/
├── BusinessHeader.js              - Header
├── ActiveFlightsList.js           - Faol reyslar ro'yxati
├── RecentFlightsList.js           - So'nggi reyslar ro'yxati
├── StatsGrid.js                   - Statistika grid
└── ❌ Xarita yo'q
```

**Farq**: Web da xarita bor, Mobile da yo'q

---

### DRIVER PANEL KOMPONENTLAR

#### Web Driver Panel
```
📁 components/driverPanel/
├── DriverHeader.jsx               - Header
├── DriverTabs.jsx                 - Tablar
├── ActiveFlightCard.jsx           - Faol reys karti
├── ActiveTripCard.jsx             - Faol sayohat karti ⭐
├── FlightDetailModal.jsx          - Reys modal
├── FlightHistory.jsx              - Reys tarixi
├── NewTripNotification.jsx        - Yangi sayohat bildirishnomasi
├── PendingTrips.jsx               - Kutilayotgan sayohatlar ⭐
├── StatsCards.jsx                 - Statistika kartalar
├── TripHistory.jsx                - Sayohat tarixi ⭐
├── EmptyState.jsx                 - Bo'sh holat
└── ErrorState.jsx                 - Xato holati
```

#### Mobile Driver Panel
```
📁 components/driverPanel/
├── DriverHeader.js                - Header
├── DriverTabs.js                  - Tablar
├── ActiveFlightCard.js            - Faol reys karti
├── ❌ ActiveTripCard yo'q
├── FlightDetailModal.js           - Reys modal
├── FlightHistory.js               - Reys tarixi
├── NewTripNotification.js         - Yangi sayohat bildirishnomasi
├── ❌ PendingTrips yo'q
├── StatsCards.js                  - Statistika kartalar
├── ❌ TripHistory yo'q
├── EmptyState.js                  - Bo'sh holat
└── ErrorState.js                  - Xato holati
```

**Farq**: Web da 3 ta qo'shimcha komponent (⭐)

---

### DRIVERS KOMPONENTLAR

#### Web Drivers
```
📁 components/drivers/
├── DriversHeader.jsx              - Header
├── DriverCard.jsx                 - Haydovchi karti
├── DriverModal.jsx                - Haydovchi modal
├── DriversFilter.jsx              - Filtrlash ⭐
├── DriversSearch.jsx              - Qidirish ⭐
├── FlightModal.jsx                - Reys modal
└── EmptyState.jsx                 - Bo'sh holat
```

#### Mobile Business Panel
```
📁 components/businessPanel/
├── BusinessHeader.js              - Header
├── DriverCard.js                  - Haydovchi karti
├── DriverModal.js                 - Haydovchi modal
├── ❌ Filtrlash yo'q
├── ❌ Qidirish yo'q
└── ❌ FlightModal yo'q
```

**Farq**: Web da filtrlash va qidirish bor

---

### FLEET KOMPONENTLAR

#### Web Fleet
```
📁 components/fleet/
├── HomeTab.jsx                    - Bosh tab
├── ServiceTab.jsx                 - Xizmat tab
├── StatsTab.jsx                   - Statistika tab
├── VehicleCard.jsx                - Mashina karti
├── VoiceVehicleCreator.jsx        - Ovoz bilan mashina yaratish ⭐
├── Modals.jsx                     - Modallar
└── 📁 vehicle/
    ├── OilTab.jsx                 - Moy tab
    ├── SummaryTab.jsx             - Xulosa tab
    ├── ServicesTab.jsx            - Xizmatlar tab
    ├── TiresTab.jsx               - Shinalar tab
    ├── IncomeTab.jsx              - Daromad tab
    ├── FuelTab.jsx                - Yoqilg'i tab
    ├── VehicleForms.jsx           - Formalar
    └── MaintenanceAlertModal.jsx  - Ta'mirlash ogohlantirish
```

#### Mobile Fleet
```
📁 components/tabs/
├── SummaryTab.js                  - Xulosa tab
├── OilTab.js                      - Moy tab
├── TiresTab.js                    - Shinalar tab
├── ServicesTab.js                 - Xizmatlar tab
├── FuelTab.js                     - Yoqilg'i tab
└── IncomeTab.js                   - Daromad tab

📁 components/
├── VehicleCard.js                 - Mashina karti
├── AddVehicleModal.js             - Mashina qo'shish modal
└── ❌ VoiceVehicleCreator yo'q
```

**Farq**: Web da ovoz bilan mashina yaratish bor

---

### FLIGHT DETAIL KOMPONENTLAR

#### Web Flight Detail
```
📁 components/flightDetail/
├── FlightHeader.jsx               - Header
├── AllModals.jsx                  - Barcha modallar
├── BeforeExpensesCard.jsx         - Xarajatlardan oldin
├── PostExpensesCard.jsx           - Xarajatlardan keyin
├── ExpensesList.jsx               - Xarajatlar ro'yxati
├── FinancialSummary.jsx           - Moliyaviy xulosa
├── FlightExpensesModal.jsx        - Xarajatlar modal
├── FlightTimeline.jsx             - Vaqt chizig'i
├── FuelConsumptionCard.jsx        - Yoqilg'i iste'mol
├── InternationalSection.jsx       - Xalqaro bo'lim ⭐
├── LegExpenses.jsx                - Etap xarajatlari
├── LegsList.jsx                   - Etaplar ro'yxati
├── LegsWithExpenses.jsx           - Etaplar va xarajatlar
└── OdometerFuelCard.jsx           - Odometr va yoqilg'i
```

#### Mobile Flight Detail
```
📁 components/businessPanel/
├── ❌ FlightHeader yo'q
├── ❌ AllModals yo'q
├── ❌ BeforeExpensesCard yo'q
├── ❌ PostExpensesCard yo'q
├── ❌ ExpensesList yo'q
├── ❌ FinancialSummary yo'q
├── FlightExpensesModal.js         - Xarajatlar modal
├── ❌ FlightTimeline yo'q
├── ❌ FuelConsumptionCard yo'q
├── ❌ InternationalSection yo'q
├── ❌ LegExpenses yo'q
├── ❌ LegsList yo'q
├── ❌ LegsWithExpenses yo'q
└── ❌ OdometerFuelCard yo'q
```

**Farq**: Web da 14 ta komponent, Mobile da 1 ta komponent

---

### REPORTS KOMPONENTLAR

#### Web Reports
```
📁 components/reports/
├── DriverDebts.jsx                - Haydovchi qarzlari
└── DriverSalaries.jsx             - Haydovchi oyliklar
```

#### Mobile Reports
```
📁 components/reports/
├── DriverDebts.js                 - Haydovchi qarzlari
└── DriverSalaries.js              - Haydovchi oyliklar
```

**Farq**: Bir xil ✅

---

### ADMIN KOMPONENTLAR

#### Web Admin
```
📁 components/admin/
└── SmsPanel.jsx                   - SMS panel

📁 components/superadmin/
├── DashboardTab.jsx               - Dashboard tab
├── StatsTab.jsx                   - Statistika tab
├── Charts.jsx                     - Grafiklar
├── Modals.jsx                     - Modallar
└── Sidebar.jsx                    - Sidebar
```

#### Mobile Admin
```
❌ Admin komponentlari yo'q
```

**Farq**: Web da 6 ta admin komponent, Mobile da 0

---

### UTILITY KOMPONENTLAR

#### Web Utilities
```
📁 components/
├── AddressAutocomplete.jsx        - Manzil avtotoldiruvi
├── LazyMap.jsx                    - Xarita (lazy loading) ⭐
├── LocationPicker.jsx             - Joylashuv tanlash ⭐
├── PhoneInput.jsx                 - Telefon raqam kiritish
├── Toast.jsx                      - Bildirishnomalar
├── VoiceFlightCreator.jsx         - Ovoz bilan reys yaratish
└── VoiceRecorder.jsx              - Ovoz yozuvchi

📁 components/layout/
└── DashboardLayout.jsx            - Dashboard layout

📁 components/subscription/
└── SubscriptionBlocker.jsx        - Obuna blokirovkasi

📁 components/ui/
├── AlertDialog.jsx                - Ogohlantirish dialogi
├── AnimatedCard.jsx               - Animatsiyalangan karta
├── ErrorState.jsx                 - Xato holati
├── LoadingSpinner.jsx             - Yuklash spinner
├── Modal.jsx                      - Modal
├── PageWrapper.jsx                - Sahifa wrapper
└── Skeleton.jsx                   - Skeleton
```

#### Mobile Utilities
```
📁 components/
├── AddressAutocomplete.js         - Manzil avtotoldiruvi
├── ❌ LazyMap yo'q
├── ❌ LocationPicker yo'q
├── SubscriptionBlocker.js         - Obuna blokirovkasi
├── VehicleCard.js                 - Mashina karti
├── VoiceRecorder.js               - Ovoz yozuvchi
└── AddVehicleModal.js             - Mashina qo'shish modal

📁 components/ui/
├── ErrorState.js                  - Xato holati
├── LoadingSpinner.js              - Yuklash spinner
└── Toast.js                       - Bildirishnomalar
```

**Farq**: Web da 18 ta utility, Mobile da 8 ta utility

---

## 📊 FUNKSIYALAR TAQQOSLASH JADVALI

### BUSINESS PANEL FUNKSIYALARI

| # | Funksiya | Web | Mobile | Izoh |
|---|----------|-----|--------|------|
| 1 | Dashboard | ✅ | ✅ | Bir xil |
| 2 | Haydovchilar ro'yxati | ✅ | ✅ | Bir xil |
| 3 | Haydovchi tafsilotlari | ✅ | ✅ | Bir xil |
| 4 | Haydovchi filtrlash | ✅ | ❌ | Web da bor |
| 5 | Haydovchi qidirish | ✅ | ❌ | Web da bor |
| 6 | Reyslar ro'yxati | ✅ | ✅ | Bir xil |
| 7 | Reys tafsilotlari | ✅ | ✅ | Bir xil |
| 8 | Reys yaratish | ✅ | ✅ | Bir xil |
| 9 | Reys yakunlash | ✅ | ✅ | Bir xil |
| 10 | Xarajatlar boshqaruvi | ✅ | ✅ | Bir xil |
| 11 | Xalqaro reyslar | ✅ | ❌ | Web da bor |
| 12 | Hisobotlar | ✅ | ✅ | Bir xil |
| 13 | Haydovchi oyliklar | ✅ | ✅ | Bir xil |
| 14 | Haydovchi qarzlari | ✅ | ✅ | Bir xil |
| 15 | Ovoz bilan reys yaratish | ✅ | ✅ | Bir xil |
| 16 | To'lov/Obuna | ✅ | ✅ | Bir xil |
| 17 | Xarita (jonli) | ✅ | ❌ | Web da bor |
| 18 | Statistika | ✅ | ✅ | Bir xil |

**Jami**: 18 ta funksiya, Mobile da 14 ta (78%)

---

### DRIVER PANEL FUNKSIYALARI

| # | Funksiya | Web | Mobile | Izoh |
|---|----------|-----|--------|------|
| 1 | Bosh ekran | ✅ | ✅ | Bir xil |
| 2 | Faol reyslar | ✅ | ✅ | Bir xil |
| 3 | Reys tafsilotlari | ✅ | ✅ | Bir xil |
| 4 | Reys tarixi | ✅ | ✅ | Bir xil |
| 5 | Sayohat tarixi | ✅ | ❌ | Web da bor |
| 6 | Kutilayotgan sayohatlar | ✅ | ❌ | Web da bor |
| 7 | Statistika | ✅ | ✅ | Bir xil |
| 8 | Profil | ✅ | ✅ | Bir xil |
| 9 | Yangi sayohat bildirishnomasi | ✅ | ✅ | Bir xil |

**Jami**: 9 ta funksiya, Mobile da 7 ta (78%)

---

### FLEET PANEL FUNKSIYALARI

| # | Funksiya | Web | Mobile | Izoh |
|---|----------|-----|--------|------|
| 1 | Dashboard | ✅ | ✅ | Bir xil |
| 2 | Mashinalar ro'yxati | ✅ | ✅ | Bir xil |
| 3 | Mashina tafsilotlari | ✅ | ✅ | Bir xil |
| 4 | Yoqilg'i boshqaruvi | ✅ | ✅ | Bir xil |
| 5 | Moy boshqaruvi | ✅ | ✅ | Bir xil |
| 6 | Shinalar boshqaruvi | ✅ | ✅ | Bir xil |
| 7 | Xizmatlar/Ta'mirlash | ✅ | ✅ | Bir xil |
| 8 | Daromad | ✅ | ✅ | Bir xil |
| 9 | Statistika | ✅ | ✅ | Bir xil |
| 10 | Diqqat/Ogohlantirish | ✅ | ✅ | Bir xil |
| 11 | Ovoz bilan mashina yaratish | ✅ | ❌ | Web da bor |
| 12 | Xarita | ✅ | ❌ | Web da bor |
| 13 | Joylashuv tanlash | ✅ | ❌ | Web da bor |

**Jami**: 13 ta funksiya, Mobile da 10 ta (77%)

---

### ADMIN PANEL FUNKSIYALARI

| # | Funksiya | Web | Mobile | Izoh |
|---|----------|-----|--------|------|
| 1 | Dashboard | ✅ | ❌ | Web-only |
| 2 | Statistika | ✅ | ❌ | Web-only |
| 3 | Grafiklar | ✅ | ❌ | Web-only |
| 4 | SMS boshqaruvi | ✅ | ❌ | Web-only |
| 5 | Foydalanuvchilar boshqaruvi | ✅ | ❌ | Web-only |

**Jami**: 5 ta funksiya, Mobile da 0 ta (0%)

---

## 🎯 UMUMIY STATISTIKA

| Metrika | Web | Mobile | Foiz |
|---------|-----|--------|------|
| **Sahifalar/Ekranlar** | 14 | 15 | 107% |
| **Komponentlar** | 80+ | 40+ | 50% |
| **Business Funksiyalari** | 18 | 14 | 78% |
| **Driver Funksiyalari** | 9 | 7 | 78% |
| **Fleet Funksiyalari** | 13 | 10 | 77% |
| **Admin Funksiyalari** | 5 | 0 | 0% |
| **JAMI FUNKSIYALAR** | **45** | **31** | **69%** |

---

## 🔴 MOBILE DA YO'Q ASOSIY FUNKSIYALAR

### 1. XARITA FUNKSIYALARI (3 ta)
- ❌ DashboardMap - Biznesmen dashboard da xarita
- ❌ LiveMap - Jonli xarita
- ❌ LocationPicker - Joylashuv tanlash

### 2. ADMIN PANEL (5 ta)
- ❌ SuperAdminPanel - Super admin interfeysi
- ❌ SMS Panel - SMS boshqaruvi
- ❌ Charts - Grafiklar
- ❌ Dashboard Tab - Admin dashboard
- ❌ Stats Tab - Admin statistika

### 3. DRIVER PANEL QOLADIGAN (2 ta)
- ❌ PendingTrips - Kutilayotgan sayohatlar
- ❌ TripHistory - Sayohat tarixi

### 4. FLEET PANEL QOLADIGAN (1 ta)
- ❌ VoiceVehicleCreator - Ovoz bilan mashina yaratish

### 5. FILTRLASH VA QIDIRISH (2 ta)
- ❌ DriversFilter - Haydovchilar filtrlash
- ❌ DriversSearch - Haydovchilar qidirish

### 6. XALQARO REYSLAR (1 ta)
- ❌ InternationalSection - Xalqaro reyslar bo'limi

---

## ✅ MOBILE DA YETARLI FUNKSIYALAR

Mobile app asosiy biznes funksiyalarini to'liq qamrab oladi:

### Business Panel ✅
- Dashboard, Haydovchilar, Reyslar, Hisobotlar
- Reys yaratish/yakunlash
- Xarajatlar boshqaruvi
- To'lov

### Driver Panel ✅
- Faol reyslar
- Reys tafsilotlari
- Reys tarixi
- Statistika

### Fleet Panel ✅
- Mashinalar ro'yxati
- Mashina tafsilotlari
- Yoqilg'i, Moy, Shinalar, Xizmatlar
- Statistika va Diqqat

---

## 🎓 XULOSA

**Mobile App** Web App ning **69%** funksiyasini qamrab oladi.

**Asosiy Farqlar**:
1. **Xarita** - Web-only (3 ta komponent)
2. **Admin Panel** - Web-only (5 ta komponent)
3. **Qo'shimcha Filtrlash** - Web-only (2 ta komponent)
4. **Xalqaro Reyslar** - Web-only (1 ta komponent)
5. **Ovoz bilan Mashina Yaratish** - Web-only (1 ta komponent)

**Mobil Foydalanuvchilar Uchun Yetarli**: ✅ Barcha asosiy biznes funksiyalari mavjud
