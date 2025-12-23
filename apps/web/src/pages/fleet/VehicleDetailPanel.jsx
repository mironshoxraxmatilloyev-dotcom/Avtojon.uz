import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, AlertTriangle, X, Zap, Truck, BarChart3, Fuel, Droplets, Circle, Wrench, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { useAlert } from '../../components/ui'
import {
  SummaryTab, FuelTab, OilTab, TiresTab, ServicesTab,
  initFuelForm, initOilForm, initTireForm, initServiceForm, today, TIRE_POSITIONS
} from '../../components/fleet/vehicle'
import { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm } from '../../components/fleet/vehicle/VehicleForms'

const NAV_ITEMS = [
  { id: 'summary', icon: BarChart3, label: 'Umumiy' },
  { id: 'fuel', icon: Fuel, label: 'Yoqilg\'i' },
  { id: 'oil', icon: Droplets, label: 'Moy' },
  { id: 'tires', icon: Circle, label: 'Shina' },
  { id: 'services', icon: Wrench, label: 'Xizmat' }
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

  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})

  const [fuelForm, setFuelForm] = useState(() => initFuelForm())
  const [oilForm, setOilForm] = useState(() => initOilForm())
  const [tireForm, setTireForm] = useState(() => initTireForm())
  const [serviceForm, setServiceForm] = useState(() => initServiceForm())
  const [bulkTireForm, setBulkTireForm] = useState({ brand: '', size: '', cost: '', count: '4' })

  const [subscription, setSubscription] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
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
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      setTimeLeft(days > 0 ? `${days}k ${hours}s` : `${hours}s`)
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
    if (type === 'fuel') setFuelForm(item ? { date: item.date?.split('T')[0] || today(), liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', odometer: item.odometer?.toString() || '', fuelType: item.fuelType || 'diesel', station: item.station || '' } : initFuelForm(odo, vehicle?.fuelType || 'diesel'))
    if (type === 'oil') setOilForm(item ? { date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', oilType: item.oilType || '', oilBrand: item.oilBrand || '', liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', nextChangeOdometer: item.nextChangeOdometer?.toString() || '' } : initOilForm(odo))
    if (type === 'tire') setTireForm(item ? { position: item.position || TIRE_POSITIONS[0], brand: item.brand || '', model: item.model || '', size: item.size || '', installDate: item.installDate?.split('T')[0] || today(), installOdometer: item.installOdometer?.toString() || '', expectedLifeKm: item.expectedLifeKm?.toString() || '50000', cost: item.cost?.toString() || '' } : initTireForm(odo))
    if (type === 'service') setServiceForm(item ? { type: item.type || 'TO-1', date: item.date?.split('T')[0] || today(), odometer: item.odometer?.toString() || '', cost: item.cost?.toString() || '', description: item.description || '', serviceName: item.serviceName || '' } : initServiceForm(odo))
    if (type === 'tire-bulk') setBulkTireForm({ brand: '', size: '', cost: '', count: '4', installOdometer: odo })
  }, [vehicle?.currentOdometer, vehicle?.fuelType])

  const handleDelete = useCallback(async (type, itemId) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: prev.refills.filter(r => r._id !== itemId) }))
    else if (type === 'oil') setOilData(prev => ({ ...prev, changes: prev.changes.filter(c => c._id !== itemId) }))
    else if (type === 'tires') setTires(prev => prev.filter(t => t._id !== itemId))
    else if (type === 'services') setServices(prev => ({ ...prev, services: prev.services.filter(s => s._id !== itemId) }))
    alert.success('O\'chirildi')
    try { await api.delete(`/maintenance/${type}/${itemId}`) } catch { }
  }, [alert])

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


  const handleSubmit = useCallback(async (type, form, endpoint, itemId = null) => {
    if (!validate(type, form)) return
    const body = { ...form }
    Object.keys(body).forEach(k => {
      if (body[k] === '') delete body[k]
      else if (!isNaN(body[k]) && !['date', 'oilType', 'oilBrand', 'brand', 'model', 'size', 'position', 'type', 'description', 'serviceName', 'fuelType', 'station'].includes(k)) body[k] = +body[k]
    })
    setModal(null)
    setEditId(null)
    const tempId = `temp_${Date.now()}`
    const newItem = { ...body, _id: itemId || tempId, date: body.date || new Date().toISOString() }

    if (type === 'fuel') setFuelData(prev => ({ ...prev, refills: itemId ? prev.refills.map(r => r._id === itemId ? { ...r, ...body } : r) : [newItem, ...prev.refills] }))
    else if (type === 'oil') setOilData(prev => ({ ...prev, changes: itemId ? prev.changes.map(c => c._id === itemId ? { ...c, ...body } : c) : [newItem, ...prev.changes] }))
    else if (type === 'tire') setTires(prev => itemId ? prev.map(t => t._id === itemId ? { ...t, ...body } : t) : [...prev, { ...newItem, remainingKm: body.expectedLifeKm || 50000 }])
    else if (type === 'service') setServices(prev => ({ ...prev, services: itemId ? prev.services.map(s => s._id === itemId ? { ...s, ...body } : s) : [newItem, ...prev.services] }))

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

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const { data } = await api.post('/vehicles/subscription/upgrade')
      setSubscription(data.data)
      setShowUpgradeModal(false)
      alert.success('Pro tarifga o\'tdingiz!')
    } catch (err) { alert.error('Xatolik', err.userMessage || 'Xatolik') }
    finally { setUpgrading(false) }
  }

  if (loading) return <LoadingSkeleton />
  if (!vehicle) return <NotFound onBack={() => navigate('/fleet')} />
  if (subscription?.isExpired) return <ExpiredView onUpgrade={() => setShowUpgradeModal(true)} />


  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-950 overflow-hidden">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-white/5 p-6 shrink-0">
        <button onClick={() => navigate('/fleet')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-all">
          <ArrowLeft size={18} />
          <span>Avtoparkga qaytish</span>
        </button>
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-1">{vehicle?.plateNumber}</h2>
          <p className="text-sm text-slate-500">{vehicle?.brand} {vehicle?.model}</p>
        </div>
        <nav className="space-y-2">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/50 border-b border-white/5 px-4 py-3 lg:px-8 lg:py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/fleet')} className="lg:hidden p-2 text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-white">{vehicle.plateNumber}</h1>
                <p className="text-xs lg:text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {subscription?.plan === 'trial' && (
                <button onClick={() => setShowUpgradeModal(true)} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg font-medium lg:hidden">
                  {timeLeft}
                </button>
              )}
              <button onClick={loadData} disabled={refreshing} className="p-2 text-slate-400 hover:text-white">
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        {/* Content - scrollable with bottom padding for nav */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {activeTab === 'summary' && <SummaryTab vehicle={vehicle} stats={stats} fuelData={fuelData} oilData={oilData} tires={tires} services={services} />}
          {activeTab === 'fuel' && <FuelTab data={fuelData} onAdd={() => openModal('fuel')} onEdit={(item) => openModal('fuel', item)} onDelete={(i) => handleDelete('fuel', i)} />}
          {activeTab === 'oil' && <OilTab data={oilData} onAdd={() => openModal('oil')} onEdit={(item) => openModal('oil', item)} onDelete={(i) => handleDelete('oil', i)} />}
          {activeTab === 'tires' && <TiresTab tires={tires} onAdd={() => openModal('tire')} onAddBulk={() => openModal('tire-bulk')} onEdit={(item) => openModal('tire', item)} onDelete={(i) => handleDelete('tires', i)} />}
          {activeTab === 'services' && <ServicesTab data={services} onAdd={() => openModal('service')} onEdit={(item) => openModal('service', item)} onDelete={(i) => handleDelete('services', i)} />}
        </div>

        {/* Bottom Navigation - Mobile only - Instagram kabi fixed */}
        <nav 
          className="lg:hidden fixed bottom-0 left-0 right-0 z-[99999] bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
          style={{ 
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div
            className="flex items-center justify-around py-1"
            style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
          >
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${activeTab === item.id ? 'text-blue-400' : 'text-slate-500 active:text-slate-400'}`}>
                <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-blue-500/20' : ''}`}>
                  <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </main>


      {/* Modals */}
      {modal && (
        <Modal title={modal === 'tire-bulk' ? 'To\'liq shina almashtirish' : `${modal === 'fuel' ? 'Yoqilg\'i' : modal === 'oil' ? 'Moy' : modal === 'tire' ? 'Shina' : 'Xizmat'} ${editId ? 'tahrirlash' : 'qo\'shish'}`} onClose={() => { setModal(null); setEditId(null) }}>
          {modal === 'fuel' && <FuelForm form={fuelForm} setForm={setFuelForm} errors={errors} onSubmit={handleAddFuel} isEdit={!!editId} />}
          {modal === 'oil' && <OilForm form={oilForm} setForm={setOilForm} errors={errors} onSubmit={handleAddOil} isEdit={!!editId} />}
          {modal === 'tire' && <TireForm form={tireForm} setForm={setTireForm} errors={errors} onSubmit={handleAddTire} isEdit={!!editId} />}
          {modal === 'tire-bulk' && <BulkTireForm form={bulkTireForm} setForm={setBulkTireForm} errors={errors} onSubmit={handleAddBulkTires} />}
          {modal === 'service' && <ServiceForm form={serviceForm} setForm={setServiceForm} errors={errors} onSubmit={handleAddService} isEdit={!!editId} />}
        </Modal>
      )}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} upgrading={upgrading} />}
    </div>
  )
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-950 p-4 lg:p-8">
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-16 bg-slate-800/30 rounded-2xl" />
      <div className="h-48 bg-slate-800/30 rounded-2xl" />
      <div className="h-64 bg-slate-800/30 rounded-2xl" />
    </div>
  </div>
)

const NotFound = ({ onBack }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <p className="text-slate-400 text-lg mb-4">Mashina topilmadi</p>
      <button onClick={onBack} className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium">Orqaga</button>
    </div>
  </div>
)

const ExpiredView = ({ onUpgrade }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-3">Obuna tugadi</h1>
      <p className="text-slate-400 mb-6">Davom etish uchun Pro tarifga o'ting</p>
      <button onClick={onUpgrade} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold inline-flex items-center gap-2">
        <Crown size={20} /> Pro ga o'tish
      </button>
    </div>
  </div>
)

const UpgradeModal = ({ onClose, onUpgrade, upgrading }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pro Tarif</h2>
            <p className="text-sm text-slate-400">50,000 so'm/oy</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-4">
        {['Cheksiz mashinalar', 'Yoqilg\'i nazorati', 'Moy va shina tarixi', 'Xizmat hisoboti'].map(f => (
          <div key={f} className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300">{f}</span>
          </div>
        ))}
        <button onClick={onUpgrade} disabled={upgrading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          {upgrading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Crown size={20} />}
          {upgrading ? 'Yuklanmoqda...' : 'Pro ga o\'tish'}
        </button>
      </div>
    </div>
  </div>
)
