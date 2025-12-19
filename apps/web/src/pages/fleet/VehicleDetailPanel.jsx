import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Car, Fuel, Droplets, Circle, Wrench, Plus, X, Trash2, RefreshCw, 
  BarChart3, AlertTriangle, Check, Edit2, TrendingUp, Zap
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
const initFuelForm = (odo = '', ft = 'diesel') => ({ date: today(), liters: '', cost: '', odometer: odo, fuelType: ft })
const initOilForm = (odo = '') => ({ date: today(), odometer: odo, oilType: '', oilBrand: '', liters: '', cost: '', nextChangeOdometer: '' })
const initTireForm = (odo = '') => ({ position: TIRE_POSITIONS[0], brand: '', model: '', size: '', installDate: today(), installOdometer: odo, expectedLifeKm: 50000, cost: '' })
const initServiceForm = (odo = '') => ({ type: SERVICE_TYPES[0], date: today(), odometer: odo, cost: '', description: '', serviceName: '' })

export default function VehicleDetailPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('summary')
  const [fuelData, setFuelData] = useState({ refills: [], stats: {} })
  const [oilData, setOilData] = useState({ changes: [], status: 'ok', remainingKm: 10000 })
  const [tires, setTires] = useState([])
  const [services, setServices] = useState({ services: [], stats: {} })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [fuelForm, setFuelForm] = useState(() => initFuelForm())
  const [oilForm, setOilForm] = useState(() => initOilForm())
  const [tireForm, setTireForm] = useState(() => initTireForm())
  const [serviceForm, setServiceForm] = useState(() => initServiceForm())

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.get(`/vehicles/${id}`)
      .then(res => { if (mounted) setVehicle(res.data.data) })
      .catch(() => alert.error('Xatolik', 'Mashina topilmadi'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    if (!vehicle || dataLoaded) return
    let mounted = true
    Promise.all([
      api.get(`/maintenance/vehicles/${id}/fuel`).catch(() => ({ data: { data: { refills: [], stats: {} } } })),
      api.get(`/maintenance/vehicles/${id}/oil`).catch(() => ({ data: { data: { changes: [], status: 'ok', remainingKm: 10000 } } })),
      api.get(`/maintenance/vehicles/${id}/tires`).catch(() => ({ data: { data: [] } })),
      api.get(`/maintenance/vehicles/${id}/services`).catch(() => ({ data: { data: { services: [], stats: {} } } }))
    ]).then(([f, o, t, s]) => {
      if (!mounted) return
      setFuelData(f.data.data || { refills: [], stats: {} })
      setOilData(o.data.data || { changes: [], status: 'ok', remainingKm: 10000 })
      setTires(t.data.data || [])
      setServices(s.data.data || { services: [], stats: {} })
      setDataLoaded(true)
    })
    return () => { mounted = false }
  }, [vehicle, id, dataLoaded])

  const refresh = useCallback(() => setDataLoaded(false), [])

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
      if (item) setFuelForm({ date: item.date?.split('T')[0] || today(), liters: item.liters?.toString() || '', cost: item.cost?.toString() || '', odometer: item.odometer?.toString() || '', fuelType: item.fuelType || 'diesel' })
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
  }, [vehicle?.currentOdometer, vehicle?.fuelType])

  const handleDelete = useCallback(async (type, itemId) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    try {
      await api.delete(`/maintenance/${type}/${itemId}`)
      alert.success('O\'chirildi')
      refresh()
    } catch { alert.error('Xatolik') }
  }, [refresh])

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
    setSaving(true)
    try {
      const body = { ...form }
      Object.keys(body).forEach(k => { 
        if (body[k] === '') delete body[k]
        else if (!isNaN(body[k]) && !['date','oilType','oilBrand','brand','model','size','position','type','description','serviceName','fuelType'].includes(k)) body[k] = +body[k] 
      })
      if (itemId) {
        await api.put(`/maintenance/${type}/${itemId}`, body)
        alert.success('Yangilandi')
      } else {
        await api.post(endpoint, body)
        alert.success('Saqlandi')
      }
      setModal(null)
      setEditId(null)
      refresh()
    } catch (err) { alert.error(err.userMessage || 'Xatolik') }
    finally { setSaving(false) }
  }, [validate, refresh])

  const handleAddFuel = useCallback((e) => { e.preventDefault(); handleSubmit('fuel', fuelForm, `/maintenance/vehicles/${id}/fuel`, editId) }, [fuelForm, id, handleSubmit, editId])
  const handleAddOil = useCallback((e) => { e.preventDefault(); handleSubmit('oil', oilForm, `/maintenance/vehicles/${id}/oil`, editId) }, [oilForm, id, handleSubmit, editId])
  const handleAddTire = useCallback((e) => { e.preventDefault(); handleSubmit('tires', tireForm, `/maintenance/vehicles/${id}/tires`, editId) }, [tireForm, id, handleSubmit, editId])
  const handleAddService = useCallback((e) => { e.preventDefault(); handleSubmit('services', serviceForm, `/maintenance/vehicles/${id}/services`, editId) }, [serviceForm, id, handleSubmit, editId])

  if (loading) return <Skeleton />
  if (!vehicle) return <NotFound onBack={() => navigate('/fleet')} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      <Header vehicle={vehicle} status={overallStatus} onBack={() => navigate('/fleet')} onRefresh={refresh} />
      <QuickStats vehicle={vehicle} fuelData={fuelData} oilData={oilData} tires={tires} />
      <Tabs tab={tab} setTab={setTab} />
      
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {tab === 'summary' && <SummaryTab vehicle={vehicle} stats={stats} fuelData={fuelData} oilData={oilData} tires={tires} services={services} />}
        {tab === 'fuel' && <FuelTab data={fuelData} onAdd={() => openModal('fuel')} onEdit={(item) => openModal('fuel', item)} onDelete={(i) => handleDelete('fuel', i)} />}
        {tab === 'oil' && <OilTab data={oilData} onAdd={() => openModal('oil')} onEdit={(item) => openModal('oil', item)} onDelete={(i) => handleDelete('oil', i)} />}
        {tab === 'tires' && <TiresTab tires={tires} onAdd={() => openModal('tire')} onEdit={(item) => openModal('tire', item)} onDelete={(i) => handleDelete('tires', i)} />}
        {tab === 'services' && <ServicesTab data={services} onAdd={() => openModal('service')} onEdit={(item) => openModal('service', item)} onDelete={(i) => handleDelete('services', i)} />}
      </main>

      {modal && (
        <Modal title={`${modal === 'fuel' ? 'Yoqilg\'i' : modal === 'oil' ? 'Moy' : modal === 'tire' ? 'Shina' : 'Xizmat'} ${editId ? 'tahrirlash' : 'qo\'shish'}`} onClose={() => { setModal(null); setEditId(null) }}>
          {modal === 'fuel' && <FuelForm form={fuelForm} setForm={setFuelForm} errors={errors} saving={saving} onSubmit={handleAddFuel} isEdit={!!editId} />}
          {modal === 'oil' && <OilForm form={oilForm} setForm={setOilForm} errors={errors} saving={saving} onSubmit={handleAddOil} isEdit={!!editId} />}
          {modal === 'tire' && <TireForm form={tireForm} setForm={setTireForm} errors={errors} saving={saving} onSubmit={handleAddTire} isEdit={!!editId} />}
          {modal === 'service' && <ServiceForm form={serviceForm} setForm={setServiceForm} errors={errors} saving={saving} onSubmit={handleAddService} isEdit={!!editId} />}
        </Modal>
      )}
    </div>
  )
}

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
    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={22} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{vehicle.plateNumber}</h1>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${STATUS[status]?.bg} ${STATUS[status]?.color}`}>{STATUS[status]?.label}</span>
          </div>
          <p className="text-slate-400">{vehicle.brand} {vehicle.model}</p>
        </div>
      </div>
      <button onClick={onRefresh} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
        <RefreshCw size={20} />
      </button>
    </div>
  </header>
))

const QuickStats = memo(({ vehicle, fuelData, oilData, tires }) => (
  <div className="max-w-4xl mx-auto px-4 py-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <QuickStat icon={TrendingUp} gradient="from-blue-500 to-indigo-500" label="Probeg" value={`${fmt(vehicle.currentOdometer)} km`} />
      <QuickStat icon={Fuel} gradient="from-emerald-500 to-emerald-600" label="L/oy" value={fmt(fuelData.stats?.monthlyConsumption || 0)} />
      <QuickStat icon={Droplets} gradient={OIL_STATUS[oilData.status]?.gradient || 'from-emerald-500 to-emerald-600'} label="Moy" value={`${fmt(Math.max(0, oilData.remainingKm))} km`} warning={oilData.status !== 'ok'} />
      <QuickStat icon={Circle} gradient="from-purple-500 to-pink-500" label="Shinalar" value={tires.length} />
    </div>
  </div>
))

const QuickStat = memo(({ icon: Icon, gradient, label, value, warning }) => (
  <div className="relative bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-white/5 overflow-hidden">
    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className={`text-lg font-bold ${warning ? 'text-amber-400' : 'text-white'}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
    {warning && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
  </div>
))

const Tabs = memo(({ tab, setTab }) => {
  const tabs = [
    { id: 'summary', label: 'Umumiy', icon: BarChart3 },
    { id: 'fuel', label: 'Yoqilg\'i', icon: Fuel },
    { id: 'oil', label: 'Moy', icon: Droplets },
    { id: 'tires', label: 'Shinalar', icon: Circle },
    { id: 'services', label: 'Xizmatlar', icon: Wrench }
  ]
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex gap-1.5 bg-slate-800/30 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <t.icon size={16} /><span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
})

// ========== TAB CONTENTS ==========

const SummaryTab = memo(({ vehicle, stats, fuelData, oilData, tires, services }) => (
  <>
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-6 border border-blue-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <p className="text-slate-400 text-sm">Jami xarajatlar</p>
        </div>
        <p className="text-3xl font-bold text-white">{fmt(stats.totalCost)} <span className="text-lg text-slate-400">so'm</span></p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <ExpenseCard icon={Fuel} gradient="from-emerald-500 to-emerald-600" label="Yoqilg'i" amount={stats.totalFuelCost} count={fuelData.refills?.length || 0} />
      <ExpenseCard icon={Droplets} gradient="from-amber-500 to-orange-500" label="Moy" amount={stats.totalOilCost} count={oilData.changes?.length || 0} />
      <ExpenseCard icon={Circle} gradient="from-blue-500 to-indigo-500" label="Shinalar" amount={stats.totalTireCost} count={tires.length} />
      <ExpenseCard icon={Wrench} gradient="from-purple-500 to-pink-500" label="Xizmatlar" amount={stats.totalServiceCost} count={services.services?.length || 0} />
    </div>
    <div className="bg-slate-800/40 backdrop-blur rounded-2xl p-5 border border-white/5">
      <p className="text-slate-400 text-sm mb-4 flex items-center gap-2"><Car className="w-4 h-4" /> Mashina</p>
      <div className="space-y-3">
        <InfoRow label="Raqam" value={vehicle.plateNumber} highlight />
        <InfoRow label="Model" value={`${vehicle.brand || ''} ${vehicle.model || ''}`} />
        <InfoRow label="Yoqilg'i" value={FUEL_TYPES.find(f => f.value === vehicle.fuelType)?.label || '-'} />
        <InfoRow label="Probeg" value={`${fmt(vehicle.currentOdometer)} km`} highlight />
      </div>
    </div>
    <div className="bg-slate-800/40 backdrop-blur rounded-2xl p-5 border border-white/5">
      <p className="text-slate-400 text-sm mb-4">Holat</p>
      <div className="space-y-4">
        <StatusRow icon={Droplets} label="Moy" status={oilData.status} value={oilData.status === 'ok' ? `${fmt(oilData.remainingKm)} km` : oilData.status === 'approaching' ? 'Yaqin' : 'O\'tgan!'} />
        <StatusRow icon={Circle} label="Shinalar" status={tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length > 0 ? 'overdue' : 'ok'} value={tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length > 0 ? 'Eskirgan' : 'OK'} />
      </div>
    </div>
  </>
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

const TiresTab = memo(({ tires, onAdd, onEdit, onDelete }) => (
  <>
    <div className="flex items-center justify-between">
      <p className="text-lg font-semibold text-white">Shinalar ({tires.length})</p>
      <AddButton onClick={onAdd} />
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
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"><X size={22} /></button>
      </div>
      {children}
    </div>
  </div>
))

const Input = memo(({ label, type = 'text', value, onChange, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-800/50 border ${error ? 'border-red-500/50' : 'border-white/5'} rounded-xl text-white focus:outline-none focus:border-blue-500/50`} {...props} />
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
))

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
      <Input label="Odometr (km)" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Litr" type="number" step="0.1" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} />
    </div>
    {form.liters && form.cost && <p className="text-sm text-blue-400">1 L = {fmt(Math.round(+form.cost / +form.liters))} so'm</p>}
    <Select label="Yoqilg'i turi" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPES} />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const OilForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} max={today()} />
      <Input label="Odometr (km)" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} placeholder="10W-40" error={errors.oilType} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} />
    </div>
    <Input label="Keyingi (km)" type="number" value={form.nextChangeOdometer} onChange={v => setForm(f => ({ ...f, nextChangeOdometer: v }))} placeholder={form.odometer ? String(+form.odometer + 10000) : ''} />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const TireForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <Select label="Joylashuv" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))} options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} />
      <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="O'rnatish km" type="number" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} />
    </div>
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))

const ServiceForm = memo(({ form, setForm, errors, saving, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="p-5 space-y-4">
    <Select label="Turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} max={today()} />
      <Input label="Odometr (km)" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} />
    </div>
    <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} />
    <Input label="Tavsif" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Bajarilgan ishlar..." />
    <SubmitButton loading={saving} isEdit={isEdit} />
  </form>
))