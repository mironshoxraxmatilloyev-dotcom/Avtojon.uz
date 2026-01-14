export const STATUS = {
  excellent: { label: 'A\'lo', color: 'emerald' },
  normal: { label: 'Yaxshi', color: 'blue' },
  attention: { label: 'Diqqat', color: 'amber' },
  critical: { label: 'Kritik', color: 'red' }
}

export const OIL_STATUS = {
  ok: { label: 'Yaxshi', color: 'emerald' },
  approaching: { label: 'Yaqin', color: 'amber' },
  overdue: { label: 'O\'tgan', color: 'red' }
}

export const TIRE_STATUS = {
  new: { label: 'Yangi', color: 'emerald' },
  used: { label: 'Ishlatilgan', color: 'blue' },
  worn: { label: 'Eskirgan', color: 'red' }
}

export const TIRE_POSITIONS = ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)', 'Zaxira']
export const SERVICE_TYPES = ['TO-1', 'TO-2', 'Moy almashtirish', 'Tormoz', 'Shina', 'Dvigatel', 'Uzatmalar qutisi', 'Elektrika', 'Kuzov', 'Boshqa']
export const EXPENSE_TYPES = [
  { value: 'insurance', label: 'Sug\'urta' },
  { value: 'tax', label: 'Soliq' },
  { value: 'parking', label: 'Parkovka' },
  { value: 'toll', label: 'Yo\'l to\'lovi' },
  { value: 'fine', label: 'Jarima' },
  { value: 'wash', label: 'Yuvish' },
  { value: 'other', label: 'Boshqa' }
]
export const FUEL_TYPES = [
  { value: 'diesel', label: 'Dizel' },
  { value: 'petrol', label: 'Benzin' },
  { value: 'gas', label: 'Gaz' },
  { value: 'metan', label: 'Metan' }
]

export const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
export const today = () => new Date().toISOString().split('T')[0]

export const initFuelForm = (odo = '', ft = 'diesel') => ({ 
  date: today(), liters: '', cost: '', odometer: '', fuelType: ft, station: '' 
})
export const initOilForm = (odo = '') => ({ 
  date: today(), odometer: '', oilType: '', oilBrand: '', liters: '', cost: '', nextChangeKm: '',
  oilFilterCost: undefined, airFilterCost: undefined, cabinFilterCost: undefined, gasFilterCost: undefined
})
export const initTireForm = (odo = '') => ({ 
  position: TIRE_POSITIONS[0], 
  brand: '', 
  model: '', 
  size: '', 
  dotNumber: '', 
  serialNumber: '', 
  installDate: today(), 
  installOdometer: odo || '', 
  expectedLifeKm: '80000', 
  cost: '' 
})
export const initBulkTireForm = (odo = '') => ({
  brand: '', 
  model: '', 
  size: '', 
  dotNumber: '', 
  serialNumber: '', 
  count: '4', 
  cost: '', 
  installOdometer: odo || ''
})
export const initServiceForm = (odo = '') => ({ 
  type: SERVICE_TYPES[0], date: today(), odometer: '', cost: '', description: '', serviceName: '' 
})
export const initIncomeForm = () => ({
  type: 'trip', date: today(), amount: '', fromCity: '', toCity: '', 
  cargoWeight: '', clientName: '', description: ''
})
export const initExpenseForm = () => ({
  type: 'other', date: today(), amount: '', description: ''
})
