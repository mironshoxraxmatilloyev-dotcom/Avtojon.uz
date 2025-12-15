// Demo rejim uchun fake reyslar
export const DEMO_TRIPS = [
  { _id: 't1', driver: { fullName: 'Akmal Karimov' }, vehicle: { plateNumber: '01 A 123 AB' }, startAddress: 'Toshkent', endAddress: 'Samarqand', status: 'in_progress', estimatedDistance: 280, estimatedDuration: '4 soat', tripBudget: 2000000, tripPayment: 500000, createdAt: new Date() },
  { _id: 't2', driver: { fullName: 'Bobur Aliyev' }, vehicle: { plateNumber: '01 B 456 CD' }, startAddress: 'Buxoro', endAddress: 'Navoiy', status: 'in_progress', estimatedDistance: 120, estimatedDuration: '2 soat', tripBudget: 1500000, tripPayment: 400000, createdAt: new Date() },
  { _id: 't3', driver: { fullName: 'Sardor Rahimov' }, vehicle: { plateNumber: '01 C 789 EF' }, startAddress: 'Farg\'ona', endAddress: 'Andijon', status: 'in_progress', estimatedDistance: 80, estimatedDuration: '1.5 soat', tripBudget: 1000000, tripPayment: 300000, createdAt: new Date() },
  { _id: 't4', driver: { fullName: 'Jasur Toshmatov' }, vehicle: { plateNumber: '01 D 012 GH' }, startAddress: 'Namangan', endAddress: 'Toshkent', status: 'pending', estimatedDistance: 320, estimatedDuration: '5 soat', tripBudget: 2500000, tripPayment: 600000, createdAt: new Date() },
  { _id: 't5', driver: { fullName: 'Dilshod Umarov' }, vehicle: { plateNumber: '01 E 345 IJ' }, startAddress: 'Xorazm', endAddress: 'Buxoro', status: 'pending', estimatedDistance: 450, estimatedDuration: '7 soat', tripBudget: 3000000, tripPayment: 700000, createdAt: new Date() },
  { _id: 't6', driver: { fullName: 'Nodir Qodirov' }, vehicle: { plateNumber: '01 F 678 KL' }, startAddress: 'Qarshi', endAddress: 'Termiz', status: 'completed', estimatedDistance: 200, estimatedDuration: '3 soat', tripBudget: 1800000, tripPayment: 450000, bonusAmount: 50000, createdAt: new Date(Date.now() - 86400000) },
  { _id: 't7', driver: { fullName: 'Sherzod Yusupov' }, vehicle: { plateNumber: '01 G 901 MN' }, startAddress: 'Jizzax', endAddress: 'Toshkent', status: 'completed', estimatedDistance: 180, estimatedDuration: '2.5 soat', tripBudget: 1600000, tripPayment: 400000, createdAt: new Date(Date.now() - 172800000) },
  { _id: 't8', driver: { fullName: 'Otabek Nazarov' }, vehicle: { plateNumber: '01 H 234 OP' }, startAddress: 'Nukus', endAddress: 'Urganch', status: 'completed', estimatedDistance: 150, estimatedDuration: '2 soat', tripBudget: 1400000, tripPayment: 350000, penaltyAmount: 30000, createdAt: new Date(Date.now() - 259200000) }
]

export const DEMO_DRIVERS = [
  { _id: 'd1', fullName: 'Akmal Karimov', status: 'busy' },
  { _id: 'd2', fullName: 'Bobur Aliyev', status: 'busy' },
  { _id: 'd3', fullName: 'Sardor Rahimov', status: 'busy' },
  { _id: 'd4', fullName: 'Jasur Toshmatov', status: 'free' },
  { _id: 'd5', fullName: 'Dilshod Umarov', status: 'free' }
]

export const DEMO_VEHICLES = [
  { _id: 'v1', plateNumber: '01 A 123 AB', brand: 'MAN', currentDriver: 'd1' },
  { _id: 'v2', plateNumber: '01 B 456 CD', brand: 'Volvo', currentDriver: 'd2' },
  { _id: 'v3', plateNumber: '01 C 789 EF', brand: 'Mercedes', currentDriver: 'd3' },
  { _id: 'v4', plateNumber: '01 D 012 GH', brand: 'Scania', currentDriver: 'd4' },
  { _id: 'v5', plateNumber: '01 E 345 IJ', brand: 'DAF', currentDriver: 'd5' }
]

// Davlatlar ro'yxati (katta harfda - backend bilan mos)
export const COUNTRIES = [
  { code: 'UZB', name: "O'zbekiston", flag: '🇺🇿', currency: 'UZS' },
  { code: 'KZ', name: "Qozog'iston", flag: '🇰🇿', currency: 'KZT' },
  { code: 'RU', name: 'Rossiya', flag: '🇷🇺', currency: 'RUB' }
]

// Mashhur shaharlar
export const CITIES = {
  UZB: ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', 'Farg\'ona', 'Nukus', 'Urganch', 'Qarshi', 'Termiz', 'Jizzax', 'Navoiy'],
  KZ: ['Almati', 'Nur-Sultan', 'Shymkent', 'Turkiston', 'Qo\'rg\'ontepa', 'Jambul', 'Qizilorda'],
  RU: ['Moskva', 'Sankt-Peterburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-na-Donu', 'Ufa', 'Volgograd', 'Orenburg']
}

// Status konfiguratsiyasi
export const STATUS_CONFIG = {
  pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-500 to-yellow-600', dot: 'bg-yellow-500' },
  in_progress: { label: "Yo'lda", color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600', dot: 'bg-blue-500' },
  completed: { label: 'Tugatilgan', color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600', dot: 'bg-green-500' },
  cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600', dot: 'bg-red-500' }
}

// Filter tugmalari
export const FILTER_BUTTONS = [
  { value: 'all', label: 'Barchasi' },
  { value: 'in_progress', label: "Yo'lda" },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'completed', label: 'Tugatilgan' },
  { value: 'cancelled', label: 'Bekor' }
]

// Boshlang'ich form holati
export const INITIAL_FORM_STATE = {
  driverId: '', 
  vehicleId: '', 
  startAddress: '', 
  endAddress: '',
  estimatedDuration: '', 
  estimatedDistance: '', 
  tripBudget: '', 
  tripPayment: '',
  startCoords: null, 
  endCoords: null,
  tripType: 'local',
  waypoints: [],
  countriesInRoute: []
}
