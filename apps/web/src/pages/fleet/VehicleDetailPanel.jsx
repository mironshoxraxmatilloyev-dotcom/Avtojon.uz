import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Car, Fuel, Droplets, Circle, Wrench, Plus, X, Trash2, RefreshCw,
  BarChart3, AlertTriangle, Check, Edit2, TrendingUp, Zap, Crown, Clock, Home
} from 'lucide-react'
import api from '../../services/api'
import { useAlert } from '../../components/ui'

const STATUS = {
  excellent: { label: 'A\'lo', color: 'text-emerald-400', bg: 'bg-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600' },
  normal: { label: 'Yaxshi', color: 'text-blue-400', bg: 'bg-blue-500/20', gradient: 'from-blue-500 to-blue-600' },
  attention: { label: 'Diqqat', color: 'text-amber-400', bg: 'bg-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
  critical: { label: 'Kritik', color: 'text-red-400', bg: 'bg-red-500/20', gradient: 'from-red-500 to-red-600' }
}
const OIL_STATUS = {
  ok: { label: 'Yaxshi', color: 'text-emerald-400', bg: 'bg-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600' },
  approaching: { label: 'Yaqin', color: 'text-amber-400', bg: 'bg-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
  overdue: { label: 'O\'tgan', color: 'text-red-400', bg: 'bg-red-500/20', gradient: 'from-red-500 to-red-600' }
}
const TIRE_STATUS = {
  new: { label: 'Yangi', color: 'text-emerald-400', bg: 'bg-emerald-500' },
  used: { label: 'Ishlatilgan', color: 'text-blue-400', bg: 'bg-blue-500' },
  worn: { label: 'Eskirgan', color: 'text-red-400', bg: 'bg-red-500' }
}
const TIRE_POSITIONS = ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)', 'Zaxira']
const SERVICE_TYPES = ['TO-1', 'TO-2', 'Moy almashtirish', 'Tormoz', 'Shina', 'Dvigatel', 'Uzatmalar qutisi', 'Elektrika', 'Kuzov', 'Boshqa']
const FUEL_TYPES = [{ value: 'diesel', label: 'Dizel' }, { value: 'petrol', label: 'Benzin' }, { value: 'gas', label: 'Gaz' }, { value: 'metan', label: 'Metan' }]

const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
const today = () => new Date().toISOString().split('T')[0]
const initFuelForm = (odo = '', ft = 'diesel') => ({ date: today(), liters: '', cost: '', odometer: odo, fuelType: ft, station: '' })
const initOilForm = (odo = '') => ({ date: today(), odometer: odo, oilType: '', oilBrand: '', liters: '', cost: '', nextChangeOdometer: '' })
const initTireForm = (odo = '') => ({ position: TIRE_POSITIONS[0], brand: '', model: '', size: '', installDate: today(), installOdometer: odo, expectedLifeKm: 50000, cost: '' })
const initServiceForm = (odo = '') => ({ type: SERVICE_TYPES[0], date: today(), odometer: odo, cost: '', description: '', serviceName: '' })

export default function VehicleDetailPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()
  const isMounted = useRef(true)

  // State - cache yo'q, to'g'ridan-to'g'ri MongoDB dan
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('summary')
  const [fuelData, setFuelData] = useState({ refills: [], stats: {} })
  const [oilData, setOilData] = useState({ changes: [], status: 'ok', remainingKm: 10000 })
  const [tires, setTires] = useState([])
  const [services, setServices] = useState({ services: [], stats: {} })
  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [fuelForm, setFuelForm] = useState(() => initFuelForm())
  const [oilForm, setOilForm] = useState(() => initOilForm())
  const [tireForm, setTireForm] = useState(() => initTireForm())
  const [serviceForm, setServiceForm] = useState(() => initServiceForm())
  const [bulkTireForm, setBulkTireForm] = useState({ brand: '', size: '', cost: '', count: '4' })

  // Cleanup
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Obuna state
  const [subscription, setSubscription] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  // Obuna yuklash
  useEffect(() => {
    api.get('/vehicles/subscription')
      .then(res => { if (isMounted.current) setSubscription(res.data.data) })
      .catch(() => {})
  }, [])

  // Qolgan vaqtni hisoblash
  useEffect(() => {
    if (!subscription?.endDate) return
    
    const updateTimeLeft = () => {
      const now = new Date()
      const end = new Date(subscription.endDate)
      const diff = end - now
      
      if (diff <= 0) {
        setTimeLeft('Muddat tugadi')
        setSubscription(prev => prev ? { ...prev, isExpired: true, canUse: false } : null)
        return
      }
      
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      
      if (days > 0) setTimeLeft(`${days} kun ${hours} soat`)
      else if (hours > 0) setTimeLeft(`${hours} soat ${minutes} daqiqa`)
      else setTimeLeft(`${minutes} daqiqa`)
    }
    
    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // Har daqiqada
    return () => clearInterval(interval)
  }, [subscription?.endDate])

  // Pro ga o'tish
  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const { data } = await api.post('/vehicles/subscription/upgrade')
      setSubscription(data.data)
      setShowUpgradeModal(false)
      alert.success('Tabriklaymiz!', 'Pro tarifga muvaffaqiyatli o\'tdingiz!')
    } catch (err) {
      alert.error('Xatolik', err.userMessage || 'Xatolik yuz berdi')
    } finally {
      setUpgrading(false)
    }
  }

  // 🚀 INSTANT: Vehicle yuklash - cache bor bo'lsa loading yo'q
  useEffect(() => {
    const hasCache = getVehicleCache(id)?.vehicle
    if (!hasCache) setLoading(true)
    
    api.get(`/vehicles/${id}`)
      .then(res => { 
        if (isMounted.current) setVehicle(res.data.data)
      })
      .catch(() => alert.error('Xatolik', 'Mashina topilmadi'))
      .finally(() => { if (isMounted.current) setLoading(false) })
  }, [id])

  // Ma'lumotlarni yuklash funksiyasi
  const loadData = useCallback(async () => {
    if (!vehicle) return
    try {
      const [f, o, t, s] = await Promise.all([
        api.get(`/maintenance/vehicles/${id}/fuel`).catch(() => ({ data: { data: { refills: [], stats: {} } } })),
        api.get(`/maintenance/vehicles/${id}/oil`).catch(() => ({ data: { data: { changes: [], status: 'ok', remainingKm: 10000 } } })),
        api.get(`/maintenance/vehicles/${id}/tires`).catch(() => ({ data: { data: [] } })),
        api.get(`/maintenance/vehicles/${id}/services`).catch(() => ({ data: { data: { services: [], stats: {} } } }))
      ])
      if (isMounted.current) {
        setFuelData(f.data.data || { refills: [], stats: {} })
        setOilData(o.data.data || { changes: [], status: 'ok', remainingKm: 10000 })
        setTires(t.data.data || [])
        setServices(s.data.data || { services: [], stats: {} })
      }
    } catch (err) {
      console.error('Data yuklashda xatolik:', err)
    }
  }, [vehicle, id])

  // Vehicle yuklanganda ma'lumotlarni yuklash
  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => ({
    totalFuelCost: fuelData.stats?.totalCost || 0,
    totalOilCost: oilData.changes?.reduce((s, c) => s + (c.cost || 0), 0) || 0,
    totalTireCost: tires.reduce((s, t) => s + (t.cost || 0), 0),
    totalServiceCost: services.stats?.totalCost || 0,
    get totalCost() { return this.totalFuelCost + this.totalOilCost + this.totalTireCost + this.totalServiceCost }
  }), [fuelData.stats?.totalCost, oilData.changes, tires, services.stats?.totalCost])

  const overallStatus = useMemo(() => {
    if (oilData.status === 'overdue') return 'critical'
    if (oilData.status === 'approaching' || tires.some(t => (t.calculatedStatus || t.status) === 'worn')) return 'attention'
    return vehicle?.status || 'normal'
  }, [oilData.status, tires, vehicle?.status])

  const openModal = useCallback((type, item = null) => {
    const odo = vehicle?.currentOdometer?.toString() || ''
    setModal(type)
    setEditId(item?._id || null)
    setErrors({})
    if (type === 'fuel') {
      if (item) setFuelForm({ date: item.date?.split('T')[0] || today(), liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', odometer: item.odometer?.toString() || '', fuelType: item.fuelType || 'diesel', station: item.station || '' })
      else setFuelForm(initFuelForm(odo, vehicle?.fuelType || 'diesel'))
    }
    if (type === 'oil') {
      if (item) setOilForm({ date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', oilType: item.oilType || '', oilBrand: item.oilBrand || '', liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', nextChangeOdometer: item.nextChangeOdometer?.toString() || '' })
      else setOilForm(initOilForm(odo))
    }
    if (type === 'tire') {
      if (item) setTireForm({ position: item.position || TIRE_POSITIONS[0], brand: item.brand || '', model: item.model || '', size: item.size || '', installDate: item.installDate?.split('T')[0] || today(), installOdometer: item.installOdometer?.toString() || '', expectedLifeKm: item.expectedLifeKm?.toString() || '50000', cost: item.cost?.toString() || '' })
      else setTireForm(initTireForm(odo))
    }
    if (type === 'service') {
      if (item) setServiceForm({ type: item.type || SERVICE_TYPES[0], date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', cost: item.cost?.toString() || '', description: item.description || '', serviceName: item.serviceName || '' })
      else setServiceForm(initServiceForm(odo))
    }
    if (type === 'tire-bulk') {
      setBulkTireForm({ brand: '', size: '', cost: '', count: '4', installOdometer: odo })
    }
  }, [vehicle?.currentOdometer, vehicle?.fuelType])

  // O'CHIRISH - to'g'ridan-to'g'ri MongoDB dan
  const handleDelete = useCallback(async (type, itemId) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    try {
      await api.delete(`/maintenance/${type}/${itemId}`)
      alert.success('O\'chirildi')
      loadData() // Qayta yuklash
    } catch {
      alert.error('Xatolik')
    }
  }, [loadData])

  const validate = useCallback((type, data) => {
    const e = {}
    if (type === 'fuel' && (!data.liters || +data.liters <= 0)) e.liters = 'Majburiy'
    if (type === 'fuel' && (!data.cost || +data.cost <= 0)) e.cost = 'Majburiy'
    if (type === 'oil' && !data.oilType) e.oilType = 'Majburiy'
    if ((type === 'oil' || type === 'service') && (!data.cost || +data.cost <= 0)) e.cost = 'Majburiy'
    if (type === 'tire' && !data.brand) e.brand = 'Majburiy'
    setErrors(e)
    return !Object.keys(e).length
  }, [])

  // QO'SHISH/TAHRIRLASH - to'g'ridan-to'g'ri MongoDB ga
  const handleSubmit = useCallback(async (type, form, endpoint, itemId = null) => {
    if (!validate(type, form)) return
    setSaving(true)
    
    try {
      const body = { ...form }
      Object.keys(body).forEach(k => { 
        if (body[k] === '') delete body[k]
        else if (!isNaN(body[k]) && !['date','oilType','oilBrand','brand','model','size','position','type','description','serviceName','fuelType'].includes(k)) body[k] = +body[k] 
      })
      
      const apiType = type === 'tire' ? 'tires' : type === 'service' ? 'services' : type
      
      if (itemId) {
        await api.put(`/maintenance/${apiType}/${itemId}`, body)
        alert.success('Yangilandi')
      } else {
        await api.post(endpoint, body)
        alert.success('Saqlandi')
      }
      
      setModal(null)
      setEditId(null)
      loadData() // Qayta yuklash
    } catch (err) {
      alert.error(err.userMessage || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }, [validate, loadData])

  const handleAddFuel = useCallback((e) => { e.preventDefault(); handleSubmit('fuel', fuelForm, `/maintenance/vehicles/${id}/fuel`, editId) }, [fuelForm, id, handleSubmit, editId])
  const handleAddOil = useCallback((e) => { e.preventDefault(); handleSubmit('oil', oilForm, `/maintenance/vehicles/${id}/oil`, editId) }, [oilForm, id, handleSubmit, editId])
  const handleAddTire = useCallback((e) => { e.preventDefault(); handleSubmit('tire', tireForm, `/maintenance/vehicles/${id}/tires`, editId) }, [tireForm, id, handleSubmit, editId])
  const handleAddService = useCallback((e) => { e.preventDefault(); handleSubmit('service', serviceForm, `/maintenance/vehicles/${id}/services`, editId) }, [serviceForm, id, handleSubmit, editId])

  // To'liq shina almashtirish (4 yoki 6 ta) - to'g'ridan-to'g'ri MongoDB ga
  const handleAddBulkTires = useCallback(async (e) => {
    e.preventDefault()
    if (!bulkTireForm.brand) {
      setErrors({ brand: 'Majburiy' })
      return
    }
    setSaving(true)

    const count = parseInt(bulkTireForm.count) || 4
    const positions = count === 6
      ? ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng', 'Orqa chap (ichki)', 'Orqa o\'ng (ichki)']
      : ['Old chap', 'Old o\'ng', 'Orqa chap', 'Orqa o\'ng']

    try {
      await Promise.all(positions.map(position =>
        api.post(`/maintenance/vehicles/${id}/tires`, {
          position,
          brand: bulkTireForm.brand,
          size: bulkTireForm.size || '',
          installDate: today(),
          installOdometer: bulkTireForm.installOdometer ? +bulkTireForm.installOdometer : 0,
          expectedLifeKm: 50000,
          cost: bulkTireForm.cost ? Math.round(+bulkTireForm.cost / count) : 0
        })
      ))
      alert.success(`${count} ta shina qo'shildi`)
      setModal(null)
      loadData() // Qayta yuklash
    } catch (err) {
      alert.error(err.userMessage || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }, [bulkTireForm, id, loadData])

  // Loading
  if (loading) return <Skeleton />
  if (!vehicle) return <NotFound onBack={() => navigate('/fleet')} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      <Header vehicle={vehicle} status={overallStatus} onBack={() => navigate('/fleet')} onRefresh={loadData} />

      {/* Obuna Banner */}
      {subscription && (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            subscription.isExpired
              ? 'bg-red-500/10 border border-red-500/30'
              : subscription.plan === 'trial'
                ? 'bg-amber-500/10 border border-amber-500/30'
                : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {subscription.isExpired ? (
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              ) : subscription.plan === 'trial' ? (
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              <div>
                <p className={`font-semibold ${
                  subscription.isExpired ? 'text-red-400' : subscription.plan === 'trial' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {subscription.isExpired 
                    ? 'Obuna muddati tugadi!' 
                    : subscription.plan === 'trial' 
                      ? `Free Trial - ${timeLeft} qoldi` 
                      : 'Pro Tarif ✓'}
                </p>
                <p className="text-sm text-slate-400">
                  {subscription.isExpired 
                    ? 'Davom etish uchun Pro tarifga o\'ting' 
                    : subscription.plan === 'trial' 
                      ? 'Barcha funksiyalar mavjud' 
                      : 'Cheksiz imkoniyatlar'}
                </p>
              </div>
            </div>
            {(subscription.isExpired || subscription.plan === 'trial') && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 text-sm"
              >
                <Crown size={16} /> Pro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bloklangan holat */}
      {subscription?.isExpired ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-white/5">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Obuna muddati tugadi</h3>
            <p className="text-slate-400 mb-6">Mashina ma'lumotlarini ko'rish va tahrirlash uchun Pro tarifga o'ting</p>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
            >
              <Crown size={20} /> Pro tarifga o'tish - 50,000 so'm/oy
            </button>
          </div>
        </div>
      ) : (
        <>
          <QuickStats vehicle={vehicle} fuelData={fuelData} oilData={oilData} tires={tires} />
          <Tabs tab={tab} setTab={setTab} />
          
          <main className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-5">
            {tab === 'summary' && <SummaryTab vehicle={vehicle} stats={stats} fuelData={fuelData} oilData={oilData} tires={tires} services={services} />}
            {tab === 'fuel' && <FuelTab data={fuelData} onAdd={() => openModal('fuel')} onEdit={(item) => openModal('fuel', item)} onDelete={(i) => handleDelete('fuel', i)} />}
            {tab === 'oil' && <OilTab data={oilData} onAdd={() => openModal('oil')} onEdit={(item) => openModal('oil', item)} onDelete={(i) => handleDelete('oil', i)} />}
            {tab === 'tires' && <TiresTab tires={tires} onAdd={() => openModal('tire')} onAddBulk={() => openModal('tire-bulk')} onEdit={(item) => openModal('tire', item)} onDelete={(i) => handleDelete('tires', i)} />}
            {tab === 'services' && <ServicesTab data={services} onAdd={() => openModal('service')} onEdit={(item) => openModal('service', item)} onDelete={(i) => handleDelete('services', i)} />}
          </main>
        </>
      )}

      {modal && !subscription?.isExpired && (
        <Modal title={modal === 'tire-bulk' ? 'To\'liq shina almashtirish' : `${modal === 'fuel' ? 'Yoqilg\'i' : modal === 'oil' ? 'Moy' : modal === 'tire' ? 'Shina' : 'Xizmat'} ${editId ? 'tahrirlash' : 'qo\'shish'}`} onClose={() => { setModal(null); setEditId(null) }}>
          {modal === 'fuel' && <FuelForm form={fuelForm} setForm={setFuelForm} errors={errors} saving={saving} onSubmit={handleAddFuel} isEdit={!!editId} />}
          {modal === 'oil' && <OilForm form={oilForm} setForm={setOilForm} errors={errors} saving={saving} onSubmit={handleAddOil} isEdit={!!editId} />}
          {modal === 'tire' && <TireForm form={tireForm} setForm={setTireForm} errors={errors} saving={saving} onSubmit={handleAddTire} isEdit={!!editId} />}
          {modal === 'tire-bulk' && <BulkTireForm form={bulkTireForm} setForm={setBulkTireForm} errors={errors} saving={saving} onSubmit={handleAddBulkTires} />}
          {modal === 'service' && <ServiceForm form={serviceForm} setForm={setServiceForm} errors={errors} saving={saving} onSubmit={handleAddService} isEdit={!!editId} />}
        </Modal>
      )}

      {/* Upgrade Modal - obuna tugaganda yopib bo'lmaydi */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Pro Tarif</h2>
                    <p className="text-sm text-slate-400">Avtopark nazorati</p>
                  </div>
                </div>
                {/* Faqat obuna tugamagan bo'lsa yopish tugmasi ko'rinadi */}
                {!subscription?.isExpired && (
                  <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={20} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/20">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">50,000</span>
                  <span className="text-slate-400">so'm/oy</span>
                </div>
                <p className="text-sm text-slate-400">Barcha funksiyalar, cheksiz mashinalar</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Cheksiz mashinalar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Yoqilg'i va moy nazorati</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Shina va xizmat tarixi</span>
                </div>
              </div>
              
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Crown size={20} /> Pro ga o'tish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={tab} 
        onTabChange={setTab} 
        onBack={() => navigate('/fleet')}
      />
    </div>
  )
}

// ========== BOTTOM NAVIGATION ==========

const BottomNav = memo(({ activeTab, onTabChange, onBack }) => {
  // Portal orqali body ga chiqarish - iOS da fixed muammosini hal qiladi
  return createPortal(
    <nav 
      className="lg:hidden"
      style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 99999,
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 4px' }}>
        <NavItem icon={ArrowLeft} label="Orqaga" onClick={onBack} />
        <NavItem icon={BarChart3} label="Umumiy" active={activeTab === 'summary'} onClick={() => onTabChange('summary')} />
        <NavItem icon={Fuel} label="Yoqilg'i" active={activeTab === 'fuel'} onClick={() => onTabChange('fuel')} />
        <NavItem icon={Droplets} label="Moy" active={activeTab === 'oil'} onClick={() => onTabChange('oil')} />
        <NavItem icon={Wrench} label="Xizmat" active={activeTab === 'services'} onClick={() => onTabChange('services')} />
      </div>
    </nav>,
    document.body
  )
})

const NavItem = memo(({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '8px',
      background: 'transparent',
      border: 'none',
      color: active ? '#60a5fa' : '#64748b',
      cursor: 'pointer'
    }}
  >
    <div style={{ 
      padding: '6px', 
      borderRadius: '8px', 
      background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent' 
    }}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span style={{ fontSize: '9px', fontWeight: 500 }}>{label}</span>
  </button>
))

// ========== COMPONENTS ==========

const Skeleton = memo(() => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
    <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
      <div className="h-20 bg-slate-800/50 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-2xl" />)}</div>
      <div className="h-14 bg-slate-800/50 rounded-2xl" />
      <div className="h-48 bg-slate-800/50 rounded-2xl" />
    </div>
  </div>
))

const NotFound = memo(({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Car className="w-10 h-10 text-slate-600" />
      </div>
      <p className="text-slate-400 text-lg mb-4">Mashina topilmadi</p>
      <button onClick={onBack} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium">Orqaga</button>
    </div>
  </div>
))

const Header = memo(({ vehicle, status, onBack, onRefresh }) => (
  <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40">
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2.5 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button onClick={onBack} className="p-2 sm:p-3 hover:bg-white/5 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0">
          <ArrowLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-xl font-bold text-white truncate">{vehicle.plateNumber}</h1>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold flex-shrink-0 ${STATUS[status]?.bg} ${STATUS[status]?.color}`}>{STATUS[status]?.label}</span>
          </div>
          <p className="text-xs sm:text-base text-slate-400 truncate">{vehicle.brand} {vehicle.model}</p>
        </div>
      </div>
      <button onClick={onRefresh} className="p-2 sm:p-3 hover:bg-white/5 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0">
        <RefreshCw size={18} className="sm:w-5 sm:h-5" />
      </button>
    </div>
  </header>
))

const QuickStats = memo(({ vehicle, fuelData, oilData, tires }) => (
  <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      <QuickStat icon={TrendingUp} gradient="from-blue-500 to-indigo-500" label="Probeg" value={`${fmt(vehicle.currentOdometer)}`} unit="km" />
      <QuickStat icon={Fuel} gradient="from-emerald-500 to-emerald-600" label="L/oy" value={fmt(fuelData.stats?.monthlyConsumption || 0)} />
      <QuickStat icon={Droplets} gradient={OIL_STATUS[oilData.status]?.gradient || 'from-emerald-500 to-emerald-600'} label="Moy" value={`${fmt(Math.max(0, oilData.remainingKm))}`} unit="km" warning={oilData.status !== 'ok'} />
      <QuickStat icon={Circle} gradient="from-purple-500 to-pink-500" label="Shinalar" value={tires.length} unit="ta" />
    </div>
  </div>
))

const QuickStat = memo(({ icon: Icon, gradient, label, value, unit, warning }) => (
  <div className="relative bg-slate-800/40 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 overflow-hidden">
    <div className={`absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${gradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
      </div>
      <div className="min-w-0">
        <p className={`text-base sm:text-lg font-bold truncate ${warning ? 'text-amber-400' : 'text-white'}`}>
          {value}{unit && <span className="text-xs sm:text-sm text-slate-400 ml-1">{unit}</span>}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500">{label}</p>
      </div>
    </div>
    {warning && <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
  </div>
))

const Tabs = memo(({ tab, setTab }) => {
  const tabs = [
    { id: 'summary', label: 'Umumiy', shortLabel: 'Umumiy', icon: BarChart3 },
    { id: 'fuel', label: 'Yoqilg\'i', shortLabel: 'Yoqilg\'i', icon: Fuel },
    { id: 'oil', label: 'Moy', shortLabel: 'Moy', icon: Droplets },
    { id: 'tires', label: 'Shinalar', shortLabel: 'Shina', icon: Circle },
    { id: 'services', label: 'Xizmatlar', shortLabel: 'Xizmat', icon: Wrench }
  ]
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 hidden lg:block">
      <div className="flex gap-1 sm:gap-1.5 bg-slate-800/30 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-shrink-0 flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${tab === t.id ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <t.icon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:hidden">{t.shortLabel}</span>
            <span className="xs:hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
})

// ========== TAB CONTENTS ==========

const SummaryTab = memo(({ vehicle, stats, fuelData, oilData, tires, services }) => {
  const wornTires = tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length
  const oilChanges = oilData.changes?.length || 0
  const serviceCount = services.services?.length || 0
  
  return (
    <>
      {/* Mashina + Jami xarajat */}
      <div className="bg-slate-800/40 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-white truncate">{vehicle.plateNumber}</p>
              <p className="text-xs sm:text-sm text-slate-400 truncate">{vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] sm:text-xs text-slate-500">Probeg</p>
            <p className="text-sm sm:text-lg font-bold text-white">{fmt(vehicle.currentOdometer)} <span className="text-xs sm:text-sm text-slate-400">km</span></p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
          <span className="text-slate-400 text-xs sm:text-sm">Jami xarajat</span>
          <span className="text-base sm:text-xl font-bold text-white">{fmt(stats.totalCost)} <span className="text-xs sm:text-sm text-slate-400">so'm</span></span>
        </div>
      </div>

      {/* 4 ta statistika kartochkasi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat icon={Fuel} color="emerald" value={fmt(stats.totalFuelCost)} label="Yoqilg'i" />
        <MiniStat icon={Droplets} color="amber" value={fmt(stats.totalOilCost)} label="Moy" />
        <MiniStat icon={Circle} color="blue" value={fmt(stats.totalTireCost)} label="Shina" />
        <MiniStat icon={Wrench} color="purple" value={fmt(stats.totalServiceCost)} label="Xizmat" />
      </div>

      {/* Holat - Moy va Shinalar */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Moy holati */}
        <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border ${
          oilData.status === 'overdue' ? 'bg-red-500/10 border-red-500/30' :
          oilData.status === 'approaching' ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Droplets className={`w-4 h-4 sm:w-5 sm:h-5 ${
              oilData.status === 'overdue' ? 'text-red-400' :
              oilData.status === 'approaching' ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <span className="text-slate-400 text-[10px] sm:text-xs">Moy</span>
          </div>
          <p className={`text-sm sm:text-lg font-bold ${
            oilData.status === 'overdue' ? 'text-red-400' :
            oilData.status === 'approaching' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {oilData.status === 'overdue' ? 'Almashtiring!' :
             oilData.status === 'approaching' ? 'Yaqin' :
             `${fmt(oilData.remainingKm)} km`}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500">{oilChanges} marta</p>
        </div>

        {/* Shinalar holati */}
        <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border ${
          wornTires > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Circle className={`w-4 h-4 sm:w-5 sm:h-5 ${wornTires > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400 text-[10px] sm:text-xs">Shinalar</span>
          </div>
          <p className={`text-sm sm:text-lg font-bold ${wornTires > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {wornTires > 0 ? `${wornTires} eskirgan` : 'Yaxshi'}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500">{tires.length} ta shina</p>
        </div>
      </div>

      {/* Oxirgi faoliyat */}
      <div className="bg-slate-800/40 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
        <p className="text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3">Oxirgi faoliyat</p>
        <div className="space-y-1.5 sm:space-y-2">
          {fuelData.refills?.[0] && (
            <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm truncate">{fuelData.refills[0].liters} L yoqilg'i</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{fmtDate(fuelData.refills[0].date)}</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-slate-400 flex-shrink-0 ml-2">{fmt(fuelData.refills[0].cost)}</span>
            </div>
          )}
          {oilData.lastChange && (
            <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm truncate">Moy almashtirish</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{fmtDate(oilData.lastChange.date)}</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-slate-400 flex-shrink-0 ml-2">{fmt(oilData.lastChange.cost)}</span>
            </div>
          )}
          {services.services?.[0] && (
            <div className="flex items-center justify-between py-1.5 sm:py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm truncate">{services.services[0].type}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{fmtDate(services.services[0].date)}</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-slate-400 flex-shrink-0 ml-2">{fmt(services.services[0].cost)}</span>
            </div>
          )}
          {!fuelData.refills?.length && !oilData.lastChange && !services.services?.length && (
            <p className="text-center text-slate-500 text-xs sm:text-sm py-3 sm:py-4">Hali faoliyat yo'q</p>
          )}
        </div>
      </div>
    </>
  )
})

// Mini statistika kartochkasi
const MiniStat = memo(({ icon: Icon, color, value, label }) => (
  <div className="bg-slate-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/5">
    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-${color}-400`} />
    <p className="text-xs sm:text-sm font-bold text-white truncate">{value}</p>
    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{label}</p>
  </div>
))

const FuelTab = memo(({ data, onAdd, onEdit, onDelete }) => (
  <>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-white">Yoqilg'i</p>
        <p className="text-sm text-slate-400">{fmt(data.stats?.totalCost || 0)} so'm • {fmt(data.stats?.totalLiters || 0)} L</p>
      </div>
      <AddButton onClick={onAdd} />
    </div>
    {data.stats?.avgPer100km > 0 && (
      <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-emerald-400 font-semibold">{data.stats.avgPer100km} L/100km</p>
          <p className="text-xs text-emerald-400/70">O'rtacha</p>
        </div>
      </div>
    )}
    {!data.refills?.length ? <EmptyState icon={Fuel} /> : (
      <div className="space-y-3">{data.refills.map(r => <ItemCard key={r._id} icon={Fuel} gradient="from-emerald-500 to-emerald-600" title={`${r.liters} L`} subtitle={`${fmtDate(r.date)} • ${fmt(r.odometer)} km`} value={fmt(r.cost)} onEdit={() => onEdit(r)} onDelete={() => onDelete(r._id)} />)}</div>
    )}
  </>
))

const OilTab = memo(({ data, onAdd, onEdit, onDelete }) => (
  <>
    <div className={`rounded-2xl p-5 border ${data.status === 'overdue' ? 'bg-red-500/10 border-red-500/30' : data.status === 'approaching' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.status === 'overdue' ? 'bg-red-500/20' : data.status === 'approaching' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
            <Droplets className={`w-7 h-7 ${OIL_STATUS[data.status]?.color}`} />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Dvigatel moyi</p>
            <p className={OIL_STATUS[data.status]?.color}>{data.status === 'ok' ? `${fmt(Math.max(0, data.remainingKm))} km qoldi` : data.status === 'approaching' ? 'Yaqinda almashtiring' : 'Muddati o\'tgan!'}</p>
          </div>
        </div>
        <button onClick={onAdd} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all">Almashtirish</button>
      </div>
    </div>
    {data.lastChange && (
      <div className="bg-slate-800/40 backdrop-blur rounded-2xl p-5 border border-white/5">
        <p className="text-slate-400 text-sm mb-4">Oxirgi</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900/50 rounded-xl p-3"><p className="text-white font-semibold">{fmtDate(data.lastChange.date)}</p><p className="text-xs text-slate-500">Sana</p></div>
          <div className="bg-slate-900/50 rounded-xl p-3"><p className="text-white font-semibold">{fmt(data.lastChange.odometer)}</p><p className="text-xs text-slate-500">km</p></div>
          <div className="bg-slate-900/50 rounded-xl p-3"><p className="text-white font-semibold">{data.lastChange.oilType}</p><p className="text-xs text-slate-500">Turi</p></div>
        </div>
      </div>
    )}
    {data.changes?.length > 1 && <div className="space-y-3">{data.changes.slice(1).map(c => <ItemCard key={c._id} icon={Droplets} gradient="from-amber-500 to-orange-500" title={c.oilType} subtitle={`${fmtDate(c.date)} • ${fmt(c.odometer)} km`} value={fmt(c.cost)} onEdit={() => onEdit(c)} onDelete={() => onDelete(c._id)} />)}</div>}
  </>
))

const TiresTab = memo(({ tires, onAdd, onAddBulk, onEdit, onDelete }) => (
  <>
    <div className="flex items-center justify-between flex-wrap gap-2">
      <p className="text-lg font-semibold text-white">Shinalar ({tires.length})</p>
      <div className="flex gap-2">
        <button onClick={onAddBulk} className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium flex items-center gap-2 transition-all">
          <Circle size={16} /> To'liq almashtirish
        </button>
        <AddButton onClick={onAdd} />
      </div>
    </div>
    {!tires.length ? <EmptyState icon={Circle} /> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tires.map(t => {
          const st = t.calculatedStatus || t.status || 'used'
          return (
            <div key={t._id} className="bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${TIRE_STATUS[st]?.bg}`} />
                  <p className="text-white font-semibold">{t.position}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(t)} className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-500 hover:text-blue-400"><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(t._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-slate-400 text-sm">{t.brand} {t.size && `• ${t.size}`}</p>
              <p className={`text-lg font-bold mt-2 ${TIRE_STATUS[st]?.color}`}>{fmt(Math.max(0, t.remainingKm))} km</p>
            </div>
          )
        })}
      </div>
    )}
  </>
))

const ServicesTab = memo(({ data, onAdd, onEdit, onDelete }) => (
  <>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-white">Xizmatlar</p>
        <p className="text-sm text-slate-400">{fmt(data.stats?.totalCost || 0)} so'm</p>
      </div>
      <AddButton onClick={onAdd} />
    </div>
    {!data.services?.length ? <EmptyState icon={Wrench} /> : (
      <div className="space-y-3">{data.services.map(s => <ItemCard key={s._id} icon={Wrench} gradient="from-purple-500 to-pink-500" title={s.type} subtitle={`${fmtDate(s.date)} • ${fmt(s.odometer)} km`} value={fmt(s.cost)} onEdit={() => onEdit(s)} onDelete={() => onDelete(s._id)} />)}</div>
    )}
  </>
))

// ========== REUSABLE ==========

const ExpenseCard = memo(({ icon: Icon, gradient, label, amount, count }) => (
  <div className="relative overflow-hidden bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-white/5">
    <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
      <p className="text-slate-400 text-xs">{label}</p>
    </div>
    <p className="text-xl font-bold text-white">{fmt(amount)}</p>
    <p className="text-xs text-slate-500">{count} ta</p>
  </div>
))

const InfoRow = memo(({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className={highlight ? 'text-white font-semibold' : 'text-slate-300'}>{value}</span>
  </div>
))

const StatusRow = memo(({ icon: Icon, label, status, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-slate-400" /><span className="text-slate-300">{label}</span></div>
    <span className={`flex items-center gap-2 text-sm font-medium ${status === 'ok' ? 'text-emerald-400' : status === 'approaching' ? 'text-amber-400' : 'text-red-400'}`}>
      {status === 'ok' ? <Check size={16} /> : <AlertTriangle size={16} />}{value}
    </span>
  </div>
))

const EmptyState = memo(({ icon: Icon }) => (
  <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-10 text-center border border-white/5">
    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-8 h-8 text-slate-600" /></div>
    <p className="text-slate-400">Ma'lumot yo'q</p>
  </div>
))

const ItemCard = memo(({ icon: Icon, gradient, title, subtitle, value, onEdit, onDelete }) => (
  <div className="bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}><Icon className="w-6 h-6 text-white" /></div>
      <div><p className="text-white font-semibold">{title}</p><p className="text-sm text-slate-400">{subtitle}</p></div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right"><p className="text-white font-semibold">{value}</p><p className="text-xs text-slate-500">so'm</p></div>
      <div className="flex gap-1">
        {onEdit && <button onClick={onEdit} className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-500 hover:text-blue-400"><Edit2 size={16} /></button>}
        <button onClick={onDelete} className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
      </div>
    </div>
  </div>
))

const AddButton = memo(({ onClick }) => (
  <button onClick={onClick} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]">
    <Plus size={18} /> Qo'shish
  </button>
))

// ========== MODAL & FORMS ==========

const Modal = memo(({ title, onClose, children }) => (
  <div 
    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center overflow-y-auto pt-10 pb-10 px-4"
    style={{ zIndex: 100000 }}
    onClick={onClose}
  >
    <div 
      className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl my-auto" 
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-slate-900 rounded-t-2xl z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"><X size={22} /></button>
      </div>
      {children}
    </div>
  </div>
))

const Input = memo(({ label, type = 'text', value, onChange, error, formatNumber, ...props }) => {
  // Raqamni formatlash (200000 -> 200 000)
  const displayValue = formatNumber && value ? fmt(value) : value
  
  const handleChange = (e) => {
    if (formatNumber) {
      const rawValue = e.target.value.replace(/\D/g, '')
      onChange(rawValue)
    } else {
      onChange(e.target.value)
    }
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <input 
        type={formatNumber ? 'text' : type} 
        inputMode={formatNumber ? 'numeric' : undefined}
        value={displayValue} 
        onChange={handleChange} 
        className={`w-full px-4 py-3 bg-slate-800/50 border ${error ? 'border-red-500/50' : 'border-white/5'} rounded-xl text-white focus:outline-none focus:border-blue-500/50`} 
        {...props} 
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
})

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
))

const SubmitButton = memo(({ loading, isEdit }) => (
  <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
    {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saqlanmoqda...</> : isEdit ? 'Yangilash' : 'Saqlash'}
  </button>
))

const FuelForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} max={today()} />
      <Input label="Odometr (km)" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} formatNumber />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Litr" type="number" step="0.1" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} />
      <Input label="Narx (so'm)" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} formatNumber />
    </div>
    <Select label="Yoqilg'i turi" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPES} />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const OilForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} max={today()} />
      <Input label="Odometr (km)" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} formatNumber />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} placeholder="10W-40" error={errors.oilType} />
      <Input label="Narx (so'm)" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} formatNumber />
    </div>
    <Input label="Keyingi almashtirish (km)" value={form.nextChangeOdometer} onChange={v => setForm(f => ({ ...f, nextChangeOdometer: v }))} placeholder={form.odometer ? fmt(+form.odometer.toString().replace(/\s/g, '') + 10000) : '10000 km qo\'shiladi'} formatNumber />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const TireForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <Select label="Joylashuv" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))} options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="Michelin, Bridgestone..." error={errors.brand} />
    <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-4">
      <Input label="O'rnatish sanasi" type="date" value={form.installDate} onChange={v => setForm(f => ({ ...f, installDate: v }))} max={today()} />
      <Input label="O'rnatish km" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} formatNumber />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Kutilgan umr (km)" value={form.expectedLifeKm} onChange={v => setForm(f => ({ ...f, expectedLifeKm: v }))} placeholder="50000" formatNumber />
      <Input label="Narx (so'm)" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} formatNumber />
    </div>
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const BulkTireForm = memo(({ form, setForm, errors, saving, onSubmit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-2">
      <p className="text-purple-400 text-sm">Barcha shinalarni bir vaqtda almashtirish. Narx avtomatik bo'linadi.</p>
    </div>
    <Select 
      label="Shinalar soni" 
      value={form.count} 
      onChange={v => setForm(f => ({ ...f, count: v }))} 
      options={[
        { value: '4', label: '4 ta (oddiy)' },
        { value: '6', label: '6 ta (yuk mashinasi)' }
      ]} 
    />
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="Michelin, Bridgestone..." error={errors.brand} />
    <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Odometr (km)" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} formatNumber />
      <Input label="Jami narx (so'm)" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} formatNumber />
    </div>
    {form.cost && form.count && (
      <p className="text-sm text-slate-400">Har bir shina: {fmt(Math.round(+form.cost / +form.count))} so'm</p>
    )}
    <SubmitButton loading={saving} />
  </form>
))

const ServiceForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <Select label="Xizmat turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} max={today()} />
      <Input label="Odometr (km)" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} formatNumber />
    </div>
    <Input label="Narx (so'm)" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} formatNumber />
    <Input label="Tavsif" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Bajarilgan ishlar..." />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))