import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, X, User, Truck, Phone, Search, Calendar, ArrowUpRight, Users, Activity, Play, Route, Fuel, Gauge } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { PhoneInputDark } from '../components/PhoneInput'
import { useAlert, DriversListSkeleton, NetworkError, ServerError } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'

// Demo data
const DEMO_DRIVERS = [
    { _id: 'd1', fullName: 'Akmal Karimov', username: 'akmal', phone: '+998901234567', status: 'busy', paymentType: 'per_trip', perTripRate: 500000 },
    { _id: 'd2', fullName: 'Bobur Aliyev', username: 'bobur', phone: '+998901234568', status: 'free', paymentType: 'monthly', baseSalary: 5000000 },
    { _id: 'd3', fullName: 'Sardor Rahimov', username: 'sardor', phone: '+998901234569', status: 'free', paymentType: 'per_trip', perTripRate: 450000 },
]
const DEMO_VEHICLES = [
    { _id: 'v1', plateNumber: '01 A 123 AB', brand: 'MAN', year: 2020, currentDriver: 'd1' },
    { _id: 'v2', plateNumber: '01 B 456 CD', brand: 'Volvo', year: 2019, currentDriver: 'd2' },
    { _id: 'v3', plateNumber: '01 C 789 EF', brand: 'Mercedes', year: 2021, currentDriver: 'd3' },
]

const INITIAL_FORM = { username: '', password: '', fullName: '', phone: '', paymentType: 'monthly', baseSalary: 0, perTripRate: 0, plateNumber: '', brand: '', year: '' }
const INITIAL_FLIGHT = { startOdometer: '', startFuel: '', fromCity: '', toCity: '', givenBudget: '', distance: '', fromCoords: null, toCoords: null, flightType: 'domestic' }

export default function DriversNew() {
    const { user, isDemo } = useAuthStore()
    const navigate = useNavigate()
    const alert = useAlert()
    const isDemoMode = isDemo()

    // State
    const [drivers, setDrivers] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [activeFlights, setActiveFlights] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showFlightModal, setShowFlightModal] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [form, setForm] = useState(INITIAL_FORM)
    const [flightForm, setFlightForm] = useState(INITIAL_FLIGHT)


    // Helpers
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Xayrli tong'
        if (hour < 18) return 'Xayrli kun'
        return 'Xayrli kech'
    }

    const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) + ' som' : '-'
    const getDriverVehicle = (driverId) => vehicles.find(v => v.currentDriver === driverId || v.currentDriver?._id === driverId)
    const resetForm = () => setForm(INITIAL_FORM)
    const resetFlightForm = () => setFlightForm(INITIAL_FLIGHT)

    // Fetch data
    const fetchData = useCallback(async () => {
        if (isDemoMode) {
            setDrivers(DEMO_DRIVERS)
            setVehicles(DEMO_VEHICLES)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
                api.get('/drivers'),
                api.get('/vehicles'),
                api.get('/flights', { params: { status: 'active' } })
            ])
            setDrivers(driversRes.data.data || [])
            setVehicles(vehiclesRes.data.data || [])
            const flights = flightsRes.data.data || []
            const flightMap = {}
            flights.forEach(f => { const id = f.driver?._id || f.driver; if (id) flightMap[id] = f })
            setActiveFlights(flightMap)
        } catch (err) {
            setError({ type: err.isNetworkError ? 'network' : 'server', message: err.userMessage || "Ma'lumotlarni yuklashda xatolik" })
        } finally {
            setLoading(false)
        }
    }, [isDemoMode])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { document.body.style.overflow = (showModal || showFlightModal) ? 'hidden' : 'unset'; return () => { document.body.style.overflow = 'unset' } }, [showModal, showFlightModal])


    // 🚀 OPTIMISTIC: Add/Update driver
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isDemoMode) { alert.info('Demo rejim', 'Demo versiyada ishlamaydi'); setShowModal(false); return }

        // Validation
        if (!form.username?.trim()) { alert.warning('Xatolik', 'Username kiriting!'); return }
        if (!editingDriver && !form.password?.trim()) { alert.warning('Xatolik', 'Parol kiriting!'); return }
        if (!form.fullName?.trim()) { alert.warning('Xatolik', 'Ism kiriting!'); return }
        if (!editingDriver && !form.plateNumber?.trim()) { alert.warning('Xatolik', 'Mashina raqamini kiriting!'); return }

        const driverData = {
            username: form.username.trim(), password: form.password, fullName: form.fullName.trim(),
            phone: form.phone, paymentType: form.paymentType,
            baseSalary: form.paymentType === 'monthly' ? Number(form.baseSalary) || 0 : 0,
            perTripRate: form.paymentType === 'per_trip' ? Number(form.perTripRate) || 0 : 0
        }
        const isEditing = !!editingDriver
        const editId = editingDriver?._id
        const driverName = form.fullName

        // 🚀 OPTIMISTIC UPDATE - UI darhol yangilanadi
        if (isEditing) {
            setDrivers(prev => prev.map(d => d._id === editId ? { ...d, ...driverData } : d))
        } else {
            const tempId = 'temp_' + Date.now()
            const tempDriver = { _id: tempId, ...driverData, status: 'free', createdAt: new Date().toISOString() }
            const tempVehicle = { _id: 'temp_v_' + Date.now(), plateNumber: form.plateNumber.toUpperCase(), brand: form.brand, year: form.year, currentDriver: tempId }
            setDrivers(prev => [tempDriver, ...prev])
            setVehicles(prev => [tempVehicle, ...prev])
        }

        // Modal yopish
        setShowModal(false)
        setEditingDriver(null)
        resetForm()
        showToast.success(isEditing ? `${driverName} yangilandi` : `${driverName} qo'shildi!`)

        // 🔄 Fonda API - xatolik bo'lsa fetchData() qayta yuklaydi
        try {
            if (isEditing) {
                await api.put(`/drivers/${editId}`, driverData)
            } else {
                const res = await api.post('/drivers', driverData)
                await api.post('/vehicles', { plateNumber: form.plateNumber.toUpperCase(), brand: form.brand, year: form.year ? Number(form.year) : undefined, currentDriver: res.data.data._id })
            }
            fetchData() // Haqiqiy data bilan sinxronlash
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
            fetchData() // Xatolik - qayta yuklash
        }
    }


    // 🚀 OPTIMISTIC: Delete driver
    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (isDemoMode) { alert.info('Demo rejim', 'Demo versiyada ishlamaydi'); return }

        const driver = drivers.find(d => d._id === id)
        const confirmed = await alert.confirm({ title: "O'chirish", message: `${driver?.fullName}ni o'chirishni xohlaysizmi?`, confirmText: "Ha", type: "danger" })
        if (!confirmed) return

        // 🚀 OPTIMISTIC - darhol o'chirish
        setDrivers(prev => prev.filter(d => d._id !== id))
        showToast.success("Shofyor o'chirildi")

        try {
            await api.delete(`/drivers/${id}`)
        } catch (err) {
            showToast.error(err.response?.data?.message || "O'chirishda xatolik")
            fetchData()
        }
    }

    // 🚀 OPTIMISTIC: Start flight
    const handleStartFlight = async (e) => {
        e.preventDefault()
        if (isDemoMode) { alert.info('Demo rejim', 'Demo versiyada ishlamaydi'); setShowFlightModal(false); return }
        if (!flightForm.fromCity?.trim() || !flightForm.toCity?.trim()) { alert.warning('Xatolik', 'Manzillarni kiriting!'); return }

        const vehicle = getDriverVehicle(selectedDriver._id)
        if (!vehicle) { alert.error('Xatolik', 'Mashina biriktirilmagan'); return }

        const payload = {
            driverId: selectedDriver._id,
            startOdometer: Number(flightForm.startOdometer) || 0,
            startFuel: Number(flightForm.startFuel) || 0,
            flightType: flightForm.flightType,
            firstLeg: { fromCity: flightForm.fromCity, toCity: flightForm.toCity, fromCoords: flightForm.fromCoords, toCoords: flightForm.toCoords, givenBudget: Number(flightForm.givenBudget) || 0, distance: Number(flightForm.distance) || 0 }
        }

        // 🚀 OPTIMISTIC - darhol yangilash
        const driverId = selectedDriver._id
        setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, status: 'busy' } : d))
        setActiveFlights(prev => ({ ...prev, [driverId]: { _id: 'temp', name: `${flightForm.fromCity} → ${flightForm.toCity}`, status: 'active' } }))

        const fromCity = flightForm.fromCity
        const toCity = flightForm.toCity

        setShowFlightModal(false)
        resetFlightForm()
        setSelectedDriver(null)
        showToast.success(`Reys ochildi: ${fromCity} → ${toCity}`)

        // 🚀 API fonda ishlaydi - navigate qilmaymiz, foydalanuvchi o'zi bosadi
        api.post('/flights', payload)
            .then((res) => {
                const newFlight = res.data.data
                setActiveFlights(prev => ({ ...prev, [driverId]: newFlight }))
            })
            .catch((err) => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                // Xatolik - shofyor statusini qaytarish
                setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, status: 'free' } : d))
                setActiveFlights(prev => { const m = { ...prev }; delete m[driverId]; return m })
            })
    }

    const handleEdit = (e, driver) => {
        e.stopPropagation()
        setEditingDriver(driver)
        setForm({ username: driver.username || '', password: '', fullName: driver.fullName || '', phone: driver.phone || '', paymentType: driver.paymentType || 'monthly', baseSalary: driver.baseSalary || 0, perTripRate: driver.perTripRate || 0, plateNumber: '', brand: '', year: '' })
        setShowModal(true)
    }

    // Filter
    const filteredDrivers = drivers.filter(d => {
        const matchSearch = d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone?.includes(searchQuery)
        const matchStatus = filterStatus === 'all' || d.status === filterStatus
        return matchSearch && matchStatus
    })


    // Loading & Error states
    if (loading) return <DriversListSkeleton count={6} />
    if (error?.type === 'network') return <NetworkError onRetry={fetchData} message={error.message} />
    if (error?.type === 'server') return <ServerError onRetry={fetchData} message={error.message} />

    const stats = [
        { label: 'Jami', value: drivers.length, icon: Users, color: 'from-blue-400 to-blue-600' },
        { label: 'Reysda', value: drivers.filter(d => d.status === 'busy').length, icon: Activity, color: 'from-orange-400 to-orange-600' },
        { label: "Bo'sh", value: drivers.filter(d => d.status === 'free').length, icon: User, color: 'from-green-400 to-green-600' },
        { label: 'Mashinalar', value: vehicles.length, icon: Truck, color: 'from-purple-400 to-purple-600' },
    ]

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl">
                <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-24 sm:-mr-32 md:-mr-48 -mt-24 sm:-mt-32 md:-mt-48" />
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 sm:-ml-24 md:-ml-32 -mb-16 sm:-mb-24 md:-mb-32" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
                            <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{getGreeting()}, {user?.companyName || 'Admin'}! 👋</h1>
                        <p className="text-blue-200 text-sm sm:text-base">Shofyorlarni boshqaring va kuzating</p>
                    </div>
                    <button onClick={() => { setEditingDriver(null); resetForm(); setShowModal(true) }} className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-slate-900 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center">
                        <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden sm:inline">Yangi shofyor</span>
                        <span className="sm:hidden">Qo'shish</span>
                        <ArrowUpRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform hidden sm:block" />
                    </button>
                </div>

                {/* Stats */}
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
                    {stats.map((item, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                                    <item.icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
                                    <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base" />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[{ value: 'all', label: 'Barchasi' }, { value: 'free', label: "Bo'sh" }, { value: 'busy', label: 'Reysda' }].map(({ value, label }) => (
                        <button key={value} onClick={() => setFilterStatus(value)} className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${filterStatus === value ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredDrivers.map((driver) => {
                    const vehicle = getDriverVehicle(driver._id)
                    const flight = activeFlights[driver._id]
                    return (
                        <div key={driver._id} onClick={() => navigate(`/dashboard/drivers/${driver._id}`)} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0 ${driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>{driver.fullName?.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm sm:text-base truncate">{driver.fullName}</h3>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm"><Phone size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" /><span className="truncate">{driver.phone || "Telefon yo'q"}</span></div>
                                    </div>
                                </div>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{driver.status === 'busy' ? 'Reysda' : "Bo'sh"}</span>
                            </div>

                            {/* Vehicle */}
                            <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${vehicle ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                {vehicle ? (
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"><Truck size={14} className="sm:w-[18px] sm:h-[18px] text-blue-600" /></div>
                                        <div className="min-w-0"><p className="font-semibold text-blue-700 text-sm sm:text-base truncate">{vehicle.plateNumber}</p><p className="text-[10px] sm:text-xs text-gray-500 truncate">{vehicle.brand} {vehicle.year && `(${vehicle.year})`}</p></div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 sm:gap-3 text-gray-400"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0"><Truck size={14} className="sm:w-[18px] sm:h-[18px]" /></div><span className="text-xs sm:text-sm">Mashina biriktirilmagan</span></div>
                                )}
                            </div>

                            {/* Active Flight */}
                            {driver.status === 'busy' && flight && (
                                <div onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/flights/${flight._id}`) }} className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 cursor-pointer hover:shadow-md transition">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0"><Route size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" /><span className="font-medium text-orange-700 text-xs sm:text-sm truncate">{flight.name || 'Faol reys'}</span></div>
                                        <span className="text-[10px] sm:text-xs text-orange-500 flex-shrink-0">{flight.legs?.length || 0} bosqich →</span>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-gray-100">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs text-gray-400">{driver.paymentType === 'per_trip' ? '💰 Reys uchun' : '💵 Oylik'}</p>
                                    <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{driver.paymentType === 'per_trip' ? formatMoney(driver.perTripRate) + '/reys' : formatMoney(driver.baseSalary)}</p>
                                </div>
                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {driver.status === 'free' && <button onClick={(e) => { e.stopPropagation(); setSelectedDriver(driver); setShowFlightModal(true) }} className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Reys ochish"><Play size={16} className="sm:w-[18px] sm:h-[18px]" /></button>}
                                    {driver.status === 'busy' && flight && <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/flights/${flight._id}`) }} className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Reysni davom ettirish"><Route size={16} className="sm:w-[18px] sm:h-[18px]" /></button>}
                                    <button onClick={(e) => handleEdit(e, driver)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                                    <button onClick={(e) => handleDelete(e, driver._id)} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {filteredDrivers.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={40} className="text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Shofyorlar topilmadi</h3>
                    <p className="text-gray-500 mb-6">{searchQuery ? 'Qidiruv natijasi bosh' : 'Hozircha shofyorlar yoq'}</p>
                    <button onClick={() => { setEditingDriver(null); resetForm(); setShowModal(true) }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">Birinchi shofyorni qoshing</button>
                </div>
            )}


            {/* Add/Edit Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="absolute inset-0" onClick={() => setShowModal(false)} />
                        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10">
                                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl" />
                                <div className="relative flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"><User className="w-7 h-7 text-white" /></div>
                                        <div><h2 className="text-xl font-bold text-white">{editingDriver ? 'Tahrirlash' : 'Yangi shofyor'}</h2><p className="text-blue-300 text-sm">{editingDriver ? 'Malumotlarni yangilang' : 'Yangi shofyor qoshing'}</p></div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"><X size={24} /></button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-semibold text-blue-200 mb-2">Username *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50" placeholder="username" required disabled={!!editingDriver} /></div>
                                    {!editingDriver && <div><label className="block text-sm font-semibold text-blue-200 mb-2">Parol *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" placeholder="********" required /></div>}
                                </div>
                                <div><label className="block text-sm font-semibold text-blue-200 mb-2">To'liq ism *</label><input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" placeholder="Ism Familiya" required /></div>
                                <div className="dark-phone"><label className="block text-sm font-semibold text-blue-200 mb-2">Telefon</label><PhoneInputDark value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="Telefon raqam" /></div>

                                {/* Payment type */}
                                <div><label className="block text-sm font-semibold text-blue-200 mb-2">To'lov turi *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setForm({ ...form, paymentType: 'monthly' })} className={`p-4 rounded-xl border-2 transition-all ${form.paymentType === 'monthly' ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}><div className="text-2xl mb-1">💰</div><div className="font-semibold text-sm">Oylik maosh</div></button>
                                        <button type="button" onClick={() => setForm({ ...form, paymentType: 'per_trip' })} className={`p-4 rounded-xl border-2 transition-all ${form.paymentType === 'per_trip' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}><div className="text-2xl mb-1">🚛</div><div className="font-semibold text-sm">Reys uchun</div></button>
                                    </div>
                                </div>
                                {form.paymentType === 'monthly' ? <div><label className="block text-sm font-semibold text-blue-200 mb-2">Oylik maosh (so'm)</label><input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" placeholder="5000000" /></div> : <div><label className="block text-sm font-semibold text-blue-200 mb-2">Har reys uchun (so'm)</label><input type="number" value={form.perTripRate} onChange={(e) => setForm({ ...form, perTripRate: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" placeholder="500000" /></div>}

                                {/* Vehicle */}
                                {!editingDriver && (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Truck size={18} className="text-white" /></div><span className="font-semibold text-white">Mashina *</span></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-sm font-medium text-slate-400 mb-2">Davlat raqami *</label><input type="text" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" placeholder="01 A 234 AB" required /></div>
                                            <div><label className="block text-sm font-medium text-slate-400 mb-2">Marka *</label><input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" required placeholder="MAN, Volvo..." /></div>
                                        </div>
                                        <div><label className="block text-sm font-medium text-slate-400 mb-2">Yil</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" placeholder="2020" /></div>
                                    </div>
                                )}
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"><Plus size={20} /> {editingDriver ? 'Saqlash' : "Shofyor qo'shish"}</button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* Flight Modal */}
            {showFlightModal && selectedDriver && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="absolute inset-0" onClick={() => { setShowFlightModal(false); resetFlightForm(); setSelectedDriver(null) }} />
                        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10">
                                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-t-3xl" />
                                <div className="relative flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30"><Route className="w-7 h-7 text-white" /></div>
                                        <div><h2 className="text-xl font-bold text-white">Reys ochish</h2><p className="text-green-300 text-sm">{selectedDriver.fullName}</p></div>
                                    </div>
                                    <button onClick={() => { setShowFlightModal(false); resetFlightForm(); setSelectedDriver(null) }} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"><X size={24} /></button>
                                </div>
                            </div>

                            <form onSubmit={handleStartFlight} className="p-6 space-y-5">
                                {/* Vehicle info */}
                                {(() => { const v = getDriverVehicle(selectedDriver._id); return v ? <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20"><div className="flex items-center gap-3"><Truck size={20} className="text-blue-400" /><div><p className="text-white font-semibold">{v.plateNumber}</p><p className="text-blue-300 text-sm">{v.brand}</p></div></div></div> : <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20"><p className="text-red-400 text-sm">⚠️ Mashina biriktirilmagan</p></div> })()}

                                {/* Flight type */}
                                <div><label className="block text-sm font-semibold text-blue-200 mb-3">Reys turi</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setFlightForm({ ...flightForm, flightType: 'domestic' })} className={`p-4 rounded-xl border-2 transition-all ${flightForm.flightType === 'domestic' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}><div className="text-2xl mb-1">🇺🇿</div><div className="font-semibold text-sm">Mahalliy</div></button>
                                        <button type="button" onClick={() => setFlightForm({ ...flightForm, flightType: 'international' })} className={`p-4 rounded-xl border-2 transition-all ${flightForm.flightType === 'international' ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}><div className="text-2xl mb-1">🌍</div><div className="font-semibold text-sm">Xalqaro</div></button>
                                    </div>
                                </div>

                                {/* Odometer & Fuel */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-semibold text-blue-200 mb-2"><Gauge size={14} className="inline mr-1" />Odometr (km)</label><input type="number" value={flightForm.startOdometer} onChange={(e) => setFlightForm({ ...flightForm, startOdometer: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" placeholder="123456" /></div>
                                    <div><label className="block text-sm font-semibold text-blue-200 mb-2"><Fuel size={14} className="inline mr-1" />Yoqilg'i (L)</label><input type="number" value={flightForm.startFuel} onChange={(e) => setFlightForm({ ...flightForm, startFuel: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" placeholder="100" /></div>
                                </div>

                                {/* Route */}
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                    <p className="text-white font-semibold flex items-center gap-2"><Route size={16} className="text-green-400" />Birinchi bosqich</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-slate-400 mb-2">Qayerdan *</label><AddressAutocomplete value={flightForm.fromCity} onChange={(val) => setFlightForm({ ...flightForm, fromCity: val })} onSelect={(s) => setFlightForm({ ...flightForm, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } })} placeholder="Toshkent" focusColor="green" domesticOnly={flightForm.flightType === 'domestic'} /></div>
                                        <div><label className="block text-sm font-medium text-slate-400 mb-2">Qayerga *</label><AddressAutocomplete value={flightForm.toCity} onChange={(val) => setFlightForm({ ...flightForm, toCity: val })} onSelect={(s) => setFlightForm({ ...flightForm, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } })} placeholder="Samarqand" focusColor="green" domesticOnly={flightForm.flightType === 'domestic'} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-slate-400 mb-2">Yo'l xarajati (so'm)</label><input type="number" value={flightForm.givenBudget} onChange={(e) => setFlightForm({ ...flightForm, givenBudget: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition" placeholder="200000" /></div>
                                        <div><label className="block text-sm font-medium text-slate-400 mb-2">Masofa (km)</label><input type="number" value={flightForm.distance} onChange={(e) => setFlightForm({ ...flightForm, distance: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" placeholder="300" /></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 text-center">💡 Reys ochilgandan keyin yangi bosqichlar qo'shishingiz mumkin</p>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all"><Play size={20} /> Reysni boshlash</button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
