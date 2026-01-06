import { useEffect, useState, useCallback, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert, DriversListSkeleton, NetworkError, ServerError } from '../components/ui'
import LocationPicker from '../components/LocationPicker'
import { useSocket } from '../hooks/useSocket'
import VoiceFlightCreator from '../components/VoiceFlightCreator'
import { ExpenseModal } from '../components/flightDetail/AllModals'
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

const INITIAL_FORM = { username: '', password: '', fullName: '', phone: '', paymentType: 'monthly', baseSalary: 0, perTripRate: 0, plateNumber: '', brand: '', year: '', vehicleId: '', oilChangeIntervalKm: 15000, lastOilChangeOdometer: 0, currentOdometer: 0 }
const INITIAL_FLIGHT = { startOdometer: '', startFuel: '', fromCity: '', toCity: '', givenBudget: '', fromCoords: null, toCoords: null, flightType: 'domestic', fuelType: 'benzin', fuelUnit: 'litr' }

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
        case 'REPLACE_DRIVER':
            return {
                ...state,
                drivers: state.drivers.map(d => d._id === action.tempId ? action.driver : d),
                vehicles: action.vehicle ? state.vehicles.map(v => v._id === action.tempVehicleId ? action.vehicle : v) : state.vehicles
            }
        default:
            return state
    }
}

export default function DriversNew() {
    const { user, isDemo } = useAuthStore()
    const navigate = useNavigate()
    const alert = useAlert()
    const isDemoMode = isDemo()
    const { socket, joinBusinessRoom } = useSocket()

    // Data state
    const [data, dispatch] = useReducer(dataReducer, { drivers: [], vehicles: [], activeFlights: {} })
    const { drivers, vehicles, activeFlights } = data

    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showFlightModal, setShowFlightModal] = useState(false)
    const [showLocationPicker, setShowLocationPicker] = useState(false)
    const [showVoiceFlight, setShowVoiceFlight] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [form, setForm] = useState(INITIAL_FORM)
    const [flightForm, setFlightForm] = useState(INITIAL_FLIGHT)
    const [expenseLoading, setExpenseLoading] = useState(false)
    const [selectedLegForExpense, setSelectedLegForExpense] = useState(null)
    const [editingExpense, setEditingExpense] = useState(null)

    // 🔌 Biznesmen xonasiga qo'shilish - real-time uchun
    useEffect(() => {
        if (user?._id && !isDemoMode) {
            joinBusinessRoom(user._id)
        }
    }, [user?._id, isDemoMode, joinBusinessRoom])

    // 🔌 Socket.io - Real-time yangilanishlar
    useEffect(() => {
        if (!socket || isDemoMode) return

        // Flight boshlanganda - shofyor statusini yangilash
        socket.on('flight-started', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                dispatch({ type: 'START_FLIGHT', driverId, flight: data.flight })
                showToast.success(data.message || 'Yangi marshrut boshlandi!')
            }
        })

        // Flight yangilanganda
        socket.on('flight-updated', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                dispatch({ type: 'UPDATE_FLIGHT', driverId, flight: data.flight })
                if (data.message) {
                    showToast.info(data.message)
                }
            }
        })

        // Flight yopilganda - shofyor statusini yangilash
        socket.on('flight-completed', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                dispatch({ type: 'REVERT_FLIGHT', driverId })
                showToast.success(data.message || 'Marshrut yopildi!')
            }
        })

        // Flight tasdiqlanganda
        socket.on('flight-confirmed', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                dispatch({ type: 'UPDATE_FLIGHT', driverId, flight: data.flight })
                showToast.success(data.message || 'Mashrut tasdiqlandi!')
            }
        })

        // Flight o'chirilganda
        socket.on('flight-deleted', (data) => {
            if (data.flightId) {
                // Qaysi shofyorga tegishli ekanini topish
                const driverId = Object.keys(activeFlights).find(id => activeFlights[id]?._id === data.flightId)
                if (driverId) {
                    dispatch({ type: 'REVERT_FLIGHT', driverId })
                }
                showToast.warning(data.message || 'Mashrut o\'chirildi')
            }
        })

        // Flight bekor qilinganda
        socket.on('flight-cancelled', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                dispatch({ type: 'REVERT_FLIGHT', driverId })
                showToast.warning(data.message || 'Marshrut bekor qilindi')
            }
        })

        // Xarajat tasdiqlanganda (haydovchi tomonidan)
        socket.on('expense-confirmed', (data) => {
            if (data.flight) {
                const driverId = data.flight.driver?._id || data.flight.driver
                // Deep copy qilish - React state yangilanishini ta'minlash
                const newFlight = JSON.parse(JSON.stringify(data.flight))
                dispatch({ type: 'UPDATE_FLIGHT', driverId, flight: newFlight })
                showToast.success(data.message || 'Haydovchi xarajatni tasdiqladi')
            }
        })

        // Shofyor joylashuvi yangilanganda
        socket.on('driver-location', (data) => {
            // Bu yerda shofyor joylashuvini yangilash mumkin (agar kerak bo'lsa)
        })

        return () => {
            socket.off('flight-started')
            socket.off('flight-updated')
            socket.off('flight-completed')
            socket.off('flight-confirmed')
            socket.off('flight-deleted')
            socket.off('flight-cancelled')
            socket.off('expense-confirmed')
            socket.off('driver-location')
        }
    }, [socket, isDemoMode, activeFlights])

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
        const isModalOpen = showModal || showFlightModal || showLocationPicker || showVoiceFlight || showExpenseModal
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
    }, [showModal, showFlightModal, showLocationPicker, showVoiceFlight, showExpenseModal])


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
            phone: form.phone, paymentType: 'monthly',
            baseSalary: Number(form.baseSalary) || 0,
            perTripRate: 0
        }

        // Mashina ma'lumotlari
        const vehicleData = {
            plateNumber: form.plateNumber?.toUpperCase(),
            brand: form.brand,
            year: form.year ? Number(form.year) : undefined,
            oilChangeIntervalKm: Number(form.oilChangeIntervalKm) || 15000,
            lastOilChangeOdometer: Number(form.lastOilChangeOdometer) || 0
        }

        const isEditing = !!editingDriver
        const editId = editingDriver?._id
        const driverName = form.fullName

        let tempId = null // tempId ni shu yerda aniqlaymiz, shunda pastda ishlata olamiz
        let tempVehicleId = null // tempVehicleId ni ham shu yerda aniqlaymiz

        if (isEditing) {
            dispatch({ type: 'UPDATE_DRIVER', id: editId, data: driverData })
        } else {
            tempId = 'temp_' + Date.now()
            const tempDriver = { _id: tempId, ...driverData, status: 'free', createdAt: new Date().toISOString() }
            tempVehicleId = 'temp_v_' + Date.now()
            const tempVehicle = { _id: tempVehicleId, ...vehicleData, currentDriver: tempId }
            dispatch({ type: 'ADD_DRIVER', driver: tempDriver, vehicle: tempVehicle })
        }
        setShowModal(false)
        setEditingDriver(null)
        resetForm()
        showToast.success(isEditing ? `${driverName} yangilandi` : `${driverName} qo'shildi!`)

        try {
            if (isEditing) {
                await api.put(`/drivers/${editId}`, driverData)
                // Mashina ma'lumotlarini ham yangilash
                if (form.vehicleId) {
                    await api.put(`/vehicles/${form.vehicleId}`, vehicleData)
                }
                // Tahrirlashda fetch shart emas, chunki biz optimistik yangiladik
                // Lekin backgroundda yangilab qo'yish zarar qilmaydi (silent)
                fetchData(false)
            } else {
                const res = await api.post('/drivers', driverData)
                const newDriver = res.data.data

                // Mashina yaratish
                let newVehicle = null
                if (vehicleData.plateNumber) {
                    const vRes = await api.post('/vehicles', { ...vehicleData, currentDriver: newDriver._id })
                    newVehicle = vRes.data.data
                }

                // Temp ID ni real ID ga almashtirish
                // Biz yuqorida tempId ni aniqlaganmiz, endi uni bemalol ishlata olamiz
                dispatch({
                    type: 'REPLACE_DRIVER',
                    tempId: tempId,
                    driver: newDriver,
                    vehicle: newVehicle,
                    tempVehicleId: tempVehicleId
                })
            }
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

        const driverId = selectedDriver._id
        const fromCity = flightForm.fromCity
        const toCity = flightForm.toCity

        // 🚀 OPTIMISTIC UPDATE - Darhol UI yangilanadi
        const tempFlight = {
            _id: 'temp_' + Date.now(),
            name: `${fromCity} → ${toCity}`,
            status: 'active',
            driver: { _id: driverId, fullName: selectedDriver.fullName },
            vehicle: { _id: vehicle._id, plateNumber: vehicle.plateNumber },
            legs: [{ fromCity, toCity, status: 'in_progress' }],
            totalDistance: Number(flightForm.distance) || 0,
            totalGivenBudget: Number(flightForm.givenBudget) || 0
        }

        // Darhol modal yopiladi va UI yangilanadi
        dispatch({ type: 'START_FLIGHT', driverId, flight: tempFlight })
        setShowFlightModal(false)
        setSelectedDriver(null)
        showToast.success(`Mashrut ochildi: ${fromCity} → ${toCity}`)

        // Form tozalanadi
        const formData = { ...flightForm }
        resetFlightForm()

        // Fonda API so'rovi
        const payload = {
            driverId,
            startOdometer: Number(formData.startOdometer) || 0,
            startFuel: Number(formData.startFuel) || 0,
            fuelType: formData.fuelType || 'benzin',
            fuelUnit: formData.fuelUnit || 'litr',
            flightType: formData.flightType,
            firstLeg: {
                fromCity,
                toCity,
                fromCoords: formData.fromCoords,
                toCoords: formData.toCoords,
                givenBudget: Number(formData.givenBudget) || 0
            }
        }

        api.post('/flights', payload)
            .then((res) => dispatch({ type: 'UPDATE_FLIGHT', driverId, flight: res.data.data }))
            .catch((err) => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                dispatch({ type: 'REVERT_FLIGHT', driverId })
            })
    }

    // Ovoz bilan reys ochish
    const handleVoiceFlightCreate = async (flightData) => {
        if (isDemoMode) {
            alert.info('Demo rejim', 'Demo versiyada ishlamaydi')
            setShowVoiceFlight(false)
            return
        }

        const driver = drivers.find(d => d._id === flightData.driverId)
        const vehicle = flightData.vehicleId
            ? vehicles.find(v => v._id === flightData.vehicleId)
            : getDriverVehicle(flightData.driverId)

        if (!driver) {
            alert.error('Xatolik', 'Haydovchi topilmadi')
            return
        }
        if (!vehicle) {
            alert.error('Xatolik', 'Mashina biriktirilmagan')
            return
        }

        const leg = flightData.legs[0]
        const driverId = driver._id

        // Optimistic update
        const tempFlight = {
            _id: 'temp_' + Date.now(),
            name: `${leg.fromCity} → ${leg.toCity}`,
            status: 'active',
            driver: { _id: driverId, fullName: driver.fullName },
            vehicle: { _id: vehicle._id, plateNumber: vehicle.plateNumber },
            legs: [{ fromCity: leg.fromCity, toCity: leg.toCity, status: 'in_progress', givenBudget: leg.givenBudget }],
            totalGivenBudget: leg.givenBudget || 0
        }

        dispatch({ type: 'START_FLIGHT', driverId, flight: tempFlight })
        setShowVoiceFlight(false)
        showToast.success(`🎤 Mashrut ochildi: ${leg.fromCity} → ${leg.toCity}`)

        // API so'rovi - FlightModal bilan bir xil format
        const payload = {
            driverId,
            startOdometer: Number(flightData.startOdometer) || 0,
            startFuel: Number(flightData.startFuel) || 0,
            fuelType: flightData.fuelType || 'metan',
            fuelUnit: flightData.fuelType === 'metan' || flightData.fuelType === 'propan' ? 'kub' : 'litr',
            flightType: flightData.flightType || 'domestic',
            firstLeg: {
                fromCity: leg.fromCity,
                toCity: leg.toCity,
                fromCoords: leg.fromCoords,
                toCoords: leg.toCoords,
                givenBudget: leg.givenBudget || 0
            }
        }

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
        setForm({
            username: driver.username || '',
            password: '',
            fullName: driver.fullName || '',
            phone: driver.phone || '',
            paymentType: driver.paymentType || 'monthly',
            baseSalary: driver.baseSalary || 0,
            perTripRate: driver.perTripRate || 0,
            plateNumber: '',
            brand: '',
            year: '',
            vehicleId: '',
            oilChangeIntervalKm: 15000,
            lastOilChangeOdometer: 0,
            currentOdometer: 0
        })
        setShowModal(true)
    }

    // Parol yangilash
    const handlePasswordUpdate = async (driverId, newPassword) => {
        if (isDemoMode) {
            throw new Error('Demo versiyada ishlamaydi')
        }
        await api.put(`/drivers/${driverId}/password`, { password: newPassword })
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

    // Xarajat qo'shish - ExpenseModal orqali
    const handleAddExpense = (driver) => {
        setSelectedDriver(driver)
        setSelectedLegForExpense(null)
        setEditingExpense(null)
        setShowExpenseModal(true)
    }

    // ExpenseModal submit handler
    const handleExpenseSubmit = async (data) => {
        if (isDemoMode) {
            alert.info('Demo rejim', 'Demo versiyada ishlamaydi')
            return
        }

        setExpenseLoading(true)
        try {
            const flight = activeFlights[selectedDriver._id]

            if (flight) {
                // Faol reysga xarajat qo'shish - timing 'during' bo'ladi
                await api.post(`/flights/${flight._id}/expenses`, {
                    ...data,
                    timing: data.timing || 'during'  // Data'dan kelayotgan timing'ni ishlatamiz
                })
                showToast.success('Xarajat muvaffaqiyatli qo\'shildi')
            } else {
                // Reys boshlanmaganda haydovchiga xarajat qo'shish - timing 'before' bo'ladi
                await api.post(`/drivers/${selectedDriver._id}/add-expense`, {
                    ...data,
                    timing: data.timing || 'before'  // Reys boshlanmaganda 'before' bo'ladi
                })
                showToast.success('Xarajat muvaffaqiyatli qo\'shildi')
            }

            setShowExpenseModal(false)
            setSelectedDriver(null)
            setSelectedLegForExpense(null)
            setEditingExpense(null)
            // Faqat agar kerak bo'lsa fetch qilish
            // fetchData(false)
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Xarajat qo\'shishda xatolik')
        } finally {
            setExpenseLoading(false)
        }
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
                onVoiceFlight={() => setShowVoiceFlight(true)}
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
                        onAddExpense={(d) => { setSelectedDriver(d); setShowExpenseModal(true) }}
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
                onPasswordUpdate={handlePasswordUpdate}
            />

            <FlightModal
                show={showFlightModal}
                onClose={() => setShowFlightModal(false)}
                onSubmit={handleStartFlight}
                form={flightForm}
                setForm={setFlightForm}
                selectedDriver={selectedDriver}
                selectedVehicle={selectedDriver ? getDriverVehicle(selectedDriver._id) : null}
            />

            {/* Xarajat qo'shish Modal - faqat ExpenseModal */}
            {showExpenseModal && selectedDriver && (
                <ExpenseModal
                    flight={selectedDriver ? activeFlights[selectedDriver._id] : null}
                    selectedLeg={selectedLegForExpense}
                    editingExpense={editingExpense}
                    onClose={() => { setShowExpenseModal(false); setSelectedDriver(null); setSelectedLegForExpense(null); setEditingExpense(null) }}
                    onSubmit={handleExpenseSubmit}
                    hideInternationalFeatures={true}
                />
            )}

            {/* Voice Flight Creator */}
            {showVoiceFlight && (
                <VoiceFlightCreator
                    drivers={drivers.filter(d => d.status === 'free')}
                    vehicles={vehicles}
                    onResult={handleVoiceFlightCreate}
                    onClose={() => setShowVoiceFlight(false)}
                />
            )}

            {/* LocationPicker olib tashlandi - faqat AddressAutocomplete ishlatiladi */}
        </div>
    )
}
