import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, AlertTriangle, X, Zap, Truck, BarChart3, Fuel, Droplets, Circle, Wrench, RefreshCw, DollarSign, Sparkles } from 'lucide-react'
import api from '../../services/api'
import { useAlert } from '../../components/ui'
import {
  SummaryTab, FuelTab, OilTab, TiresTab, ServicesTab, IncomeTab,
  initFuelForm, initOilForm, initTireForm, initBulkTireForm, initServiceForm, initIncomeForm, today, TIRE_POSITIONS,
  MaintenanceAlertModal
} from '../../components/fleet/vehicle'
import { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm } from '../../components/fleet/vehicle/VehicleForms'
import { IncomeForm } from '../../components/fleet/vehicle/IncomeTab'

const NAV_ITEMS = [
  { id: 'summary', icon: BarChart3, label: 'Umumiy', color: 'indigo' },
  { id: 'income', icon: DollarSign, label: 'Daromad', color: 'emerald' },
  { id: 'fuel', icon: Fuel, label: 'Yoqilg\'i', color: 'blue' },
  { id: 'oil', icon: Droplets, label: 'Moy', color: 'amber' },
  { id: 'tires', icon: Circle, label: 'Shina', color: 'violet' },
  { id: 'services', icon: Wrench, label: 'Xizmat', color: 'cyan' }
]

export default function VehicleDetailPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()
  const isMounted = useRef(true)

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')

  const [fuelData, setFuelData] = useState({ refills: [], stats: {} })
  const [oilData, setOilData] = useState({ changes: [], status: 'ok', remainingKm: 10000 })
  const [tires, setTires] = useState([])
  const [services, setServices] = useState({ services: [], stats: {} })
  const [incomeData, setIncomeData] = useState({ incomes: [], stats: {} })

  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]) // Texnik xizmat ogohlantirishlari

  const [fuelForm, setFuelForm] = useState(() => initFuelForm())
  const [oilForm, setOilForm] = useState(() => initOilForm())
  const [tireForm, setTireForm] = useState(() => initTireForm())
  const [serviceForm, setServiceForm] = useState(() => initServiceForm())
  const [incomeForm, setIncomeForm] = useState(() => initIncomeForm())
  const [bulkTireForm, setBulkTireForm] = useState(() => initBulkTireForm())

  const [subscription, setSubscription] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')


  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    api.get('/vehicles/subscription')
      .then(res => { if (isMounted.current) setSubscription(res.data.data) })
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (!subscription?.endDate) return
    const update = () => {
      const diff = new Date(subscription.endDate) - new Date()
      if (diff <= 0) {
        setTimeLeft('Tugadi')
        setSubscription(prev => prev ? { ...prev, isExpired: true } : null)
        return
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      setTimeLeft(`${days} kun`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [subscription?.endDate])

  useEffect(() => {
    setLoading(true)
    api.get(`/vehicles/${id}`)
      .then(res => { if (isMounted.current) setVehicle(res.data.data) })
      .catch(() => alert.error('Xatolik', 'Mashina topilmadi'))
      .finally(() => { if (isMounted.current) setLoading(false) })
  }, [id, alert])

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [f, o, t, s, inc] = await Promise.all([
        api.get(`/maintenance/vehicles/${id}/fuel`).catch(() => ({ data: { data: { refills: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${id}/oil`).catch(() => ({ data: { data: { changes: [], status: 'ok', remainingKm: 10000 } } })),
        api.get(`/maintenance/vehicles/${id}/tires`).catch(() => ({ data: { data: [] } })),
        api.get(`/maintenance/vehicles/${id}/services`).catch(() => ({ data: { data: { services: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${id}/income`).catch(() => ({ data: { data: { incomes: [], stats: {} } } }))
      ])
      if (isMounted.current) {
        setFuelData(f.data.data || { refills: [], stats: {} })
        setOilData(o.data.data || { changes: [], status: 'ok', remainingKm: 10000 })
        setTires(t.data.data || [])
        setServices(s.data.data || { services: [], stats: {} })
        setIncomeData(inc.data.data || { incomes: [], stats: {} })
      }
    } catch (err) { /* Error ignored */ }
    finally { if (isMounted.current) setRefreshing(false) }
  }, [id])

  useEffect(() => { if (vehicle) loadData() }, [vehicle, loadData])

  const stats = useMemo(() => ({
    totalFuelCost: fuelData.stats?.totalCost || 0,
    totalOilCost: oilData.changes?.reduce((s, c) => s + (c.cost || 0), 0) || 0,
    totalTireCost: tires.reduce((s, t) => s + (t.cost || 0), 0),
    totalServiceCost: services.stats?.totalCost || 0,
    get totalCost() { return this.totalFuelCost + this.totalOilCost + this.totalTireCost + this.totalServiceCost }
  }), [fuelData.stats?.totalCost, oilData.changes, tires, services.stats?.totalCost])


  const openModal = useCallback((type, item = null) => {
    const odo = vehicle?.currentOdometer?.toString() || ''
    setModal(type)
    setEditId(item?._id || null)
    setErrors({})
    if (type === 'fuel') setFuelForm(item ? { date: item.date?.split('T')[0] || today(), liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', odometer: item.odometer?.toString() || '', fuelType: item.fuelType || 'diesel', station: item.station || '' } : initFuelForm(odo, vehicle?.fuelType || 'diesel'))
    if (type === 'oil') setOilForm(item ? { date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', oilType: item.oilType || '', oilBrand: item.oilBrand || '', liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', nextChangeOdometer: item.nextChangeOdometer?.toString() || '', nextChangeKm: item.nextChangeKm?.toString() || '', oilFilterCost: item.oilFilterCost?.toString() || '', airFilterCost: item.airFilterCost?.toString() || '', cabinFilterCost: item.cabinFilterCost?.toString() || '', gasFilterCost: item.gasFilterCost?.toString() || '' } : initOilForm(odo))
    if (type === 'tire') setTireForm(item ? { position: item.position || TIRE_POSITIONS[0], brand: item.brand || '', model: item.model || '', size: item.size || '', dotNumber: item.dotNumber || '', installDate: item.installDate?.split('T')[0] || today(), installOdometer: item.installOdometer?.toString() || '', expectedLifeKm: item.expectedLifeKm?.toString() || '80000', cost: item.cost?.toString() || '' } : initTireForm(odo))
    if (type === 'service') setServiceForm(item ? { type: item.type || 'TO-1', date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', cost: item.cost?.toString() || '', description: item.description || '', serviceName: item.serviceName || '' } : initServiceForm(odo))
    if (type === 'tire-bulk') setBulkTireForm({ brand: '', size: '', cost: '', count: '4', installOdometer: odo })
    if (type === 'income') setIncomeForm(item ? { type: item.type || 'trip', date: item.date?.split('T')[0] || today(), amount: item.amount?.toString() || '', fromCity: item.fromCity || '', toCity: item.toCity || '', cargoWeight: item.cargoWeight?.toString() || '', clientName: item.clientName || '', rentalDays: item.rentalDays?.toString() || '', rentalRate: item.rentalRate?.toString() || '', description: item.description || '' } : initIncomeForm())
  }, [vehicle?.currentOdometer, vehicle?.fuelType])

  const handleDelete = useCallback(async (type, itemId) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    
    // Optimistic update - darhol UI dan o'chirish
    if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: prev.refills.filter(r => r._id !== itemId) }))
    else if (type === 'oil') setOilData(prev => ({ ...prev, changes: prev.changes.filter(c => c._id !== itemId) }))
    else if (type === 'tires') setTires(prev => prev.filter(t => t._id !== itemId))
    else if (type === 'services') setServices(prev => ({ ...prev, services: prev.services.filter(s => s._id !== itemId) }))
    else if (type === 'income') setIncomeData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i._id !== itemId) }))
    
    alert.success('O\'chirildi')
    
    try { 
      await api.delete(`/maintenance/${type}/${itemId}`)
      // Muvaffaqiyatli o'chirildi - hech narsa qilish shart emas
    } catch (err) {
      alert.error('Xatolik', 'O\'chirishda xatolik yuz berdi')
      // Xatolik bo'lsa ma'lumotlarni qayta yuklash
      loadData()
    }
  }, [alert, loadData])

  const validate = useCallback((type, data) => {
    const e = {}
    const currentOdo = vehicle?.currentOdometer || 0
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Sana validatsiyasi
    if (data.date) {
      const inputDate = new Date(data.date)
      if (inputDate > today) e.date = 'Kelajakdagi sana kiritish mumkin emas'
    }

    // Odometer validatsiyasi
    if (data.odometer) {
      const odo = +data.odometer
      if (odo < 0) e.odometer = 'Salbiy bo\'lishi mumkin emas'
      // Juda katta qiymat
      if (odo > 10000000) e.odometer = 'Juda katta qiymat'
    }

    // Tur bo'yicha validatsiya
    if (type === 'fuel') {
      if (!data.liters || +data.liters <= 0) e.liters = 'Majburiy va musbat'
      else if (+data.liters > 2000) e.liters = 'Juda katta (max 2000)'
      if (!data.cost || +data.cost <= 0) e.cost = 'Majburiy va musbat'
      else if (+data.cost > 100000000) e.cost = 'Juda katta'
    }

    if (type === 'oil') {
      if (!data.oilType) e.oilType = 'Majburiy'
      if (!data.cost || +data.cost <= 0) e.cost = 'Majburiy va musbat'
      else if (+data.cost > 50000000) e.cost = 'Juda katta'
    }

    if (type === 'tire') {
      if (!data.brand) e.brand = 'Majburiy'
      if (data.cost && +data.cost < 0) e.cost = 'Salbiy bo\'lishi mumkin emas'
      if (data.expectedLifeKm && +data.expectedLifeKm > 500000) e.expectedLifeKm = 'Juda katta'
    }

    if (type === 'service') {
      if (!data.cost || +data.cost <= 0) e.cost = 'Majburiy va musbat'
      else if (+data.cost > 500000000) e.cost = 'Juda katta'
    }

    if (type === 'income') {
      // Ijara uchun rentalDays va rentalRate tekshirish
      if (data.type === 'rental') {
        if (!data.rentalDays || +data.rentalDays <= 0) e.rentalDays = 'Kunlar sonini kiriting'
        if (!data.rentalRate || +data.rentalRate <= 0) e.rentalRate = 'Kunlik narxni kiriting'
      } else {
        // Boshqa turlar uchun amount tekshirish
        if (!data.amount || +data.amount <= 0) e.amount = 'Majburiy va musbat'
        else if (+data.amount > 1000000000) e.amount = 'Juda katta'
      }
      if (data.distance && +data.distance < 0) e.distance = 'Salbiy bo\'lishi mumkin emas'
      if (data.distance && +data.distance > 50000) e.distance = 'Juda katta (max 50,000 km)'
    }

    setErrors(e)
    return !Object.keys(e).length
  }, [vehicle?.currentOdometer])

  const handleSubmit = useCallback(async (type, form, endpoint, itemId = null) => {
    if (!validate(type, form)) {
      return
    }
    console.log('✅ Validation passed')
    const body = { ...form }
    
    // Moy uchun nextChangeOdometer ni hisoblash
    if (type === 'oil' && body.nextChangeKm && body.odometer) {
      body.nextChangeOdometer = Number(body.odometer) + Number(body.nextChangeKm)
      delete body.nextChangeKm
    } else if (type === 'oil' && body.nextChangeKm && !body.odometer) {
      // Agar odometer kiritilmagan bo'lsa, mashina hozirgi odometridan hisoblash
      body.nextChangeOdometer = (vehicle?.currentOdometer || 0) + Number(body.nextChangeKm)
      delete body.nextChangeKm
    }
    
    Object.keys(body).forEach(k => {
      if (body[k] === '') delete body[k]
      else if (!isNaN(body[k]) && !['date', 'oilType', 'oilBrand', 'brand', 'model', 'size', 'position', 'type', 'description', 'serviceName', 'fuelType', 'station', 'fromCity', 'toCity', 'clientName'].includes(k)) body[k] = +body[k]
    })
    setModal(null)
    setEditId(null)

    alert.success(itemId ? 'Yangilandi' : 'Saqlanmoqda...')
    const apiType = type === 'tire' ? 'tires' : type === 'service' ? 'services' : type
    try {
      let response
      if (itemId) {
        response = await api.put(`/maintenance/${apiType}/${itemId}`, body)
      } else {
        response = await api.post(endpoint, body)
      }
      
      // Yoqilg'i qo'shilganda alertlarni tekshirish
      if (type === 'fuel' && response.data?.data?.alerts?.length > 0) {
        setMaintenanceAlerts(response.data.data.alerts)
      }
      
      // Moy almashtirilganda - moy alertlarini tozalash
      if (type === 'oil' && !itemId) {
        setMaintenanceAlerts(prev => prev.filter(a => a.type !== 'oil'))
        setOilData(prev => ({
          ...prev,
          status: 'ok',
          remainingKm: body.nextChangeOdometer ? body.nextChangeOdometer - (body.odometer || vehicle?.currentOdometer || 0) : 10000
        }))
      }
      
      // Shina almashtirilganda - tegishli shina alertlarini tozalash
      if (type === 'tire' && !itemId) {
        const tirePosition = form.position || ''
        setMaintenanceAlerts(prev => prev.filter(a => {
          if (a.type !== 'tire') return true
          return !a.message?.toLowerCase().includes(tirePosition.toLowerCase())
        }))
      }
      
      // API dan kelgan yangi ma'lumotni state ga qo'shish
      if (response.data?.data) {
        const savedItem = response.data.data
        if (type === 'fuel') {
          setFuelData(prev => ({
            ...prev,
            refills: itemId 
              ? prev.refills.map(r => r._id === itemId ? savedItem : r)
              : [savedItem, ...prev.refills],
            stats: {
              ...prev.stats,
              totalLiters: (prev.stats?.totalLiters || 0) + (itemId ? 0 : (savedItem.liters || 0)),
              totalCost: (prev.stats?.totalCost || 0) + (itemId ? 0 : (savedItem.cost || 0))
            }
          }))
        } else if (type === 'oil') {
          setOilData(prev => ({
            ...prev,
            changes: itemId 
              ? prev.changes.map(c => c._id === itemId ? savedItem : c)
              : [savedItem, ...prev.changes],
            status: 'ok', // Moy almashtirildi
            remainingKm: savedItem.nextChangeOdometer ? savedItem.nextChangeOdometer - (savedItem.odometer || vehicle?.currentOdometer || 0) : 10000
          }))
        } else if (type === 'tire') {
          setTires(prev => itemId 
            ? prev.map(t => t._id === itemId ? savedItem : t)
            : [...prev, savedItem]
          )
        } else if (type === 'service') {
          setServices(prev => ({
            ...prev,
            services: itemId 
              ? prev.services.map(s => s._id === itemId ? savedItem : s)
              : [savedItem, ...prev.services],
            stats: {
              ...prev.stats,
              totalCost: (prev.stats?.totalCost || 0) + (itemId ? 0 : (savedItem.cost || 0))
            }
          }))
        } else if (type === 'income') {
          setIncomeData(prev => ({
            ...prev,
            incomes: itemId 
              ? prev.incomes.map(i => i._id === itemId ? savedItem : i)
              : [savedItem, ...prev.incomes],
            stats: {
              ...prev.stats,
              totalIncome: (prev.stats?.totalIncome || 0) + (itemId ? 0 : (savedItem.amount || 0))
            }
          }))
        }
        alert.success(itemId ? 'Yangilandi' : 'Saqlandi')
      }
    } catch (err) {
      console.error('Saqlashda xatolik:', err)
      alert.error('Xatolik', 'Ma\'lumot saqlanmadi')
      // Xatolik bo'lsa ma'lumotlarni qayta yuklash
      loadData()
    }
  }, [validate, alert, loadData, vehicle?.currentOdometer])


  const handleAddFuel = useCallback((e) => { e.preventDefault(); handleSubmit('fuel', fuelForm, `/maintenance/vehicles/${id}/fuel`, editId) }, [fuelForm, id, handleSubmit, editId])
  const handleAddOil = useCallback((e) => { e.preventDefault(); handleSubmit('oil', oilForm, `/maintenance/vehicles/${id}/oil`, editId) }, [oilForm, id, handleSubmit, editId])
  const handleAddTire = useCallback((e) => { e.preventDefault(); handleSubmit('tire', tireForm, `/maintenance/vehicles/${id}/tires`, editId) }, [tireForm, id, handleSubmit, editId])
  const handleAddService = useCallback((e) => { e.preventDefault(); handleSubmit('service', serviceForm, `/maintenance/vehicles/${id}/services`, editId) }, [serviceForm, id, handleSubmit, editId])
  const handleAddIncome = useCallback((e) => { e.preventDefault(); handleSubmit('income', incomeForm, `/maintenance/vehicles/${id}/income`, editId) }, [incomeForm, id, handleSubmit, editId])

  const handleAddBulkTires = useCallback(async (e) => {
    e.preventDefault()
    if (!bulkTireForm.brand) { setErrors({ brand: 'Majburiy' }); return }
    const count = parseInt(bulkTireForm.count) || 4
    const positions = count === 6 ? ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)'] : ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng']
    setModal(null)
    
    setMaintenanceAlerts(prev => prev.filter(a => a.type !== 'tire'))
    
    const tempIds = positions.map((_, i) => `temp_${Date.now()}_${i}`)
    const newTires = positions.map((position, i) => ({ _id: tempIds[i], position, brand: bulkTireForm.brand, size: bulkTireForm.size || '', remainingKm: 50000, status: 'new' }))
    setTires(prev => [...prev, ...newTires])
    alert.success(`${count} ta shina qo'shildi`)
    
    try {
      const responses = await Promise.all(positions.map(position => api.post(`/maintenance/vehicles/${id}/tires`, { position, brand: bulkTireForm.brand, size: bulkTireForm.size || '', installDate: today(), installOdometer: bulkTireForm.installOdometer ? +bulkTireForm.installOdometer : 0, expectedLifeKm: 50000, cost: bulkTireForm.cost ? Math.round(+bulkTireForm.cost / count) : 0 })))
      const savedTires = responses.map(r => r.data?.data).filter(Boolean)
      if (savedTires.length > 0) {
        setTires(prev => {
          const withoutTemp = prev.filter(t => !tempIds.includes(t._id))
          return [...withoutTemp, ...savedTires]
        })
      }
    } catch (err) {
      console.error('Shinalar saqlashda xatolik:', err)
      loadData()
    }
  }, [bulkTireForm, id, alert, loadData])

  // Ovozli yoqilg'i qo'shish
  const handleVoiceFuel = useCallback(async (voiceData) => {
    const fuelTypeMap = {
      'fuel_metan': 'metan',
      'fuel_benzin': 'benzin',
      'fuel_diesel': 'diesel',
      'fuel_propan': 'propan',
      'fuel_gas': 'gas'
    }
    
    const fuelType = fuelTypeMap[voiceData.type] || vehicle?.fuelType || 'diesel'
    const liters = voiceData.quantity || 0
    const cost = voiceData.amount || 0
    const odometer = vehicle?.currentOdometer || 0
    
    const tempId = `temp_${Date.now()}`
    const newRefill = {
      _id: tempId,
      date: new Date().toISOString(),
      liters,
      cost,
      odometer,
      fuelType,
      station: voiceData.description || 'Ovoz orqali kiritildi'
    }
    
    setFuelData(prev => ({
      ...prev,
      refills: [newRefill, ...prev.refills],
      stats: {
        ...prev.stats,
        totalLiters: (prev.stats?.totalLiters || 0) + liters,
        totalCost: (prev.stats?.totalCost || 0) + cost
      }
    }))
    
    alert.success('🎤 Yoqilg\'i qo\'shildi!')
    
    try {
      const response = await api.post(`/maintenance/vehicles/${id}/fuel`, {
        date: new Date().toISOString().split('T')[0],
        liters,
        cost,
        odometer,
        fuelType,
        station: voiceData.description || 'Ovoz orqali kiritildi'
      })
      
      if (response.data?.data?.alerts?.length > 0) {
        setMaintenanceAlerts(response.data.data.alerts)
      }
      
      if (response.data?.data) {
        setFuelData(prev => ({
          ...prev,
          refills: prev.refills.map(r => r._id === tempId ? response.data.data : r)
        }))
      }
    } catch (err) {
      console.error('Yoqilg\'i saqlashda xatolik:', err)
      loadData()
    }
  }, [id, vehicle?.fuelType, vehicle?.currentOdometer, alert, loadData])

  // Ovozli moy qo'shish
  const handleVoiceOil = useCallback(async (voiceData) => {
    const cost = Number(voiceData.cost) || 0
    const odometer = Number(voiceData.odometer) || vehicle?.currentOdometer || 0
    
    const tempId = `temp_${Date.now()}`
    const newChange = {
      _id: tempId,
      date: new Date().toISOString(),
      oilType: voiceData.oilType || '',
      oilBrand: voiceData.oilBrand || '',
      liters: Number(voiceData.liters) || 0,
      cost,
      odometer,
      nextChangeOdometer: Number(voiceData.nextChangeOdometer) || odometer + 10000
    }
    
    setOilData(prev => ({
      ...prev,
      changes: [newChange, ...prev.changes],
      status: 'ok',
      remainingKm: 10000
    }))
    
    setMaintenanceAlerts(prev => prev.filter(a => a.type !== 'oil'))
    alert.success('🎤 Moy almashtirish qo\'shildi!')
    
    try {
      const response = await api.post(`/maintenance/vehicles/${id}/oil`, {
        date: new Date().toISOString().split('T')[0],
        oilType: voiceData.oilType || '',
        oilBrand: voiceData.oilBrand || '',
        liters: Number(voiceData.liters) || 0,
        cost,
        odometer,
        nextChangeOdometer: Number(voiceData.nextChangeOdometer) || odometer + 10000
      })
      // Serverdan kelgan ma'lumot bilan yangilash
      if (response.data?.data) {
        const savedItem = response.data.data
        setOilData(prev => ({
          ...prev,
          changes: prev.changes.map(c => c._id === tempId ? savedItem : c),
          status: 'ok',
          remainingKm: savedItem.nextChangeOdometer ? savedItem.nextChangeOdometer - (savedItem.odometer || 0) : 10000
        }))
      }
    } catch (err) {
      console.error('Moy saqlashda xatolik:', err)
      loadData() // Faqat xatolikda qayta yuklash
    }
  }, [id, vehicle?.currentOdometer, alert, loadData])

  // Ovozli shina qo'shish
  const handleVoiceTire = useCallback(async (voiceData) => {
    const cost = Number(voiceData.cost) || 0
    const count = Number(voiceData.count) || 1
    const installOdometer = Number(voiceData.installOdometer) || Number(voiceData.odometer) || vehicle?.currentOdometer || 0
    const tirePosition = voiceData.position || 'Old chap'
    
    setMaintenanceAlerts(prev => prev.filter(a => {
      if (a.type !== 'tire') return true
      if (count > 1) return false
      return !a.message?.toLowerCase().includes(tirePosition.toLowerCase())
    }))
    
    if (count > 1) {
      const positions = count === 6 
        ? ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)']
        : ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng'].slice(0, count)
      
      const tempIds = positions.map((_, i) => `temp_${Date.now()}_${i}`)
      const newTires = positions.map((position, i) => ({
        _id: tempIds[i],
        position,
        brand: voiceData.brand || '',
        size: voiceData.size || '',
        installDate: new Date().toISOString(),
        installOdometer,
        expectedLifeKm: 50000,
        cost: Math.round(cost / count),
        remainingKm: 50000,
        status: 'new'
      }))
      
      setTires(prev => [...prev, ...newTires])
      alert.success(`🎤 ${count} ta shina qo'shildi!`)
      
      try {
        const responses = await Promise.all(positions.map(position => 
          api.post(`/maintenance/vehicles/${id}/tires`, {
            position,
            brand: voiceData.brand || '',
            size: voiceData.size || '',
            installDate: new Date().toISOString().split('T')[0],
            installOdometer,
            expectedLifeKm: 50000,
            cost: Math.round(cost / count)
          })
        ))
        // Serverdan kelgan ma'lumotlar bilan yangilash
        const savedTires = responses.map(r => r.data?.data).filter(Boolean)
        if (savedTires.length > 0) {
          setTires(prev => {
            const withoutTemp = prev.filter(t => !tempIds.includes(t._id))
            return [...withoutTemp, ...savedTires]
          })
        }
      } catch (err) {
        console.error('Shinalar saqlashda xatolik:', err)
        loadData()
      }
    } else {
      const tempId = `temp_${Date.now()}`
      const newTire = {
        _id: tempId,
        position: tirePosition,
        brand: voiceData.brand || '',
        size: voiceData.size || '',
        installDate: new Date().toISOString(),
        installOdometer,
        expectedLifeKm: 50000,
        cost,
        remainingKm: 50000,
        status: 'new'
      }
      
      setTires(prev => [...prev, newTire])
      alert.success('🎤 Shina qo\'shildi!')
      
      try {
        const response = await api.post(`/maintenance/vehicles/${id}/tires`, {
          position: tirePosition,
          brand: voiceData.brand || '',
          size: voiceData.size || '',
          installDate: new Date().toISOString().split('T')[0],
          installOdometer,
          expectedLifeKm: 50000,
          cost
        })
        if (response.data?.data) {
          setTires(prev => prev.map(t => t._id === tempId ? response.data.data : t))
        }
      } catch (err) {
        console.error('Shina saqlashda xatolik:', err)
        loadData()
      }
    }
  }, [id, vehicle?.currentOdometer, alert, loadData])

  // Ovozli xizmat qo'shish
  const handleVoiceService = useCallback(async (voiceData) => {
    const cost = Number(voiceData.cost) || 0
    const odometer = Number(voiceData.odometer) || vehicle?.currentOdometer || 0
    
    const tempId = `temp_${Date.now()}`
    const newService = {
      _id: tempId,
      type: voiceData.type || 'TO-1',
      date: new Date().toISOString(),
      odometer,
      cost,
      description: voiceData.description || '',
      serviceName: voiceData.serviceName || ''
    }
    
    setServices(prev => ({
      ...prev,
      services: [newService, ...prev.services],
      stats: {
        ...prev.stats,
        totalCost: (prev.stats?.totalCost || 0) + cost
      }
    }))
    
    alert.success('🎤 Xizmat qo\'shildi!')
    
    try {
      const response = await api.post(`/maintenance/vehicles/${id}/services`, {
        type: voiceData.type || 'TO-1',
        date: new Date().toISOString().split('T')[0],
        odometer,
        cost,
        description: voiceData.description || '',
        serviceName: voiceData.serviceName || ''
      })
      if (response.data?.data) {
        setServices(prev => ({
          ...prev,
          services: prev.services.map(s => s._id === tempId ? response.data.data : s)
        }))
      }
    } catch (err) {
      console.error('Xizmat saqlashda xatolik:', err)
      loadData()
    }
  }, [id, vehicle?.currentOdometer, alert, loadData])

  // Ovozli daromad qo'shish
  const handleVoiceIncome = useCallback(async (voiceData) => {
    const amount = Number(voiceData.amount) || 0
    
    const tempId = `temp_${Date.now()}`
    const newIncome = {
      _id: tempId,
      type: voiceData.type || 'trip',
      date: new Date().toISOString(),
      amount,
      fromCity: voiceData.fromCity || '',
      toCity: voiceData.toCity || '',
      distance: Number(voiceData.distance) || 0,
      cargoWeight: Number(voiceData.cargoWeight) || 0,
      clientName: voiceData.clientName || '',
      rentalDays: Number(voiceData.rentalDays) || 0,
      rentalRate: Number(voiceData.rentalRate) || 0,
      description: voiceData.description || ''
    }
    
    setIncomeData(prev => ({
      ...prev,
      incomes: [newIncome, ...prev.incomes],
      stats: {
        ...prev.stats,
        totalIncome: (prev.stats?.totalIncome || 0) + amount
      }
    }))
    
    alert.success('🎤 Daromad qo\'shildi!')
    
    try {
      const response = await api.post(`/maintenance/vehicles/${id}/income`, {
        type: voiceData.type || 'trip',
        date: new Date().toISOString().split('T')[0],
        amount,
        fromCity: voiceData.fromCity || '',
        toCity: voiceData.toCity || '',
        distance: Number(voiceData.distance) || 0,
        cargoWeight: Number(voiceData.cargoWeight) || 0,
        clientName: voiceData.clientName || '',
        rentalDays: Number(voiceData.rentalDays) || 0,
        rentalRate: Number(voiceData.rentalRate) || 0,
        description: voiceData.description || ''
      })
      if (response.data?.data) {
        setIncomeData(prev => ({
          ...prev,
          incomes: prev.incomes.map(i => i._id === tempId ? response.data.data : i)
        }))
      }
    } catch (err) {
      console.error('Daromad saqlashda xatolik:', err)
      loadData()
    }
  }, [id, alert, loadData])

  if (loading) return <LoadingSkeleton />
  if (!vehicle) return <NotFound onBack={() => navigate('/fleet')} />
  if (subscription?.isExpired) return <ExpiredView onUpgrade={() => setShowUpgradeModal(true)} />

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#f8fafc' }}>
      {/* PRO Sidebar - Desktop - Fixed, NO scroll */}
      <aside 
        className="hidden lg:flex lg:flex-col w-[260px] bg-white border-r border-slate-200/60 z-40"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, overflow: 'hidden' }}
      >
        {/* Back Button */}
        <div className="flex-shrink-0 p-4 border-b border-slate-100">
          <button onClick={() => navigate('/fleet')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Avtoparkga qaytish
          </button>
        </div>

        {/* Vehicle Info */}
        <div className="flex-shrink-0 p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{vehicle?.plateNumber}</h2>
              <p className="text-sm text-slate-500">{vehicle?.brand} {vehicle?.model}</p>
            </div>
          </div>
        </div>

        {/* Navigation - NO scroll */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setModal(null); setEditId(null) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-600 hover:bg-slate-100'
                }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === item.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                <item.icon size={16} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Subscription - Fixed at bottom */}
        {subscription?.plan === 'trial' && (
          <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-white">
            <button onClick={() => setShowUpgradeModal(true)} className="w-full flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl font-semibold border border-amber-200">
              <Crown size={18} />
              <span>{timeLeft} qoldi</span>
            </button>
          </div>
        )}
      </aside>


      {/* Main Content - scrollable with bottom padding for nav */}
      <main 
        className="lg:ml-[260px] overflow-y-auto lg:pb-8 pb-32"
        style={{ 
          height: '100vh', 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* PRO Header - Full Width */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button onClick={() => navigate('/fleet')} className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 flex-shrink-0">
                  <ArrowLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
                </button>
                <div className="lg:hidden w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{vehicle.plateNumber}</h1>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{vehicle.brand} {vehicle.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                {subscription?.plan === 'trial' && (
                  <button onClick={() => setShowUpgradeModal(true)} className="lg:hidden flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-amber-50 text-amber-700 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border border-amber-200">
                    <Crown size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="whitespace-nowrap">{timeLeft}</span>
                  </button>
                )}
                <button onClick={loadData} disabled={refreshing} className="p-2 sm:p-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all">
                  <RefreshCw size={18} className={`sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content - Full Width */}
        <div className="p-4 lg:p-6 xl:p-8 w-full pb-36 lg:pb-8">
          {activeTab === 'summary' && <SummaryTab vehicle={vehicle} />}
          {activeTab === 'income' && <IncomeTab data={incomeData} onAdd={() => openModal('income')} onEdit={(item) => openModal('income', item)} onDelete={(i) => handleDelete('income', i)} onVoiceAdd={handleVoiceIncome} />}
          {activeTab === 'fuel' && <FuelTab data={fuelData} onAdd={() => openModal('fuel')} onEdit={(item) => openModal('fuel', item)} onDelete={(i) => handleDelete('fuel', i)} vehicleId={id} onVoiceAdd={handleVoiceFuel} vehicle={vehicle} />}
          {activeTab === 'oil' && <OilTab data={oilData} onAdd={() => openModal('oil')} onEdit={(item) => openModal('oil', item)} onDelete={(i) => handleDelete('oil', i)} onVoiceAdd={handleVoiceOil} />}
          {activeTab === 'tires' && <TiresTab tires={tires} onAdd={() => openModal('tire')} onAddBulk={() => openModal('tire-bulk')} onEdit={(item) => openModal('tire', item)} onDelete={(i) => handleDelete('tires', i)} onVoiceAdd={handleVoiceTire} />}
          {activeTab === 'services' && <ServicesTab data={services} onAdd={() => openModal('service')} onEdit={(item) => openModal('service', item)} onDelete={(i) => handleDelete('services', i)} onVoiceAdd={handleVoiceService} />}
        </div>
      </main>

      {/* PRO Bottom Navigation - Mobile - Fixed at bottom */}
      <nav 
        className="lg:hidden bg-white border-t border-slate-200/80 fixed-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setModal(null); setEditId(null) }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === item.id
                ? 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25'
                : ''
                }`}>
                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500'} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
              </div>
              <span className={`text-[10px] font-semibold ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {modal && (
        <Modal title={modal === 'tire-bulk' ? 'To\'liq shina almashtirish' : `${modal === 'fuel' ? 'Yoqilg\'i' : modal === 'oil' ? 'Moy' : modal === 'tire' ? 'Shina' : modal === 'income' ? 'Daromad' : 'Xizmat'} ${editId ? 'tahrirlash' : 'qo\'shish'}`} onClose={() => { setModal(null); setEditId(null) }}>
          {modal === 'fuel' && <FuelForm form={fuelForm} setForm={setFuelForm} errors={errors} onSubmit={handleAddFuel} isEdit={!!editId} vehicle={vehicle} oilData={oilData} tires={tires} />}
          {modal === 'oil' && <OilForm form={oilForm} setForm={setOilForm} errors={errors} onSubmit={handleAddOil} isEdit={!!editId} />}
          {modal === 'tire' && <TireForm form={tireForm} setForm={setTireForm} errors={errors} onSubmit={handleAddTire} isEdit={!!editId} vehicleOdometer={vehicle?.currentOdometer} />}
          {modal === 'tire-bulk' && <BulkTireForm form={bulkTireForm} setForm={setBulkTireForm} errors={errors} onSubmit={handleAddBulkTires} vehicleOdometer={vehicle?.currentOdometer} />}
          {modal === 'service' && <ServiceForm form={serviceForm} setForm={setServiceForm} errors={errors} onSubmit={handleAddService} isEdit={!!editId} />}
          {modal === 'income' && <IncomeForm form={incomeForm} setForm={setIncomeForm} errors={errors} onSubmit={handleAddIncome} isEdit={!!editId} />}
        </Modal>
      )}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      
      {/* Texnik xizmat ogohlantirishlari */}
      {maintenanceAlerts.length > 0 && (
        <MaintenanceAlertModal 
          alerts={maintenanceAlerts} 
          onClose={() => setMaintenanceAlerts([])} 
        />
      )}
    </div>
  )
}


const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-20 bg-white rounded-2xl border-2 border-slate-200" />
      <div className="h-48 bg-white rounded-2xl border-2 border-slate-200" />
      <div className="h-64 bg-white rounded-2xl border-2 border-slate-200" />
    </div>
  </div>
)

const NotFound = ({ onBack }) => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
    <div className="text-center">
      <p className="text-slate-600 text-lg mb-4">Mashina topilmadi</p>
      <button onClick={onBack} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/25">
        Orqaga
      </button>
    </div>
  </div>
)

const ExpiredView = ({ onUpgrade }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 border-red-200">
        <AlertTriangle className="w-12 h-12 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Obuna tugadi</h1>
      <p className="text-slate-500 mb-8">Davom etish uchun Pro tarifga o'ting</p>
      <button onClick={onUpgrade} className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl text-white font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25">
        <Crown size={20} /> Pro ga o'tish
      </button>
    </div>
  </div>
)

const UpgradeModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-md border-2 border-slate-200 shadow-2xl">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pro Tarif</h2>
            <p className="text-sm text-slate-500">50,000 so'm/oy</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-4">
        {['Cheksiz mashinalar', 'Yoqilg\'i nazorati', 'Moy va shina tarixi', 'Xizmat hisoboti'].map(f => (
          <div key={f} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span className="text-slate-700 font-medium">{f}</span>
          </div>
        ))}
        <a href="tel:+998880191909" className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
          <Sparkles className="w-5 h-5" />
          +998 88 019 19 09
        </a>
      </div>
    </div>
  </div>
)
