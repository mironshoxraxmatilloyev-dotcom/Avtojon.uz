import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, AlertTriangle, X, Zap, Truck, BarChart3, Fuel, Droplets, Circle, Wrench, RefreshCw, DollarSign, Sparkles } from 'lucide-react'
import api from '../../services/api'
import { useAlert } from '../../components/ui'
import {
  SummaryTab, FuelTab, OilTab, TiresTab, ServicesTab, IncomeTab,
  initFuelForm, initOilForm, initTireForm, initServiceForm, initIncomeForm, today, TIRE_POSITIONS
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

  const [fuelForm, setFuelForm] = useState(() => initFuelForm())
  const [oilForm, setOilForm] = useState(() => initOilForm())
  const [tireForm, setTireForm] = useState(() => initTireForm())
  const [serviceForm, setServiceForm] = useState(() => initServiceForm())
  const [incomeForm, setIncomeForm] = useState(() => initIncomeForm())
  const [bulkTireForm, setBulkTireForm] = useState({ brand: '', size: '', cost: '', count: '4' })

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
    } catch (err) { console.error(err) }
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
    if (type === 'oil') setOilForm(item ? { date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', oilType: item.oilType || '', oilBrand: item.oilBrand || '', liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', nextChangeOdometer: item.nextChangeOdometer?.toString() || '' } : initOilForm(odo))
    if (type === 'tire') setTireForm(item ? { position: item.position || TIRE_POSITIONS[0], brand: item.brand || '', model: item.model || '', size: item.size || '', installDate: item.installDate?.split('T')[0] || today(), installOdometer: item.installOdometer?.toString() || '', expectedLifeKm: item.expectedLifeKm?.toString() || '80000', cost: item.cost?.toString() || '' } : initTireForm(odo))
    if (type === 'service') setServiceForm(item ? { type: item.type || 'TO-1', date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', cost: item.cost?.toString() || '', description: item.description || '', serviceName: item.serviceName || '' } : initServiceForm(odo))
    if (type === 'tire-bulk') setBulkTireForm({ brand: '', size: '', cost: '', count: '4', installOdometer: odo })
    if (type === 'income') setIncomeForm(item ? { type: item.type || 'trip', date: item.date?.split('T')[0] || today(), amount: item.amount?.toString() || '', fromCity: item.fromCity || '', toCity: item.toCity || '', distance: item.distance?.toString() || '', cargoWeight: item.cargoWeight?.toString() || '', clientName: item.clientName || '', description: item.description || '' } : initIncomeForm())
  }, [vehicle?.currentOdometer, vehicle?.fuelType])

  const handleDelete = useCallback(async (type, itemId) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: prev.refills.filter(r => r._id !== itemId) }))
    else if (type === 'oil') setOilData(prev => ({ ...prev, changes: prev.changes.filter(c => c._id !== itemId) }))
    else if (type === 'tires') setTires(prev => prev.filter(t => t._id !== itemId))
    else if (type === 'services') setServices(prev => ({ ...prev, services: prev.services.filter(s => s._id !== itemId) }))
    else if (type === 'income') setIncomeData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i._id !== itemId) }))
    alert.success('O\'chirildi')
    try { await api.delete(`/maintenance/${type}/${itemId}`) } catch { }
  }, [alert])

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
      if (currentOdo > 0 && Math.abs(odo - currentOdo) > 100000) {
        e.odometer = 'Juda katta farq (max 100,000 km)'
      }
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
      if (!data.amount || +data.amount <= 0) e.amount = 'Majburiy va musbat'
      else if (+data.amount > 1000000000) e.amount = 'Juda katta'
      if (data.distance && +data.distance < 0) e.distance = 'Salbiy bo\'lishi mumkin emas'
      if (data.distance && +data.distance > 50000) e.distance = 'Juda katta (max 50,000 km)'
    }

    setErrors(e)
    return !Object.keys(e).length
  }, [vehicle?.currentOdometer])

  const handleSubmit = useCallback(async (type, form, endpoint, itemId = null) => {
    if (!validate(type, form)) return
    const body = { ...form }
    Object.keys(body).forEach(k => {
      if (body[k] === '') delete body[k]
      else if (!isNaN(body[k]) && !['date', 'oilType', 'oilBrand', 'brand', 'model', 'size', 'position', 'type', 'description', 'serviceName', 'fuelType', 'station', 'fromCity', 'toCity', 'clientName'].includes(k)) body[k] = +body[k]
    })
    setModal(null)
    setEditId(null)
    const tempId = `temp_${Date.now()}`
    const newItem = { ...body, _id: itemId || tempId, date: body.date || new Date().toISOString() }

    if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: itemId ? prev.refills.map(r => r._id === itemId ? { ...r, ...body } : r) : [newItem, ...prev.refills] }))
    else if (type === 'oil') setOilData(prev => ({ ...prev, changes: itemId ? prev.changes.map(c => c._id === itemId ? { ...c, ...body } : c) : [newItem, ...prev.changes] }))
    else if (type === 'tire') setTires(prev => itemId ? prev.map(t => t._id === itemId ? { ...t, ...body } : t) : [...prev, { ...newItem, remainingKm: body.expectedLifeKm || 80000 }])
    else if (type === 'service') setServices(prev => ({ ...prev, services: itemId ? prev.services.map(s => s._id === itemId ? { ...s, ...body } : s) : [newItem, ...prev.services] }))
    else if (type === 'income') setIncomeData(prev => ({ ...prev, incomes: itemId ? prev.incomes.map(i => i._id === itemId ? { ...i, ...body } : i) : [newItem, ...prev.incomes] }))

    alert.success(itemId ? 'Yangilandi' : 'Saqlandi')
    const apiType = type === 'tire' ? 'tires' : type === 'service' ? 'services' : type
    try {
      if (itemId) await api.put(`/maintenance/${apiType}/${itemId}`, body)
      else await api.post(endpoint, body)
    } catch { }
  }, [validate, alert])


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
    const newTires = positions.map((position, i) => ({ _id: `temp_${Date.now()}_${i}`, position, brand: bulkTireForm.brand, size: bulkTireForm.size || '', remainingKm: 50000, status: 'new' }))
    setTires(prev => [...prev, ...newTires])
    alert.success(`${count} ta shina qo'shildi`)
    try {
      await Promise.all(positions.map(position => api.post(`/maintenance/vehicles/${id}/tires`, { position, brand: bulkTireForm.brand, size: bulkTireForm.size || '', installDate: today(), installOdometer: bulkTireForm.installOdometer ? +bulkTireForm.installOdometer : 0, expectedLifeKm: 50000, cost: bulkTireForm.cost ? Math.round(+bulkTireForm.cost / count) : 0 })))
    } catch { }
  }, [bulkTireForm, id, alert])

  if (loading) return <LoadingSkeleton />
  if (!vehicle) return <NotFound onBack={() => navigate('/fleet')} />
  if (subscription?.isExpired) return <ExpiredView onUpgrade={() => setShowUpgradeModal(true)} />

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc]">
      {/* PRO Sidebar - Desktop - Fixed, NO scroll */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-slate-200/60 z-40 overflow-hidden">
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
            <button key={item.id} onClick={() => setActiveTab(item.id)}
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
      <main className="lg:ml-[260px] h-screen overflow-y-auto pb-24 lg:pb-8">
        {/* PRO Header - Full Width */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="px-4 lg:px-6 xl:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/fleet')} className="lg:hidden p-2 text-slate-500 hover:text-slate-900 -ml-2">
                  <ArrowLeft size={22} />
                </button>
                <div className="lg:hidden w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{vehicle.plateNumber}</h1>
                  <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {subscription?.plan === 'trial' && (
                  <button onClick={() => setShowUpgradeModal(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
                    <Crown size={14} />
                    {timeLeft}
                  </button>
                )}
                <button onClick={loadData} disabled={refreshing} className="p-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                  <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content - Full Width */}
        <div className="p-4 lg:p-6 xl:p-8 w-full">
          {activeTab === 'summary' && <SummaryTab vehicle={vehicle} stats={stats} fuelData={fuelData} oilData={oilData} tires={tires} services={services} />}
          {activeTab === 'income' && <IncomeTab data={incomeData} onAdd={() => openModal('income')} onEdit={(item) => openModal('income', item)} onDelete={(i) => handleDelete('income', i)} />}
          {activeTab === 'fuel' && <FuelTab data={fuelData} onAdd={() => openModal('fuel')} onEdit={(item) => openModal('fuel', item)} onDelete={(i) => handleDelete('fuel', i)} />}
          {activeTab === 'oil' && <OilTab data={oilData} onAdd={() => openModal('oil')} onEdit={(item) => openModal('oil', item)} onDelete={(i) => handleDelete('oil', i)} />}
          {activeTab === 'tires' && <TiresTab tires={tires} onAdd={() => openModal('tire')} onAddBulk={() => openModal('tire-bulk')} onEdit={(item) => openModal('tire', item)} onDelete={(i) => handleDelete('tires', i)} />}
          {activeTab === 'services' && <ServicesTab data={services} onAdd={() => openModal('service')} onEdit={(item) => openModal('service', item)} onDelete={(i) => handleDelete('services', i)} />}
        </div>
      </main>

      {/* PRO Bottom Navigation - Mobile - Instagram Style Fixed */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
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
          {modal === 'fuel' && <FuelForm form={fuelForm} setForm={setFuelForm} errors={errors} onSubmit={handleAddFuel} isEdit={!!editId} />}
          {modal === 'oil' && <OilForm form={oilForm} setForm={setOilForm} errors={errors} onSubmit={handleAddOil} isEdit={!!editId} />}
          {modal === 'tire' && <TireForm form={tireForm} setForm={setTireForm} errors={errors} onSubmit={handleAddTire} isEdit={!!editId} />}
          {modal === 'tire-bulk' && <BulkTireForm form={bulkTireForm} setForm={setBulkTireForm} errors={errors} onSubmit={handleAddBulkTires} />}
          {modal === 'service' && <ServiceForm form={serviceForm} setForm={setServiceForm} errors={errors} onSubmit={handleAddService} isEdit={!!editId} />}
          {modal === 'income' && <IncomeForm form={incomeForm} setForm={setIncomeForm} errors={errors} onSubmit={handleAddIncome} isEdit={!!editId} />}
        </Modal>
      )}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
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
