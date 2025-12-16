import { useEffect, useState, useCallback, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert, DriversListSkeleton, NetworkError, ServerError } from '../components/ui'
import LocationPicker from '../components/LocationPicker'
import {
    DriverCard,
    DriversHeader,
    DriversSearch,
    DriverModal,
    FlightModal,
    EmptyState
} from '../components/drivers'

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

// Reducer
const dataReducer = (state, action) => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, drivers: action.drivers, vehicles: action.vehicles, activeFlights: action.activeFlights }
        case 'START_FLIGHT':
            return {
                ...state,
                drivers: state.drivers.map(d => d._id === action.driverId ? { ...d, status: 'busy' } : d),
                activeFlights: { ...state.activeFlights, [action.driverId]: action.flight }
            }
        case 'UPDATE_FLIGHT':
            return { ...state, activeFlights: { ...state.activeFlights, [action.driverId]: action.flight } }
        case 'REVERT_FLIGHT':
            const newFlights = { ...state.activeFlights }
            delete newFlights[action.driverId]
            return {
                ...state,
                drivers: state.drivers.map(d => d._id === action.driverId ? { ...d, status: 'free' } : d),
                activeFlights: newFlights
            }
        case 'ADD_DRIVER':
            return { ...state, drivers: [action.driver, ...state.drivers], vehicles: action.vehicle ? [action.vehicle, ...state.vehicles] : state.vehicles }
        case 'UPDATE_DRIVER':
            return { ...state, drivers: state.drivers.map(d => d._id === action.id ? { ...d, ...action.data } : d) }
        case 'DELETE_DRIVER':
            return { ...state, drivers: state.drivers.filter(d => d._id !== action.id) }
        default:
            return state
    }
}

export default function DriversNew() {
    const { user, isDemo } = useAuthStore()
    const navigate = useNavigate()
    const alert = useAlert()
    const isDemoMode = isDemo()

    // Data state
    const [data, dispatch] = useReducer(dataReducer, { drivers: [], vehicles: [], activeFlights: {} })
    const { drivers, vehicles, activeFlights } = data

    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showFlightModal, setShowFlightModal] = useState(false)
    const [showLocationPicker, setShowLocationPicker] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [form, setForm] = useState(INITIAL_FORM)
    const [flightForm, setFlightForm] = useState(INITIAL_FLIGHT)

    // Helpers
    const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) + ' som' : '-'
    const getDriverVehicle = (driverId) => vehicles.find(v => v.currentDriver === driverId || v.currentDriver?._id === driverId)
    const resetForm = () => setForm(INITIAL_FORM)
    const resetFlightForm = () => setFlightForm(INITIAL_FLIGHT)

    // Fetch data
    const fetchData = useCallback(async (showLoader = true) => {
        if (isDemoMode) {
            dispatch({ type: 'SET_DATA', drivers: DEMO_DRIVERS, vehicles: DEMO_VEHICLES, activeFlights: {} })
            setLoading(false)
            return
        }
        if (showLoader && drivers.length === 0) setLoading(true)
        setError(null)
        try {
            const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
                api.get('/drivers'),
                api.get('/vehicles'),
                api.get('/flights', { params: { status: 'active' } })
            ])
            const flights = flightsRes.data.data || []
            const flightMap = {}
            flights.forEach(f => { const id = f.driver?._id || f.driver; if (id) flightMap[id] = f })
            dispatch({ type: 'SET_DATA', drivers: driversRes.data.data || [], vehicles: vehiclesRes.data.data || [], activeFlights: flightMap })
        } catch (err) {
            setError({ type: err.isNetworkError ? 'network' : 'server', message: err.userMessage || "Ma'lumotlarni yuklashda xatolik" })
        } finally {
            setLoading(false)
        }
    }, [isDemoMode])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => {
        const isModalOpen = showModal || showFlightModal || showLocationPicker
        if (isModalOpen) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [showModal, showFlightModal, showLocationPicker])


    // Add/Update driver
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isDemoMode) { alert.info('Demo rejim', 'Demo versiyada ishlamaydi'); setShowModal(false); return }

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

        if (isEditing) {
            dispatch({ type: 'UPDATE_DRIVER', id: editId, data: driverData })
        } else {
            const tempId = 'temp_' + Date.now()
            const tempDriver = { _id: tempId, ...driverData, status: 'free', createdAt: new Date().toISOString() }
            const tempVehicle = { _id: 'temp_v_' + Date.now(), plateNumber: form.plateNumber.toUpperCase(), brand: form.brand, year: form.year, currentDriver: tempId }
            dispatch({ type: 'ADD_DRIVER', driver: tempDriver, vehicle: tempVehicle })
        }
        setShowModal(false)
        setEditingDriver(null)
        resetForm()
        showToast.success(isEditing ? `${driverName} yangilandi` : `${driverName} qo'shildi!`)

        try {
            if (isEditing) {
                await api.put(`/drivers/${editId}`, driverData)
            } else {
                const res = await api.post('/drivers', driverData)
                await api.post('/vehicles', { plateNumber: form.plateNumber.toUpperCase(), brand: form.brand, year: form.year ? Number(form.year) : undefined, currentDriver: res.data.data._id })
            }
            fetchData(false)
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
            fetchData(false)
        }
    }

    // Delete driver
    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (isDemoMode) { alert.info('Demo rejim', 'Demo versiyada ishlamaydi'); return }

        const driver = drivers.find(d => d._id === id)
        const confirmed = await alert.confirm({ title: "O'chirish", message: `${driver?.fullName}ni o'chirishni xohlaysizmi?`, confirmText: "Ha", type: "danger" })
        if (!confirmed) return

        dispatch({ type: 'DELETE_DRIVER', id })
        showToast.success("Shofyor o'chirildi")

        try {
            await api.delete(`/drivers/${id}`)
        } catch (err) {
            showToast.error(err.response?.data?.message || "O'chirishda xatolik")
            fetchData(false)
        }
    }

    // Start flight
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

        const driverId = selectedDriver._id
        const tempFlight = { _id: 'temp_' + Date.now(), name: `${flightForm.fromCity} → ${flightForm.toCity}`, status: 'active', legs: [{ fromCity: flightForm.fromCity, toCity: flightForm.toCity }] }

        dispatch({ type: 'START_FLIGHT', driverId, flight: tempFlight })
        showToast.success(`Reys ochildi: ${flightForm.fromCity} → ${flightForm.toCity}`)

        setTimeout(() => {
            setShowFlightModal(false)
            setSelectedDriver(null)
            resetFlightForm()
        }, 50)

        api.post('/flights', payload)
            .then((res) => dispatch({ type: 'UPDATE_FLIGHT', driverId, flight: res.data.data }))
            .catch((err) => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                dispatch({ type: 'REVERT_FLIGHT', driverId })
            })
    }

    const handleEdit = (e, driver) => {
        e.stopPropagation()
        setEditingDriver(driver)
        setForm({ username: driver.username || '', password: '', fullName: driver.fullName || '', phone: driver.phone || '', paymentType: driver.paymentType || 'monthly', baseSalary: driver.baseSalary || 0, perTripRate: driver.perTripRate || 0, plateNumber: '', brand: '', year: '' })
        setShowModal(true)
    }

    const handleLocationSelect = (data) => {
        setFlightForm(prev => ({
            ...prev,
            fromCity: data.startAddress || prev.fromCity,
            toCity: data.endAddress,
            fromCoords: data.startPoint || prev.fromCoords,
            toCoords: data.endPoint,
            distance: data.distance || ''
        }))
        setShowLocationPicker(false)
        setShowFlightModal(true)
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

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            <DriversHeader
                user={user}
                drivers={drivers}
                vehicles={vehicles}
                onAddDriver={() => { setEditingDriver(null); resetForm(); setShowModal(true) }}
            />

            <DriversSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredDrivers.map((driver) => (
                    <DriverCard
                        key={driver._id}
                        driver={driver}
                        vehicle={getDriverVehicle(driver._id)}
                        flight={activeFlights[driver._id]}
                        onNavigate={(id) => navigate(`/dashboard/drivers/${id}`)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStartFlight={(d) => { setSelectedDriver(d); setShowFlightModal(true) }}
                        onViewFlight={(id) => navigate(`/dashboard/flights/${id}`)}
                        formatMoney={formatMoney}
                    />
                ))}
            </div>

            {filteredDrivers.length === 0 && (
                <EmptyState
                    searchQuery={searchQuery}
                    onAddDriver={() => { setEditingDriver(null); resetForm(); setShowModal(true) }}
                />
            )}

            {/* Modals */}
            <DriverModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editingDriver={editingDriver}
            />

            <FlightModal
                show={showFlightModal}
                onClose={() => setShowFlightModal(false)}
                onSubmit={handleStartFlight}
                form={flightForm}
                setForm={setFlightForm}
                selectedDriver={selectedDriver}
                onOpenLocationPicker={() => { setShowFlightModal(false); setShowLocationPicker(true) }}
            />

            {showLocationPicker && (
                <LocationPicker
                    onSelect={handleLocationSelect}
                    onClose={() => { setShowLocationPicker(false); setShowFlightModal(true) }}
                />
            )}
        </div>
    )
}
