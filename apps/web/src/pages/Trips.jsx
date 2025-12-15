import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Route } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../contexts/SocketContext'
import LocationPicker from '../components/LocationPicker'
import { useAlert, TripsSkeleton, NetworkError, ServerError } from '../components/ui'
import { 
  TripCard, 
  TripModal, 
  TripCompleteModal, 
  TripsHeader,
  DEMO_TRIPS, 
  DEMO_DRIVERS, 
  DEMO_VEHICLES,
  FILTER_BUTTONS,
  INITIAL_FORM_STATE
} from '../components/trips'

export default function Trips() {
  const { user, isDemo } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [routeMode, setRouteMode] = useState('manual')
  const [completingTrip, setCompletingTrip] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const isDemoMode = isDemo()

  // Masofa hisoblash funksiyasi
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c)
  }

  const calculateTime = (distanceKm) => {
    const hours = distanceKm / 60
    if (hours < 1) return `${Math.round(hours * 60)} daqiqa`
    if (hours < 24) return `${Math.round(hours)} soat`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return remainingHours > 0 ? `${days} kun ${remainingHours} soat` : `${days} kun`
  }

  const updateDistanceFromCoords = (startCoords, endCoords) => {
    if (startCoords && endCoords) {
      const dist = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng)
      setForm(prev => ({
        ...prev,
        estimatedDistance: dist,
        estimatedDuration: calculateTime(dist)
      }))
    }
  }

  // Waypoint funksiyalari
  const addWaypoint = (country, city, type = 'transit') => {
    const newWaypoint = {
      id: Date.now(),
      country,
      city,
      type,
      order: form.waypoints.length
    }
    const newWaypoints = [...form.waypoints, newWaypoint]
    const countries = [...new Set(newWaypoints.map(w => w.country))]
    setForm(prev => ({
      ...prev,
      waypoints: newWaypoints,
      countriesInRoute: countries
    }))
  }

  const removeWaypoint = (id) => {
    const newWaypoints = form.waypoints.filter(w => w.id !== id)
    const countries = [...new Set(newWaypoints.map(w => w.country))]
    setForm(prev => ({
      ...prev,
      waypoints: newWaypoints,
      countriesInRoute: countries
    }))
  }

  // Data fetching
  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      let filteredTrips = DEMO_TRIPS
      if (filter !== 'all') {
        filteredTrips = DEMO_TRIPS.filter(t => t.status === filter)
      }
      setTrips(filteredTrips)
      setDrivers(DEMO_DRIVERS)
      setVehicles(DEMO_VEHICLES)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/trips', { params: filter !== 'all' ? { status: filter } : {} }),
        api.get('/drivers'),
        api.get('/vehicles')
      ])
      setTrips(tripsRes.data.data || [])
      setDrivers(driversRes.data.data || [])
      setVehicles(vehiclesRes.data.data || [])
    } catch (err) {
      setError({
        type: err.isNetworkError ? 'network' : err.isServerError ? 'server' : 'generic',
        message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
      })
    } finally {
      setLoading(false)
    }
  }, [filter, isDemoMode])

  useEffect(() => { fetchData() }, [fetchData])

  // Socket.io
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleTripStarted = (data) => {
      showToast.success('🚛 Reys boshlandi!', data.message)
      fetchData()
    }

    const handleTripCompleted = (data) => {
      showToast.success('✅ Reys tugatildi!', data.message)
      fetchData()
    }

    socket.on('trip-started', handleTripStarted)
    socket.on('trip-completed', handleTripCompleted)

    return () => {
      socket.off('trip-started', handleTripStarted)
      socket.off('trip-completed', handleTripCompleted)
    }
  }, [socket, fetchData])

  // Modal scroll lock
  useEffect(() => {
    if (showModal || showCompleteModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showModal, showCompleteModal])

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (submitting) return

    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      setShowModal(false)
      return
    }

    // Validatsiya
    if (!form.driverId) { showToast.error('Shofyorni tanlang!'); return }
    if (!form.vehicleId) { showToast.error('Mashinani tanlang!'); return }
    if (!form.startAddress?.trim()) { showToast.error('Qayerdan manzilini kiriting!'); return }
    if (!form.endAddress?.trim()) { showToast.error('Qayerga manzilini kiriting!'); return }
    if (!form.estimatedDistance) { showToast.error('Masofani kiriting!'); return }
    if (!form.estimatedDuration?.trim()) { showToast.error('Taxminiy vaqtni kiriting!'); return }
    if (!form.tripBudget) { showToast.error('Berilgan pulni kiriting!'); return }
    if (!form.tripPayment) { showToast.error('Reys haqini kiriting!'); return }

    setSubmitting(true)
    try {
      let startAddr = form.startAddress
      let endAddr = form.endAddress
      
      if (form.tripType === 'international' && form.waypoints.length >= 2) {
        const startWp = form.waypoints.find(w => w.type === 'start') || form.waypoints[0]
        const endWp = form.waypoints.filter(w => w.type === 'end').pop() || form.waypoints[form.waypoints.length - 1]
        startAddr = startAddr || `${startWp.city}, ${startWp.country}`
        endAddr = endAddr || `${endWp.city}, ${endWp.country}`
      }

      await api.post('/trips', {
        ...form,
        startAddress: startAddr,
        endAddress: endAddr,
        estimatedDuration: form.estimatedDuration,
        estimatedDistance: Number(form.estimatedDistance),
        tripBudget: Number(form.tripBudget),
        tripPayment: Number(form.tripPayment),
        tripType: form.tripType,
        waypoints: form.waypoints,
        countriesInRoute: form.countriesInRoute
      })
      showToast.success('Reys yaratildi')
      setShowModal(false)
      setForm(INITIAL_FORM_STATE)
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStart = async (e, id) => {
    e.stopPropagation()
    
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      return
    }

    if (actionLoading) return
    setActionLoading(id)
    try {
      await api.put(`/trips/${id}/start`)
      showToast.success('Reys boshlandi')
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const openCompleteModal = (e, trip) => {
    e.stopPropagation()
    setCompletingTrip(trip)
    setShowCompleteModal(true)
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      setShowCompleteModal(false)
      return
    }

    if (submitting) return
    setSubmitting(true)
    try {
      await api.put(`/trips/${completingTrip._id}/complete`)
      showToast.success('Reys tugatildi')
      setShowCompleteModal(false)
      setCompletingTrip(null)
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (e, id) => {
    e.stopPropagation()
    
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      return
    }

    if (!confirm('Reysni bekor qilishni xohlaysizmi?')) return
    try {
      await api.put(`/trips/${id}/cancel`)
      showToast.success('Reys bekor qilindi')
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Loading & Error states
  if (loading) return <TripsSkeleton />

  if (error) {
    if (error.type === 'network') return <NetworkError onRetry={fetchData} message={error.message} />
    if (error.type === 'server') return <ServerError onRetry={fetchData} message={error.message} />
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <TripsHeader 
        user={user} 
        trips={trips} 
        onNewTrip={() => setShowModal(true)} 
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_BUTTONS.map(({ value, label }) => (
          <button 
            key={value} 
            onClick={() => setFilter(value)}
            className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <TripCard
            key={trip._id}
            trip={trip}
            onNavigate={(id) => navigate(`/dashboard/trips/${id}`)}
            onStart={handleStart}
            onComplete={openCompleteModal}
            onCancel={handleCancel}
            actionLoading={actionLoading}
          />
        ))}
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reyslar topilmadi</h3>
          <p className="text-gray-500 mb-6">Hozircha bu filtrdagi reyslar yoq</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Birinchi reysni yarating
          </button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <TripModal
          form={form}
          setForm={setForm}
          drivers={drivers}
          vehicles={vehicles}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); setSubmitting(false) }}
          onOpenLocationPicker={() => { setShowModal(false); setShowLocationPicker(true) }}
          routeMode={routeMode}
          updateDistanceFromCoords={updateDistanceFromCoords}
          addWaypoint={addWaypoint}
          removeWaypoint={removeWaypoint}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          onClose={() => { setShowLocationPicker(false); setShowModal(true) }}
          onSelect={(data) => {
            setForm(prev => ({
              ...prev,
              startAddress: data.startAddress,
              endAddress: data.endAddress,
              estimatedDistance: data.distance,
              estimatedDuration: data.duration,
              startCoords: data.startPoint,
              endCoords: data.endPoint
            }))
            setRouteMode('map')
            setShowLocationPicker(false)
            setShowModal(true)
          }}
          initialStart={form.startCoords}
          initialEnd={form.endCoords}
        />
      )}

      {showCompleteModal && completingTrip && (
        <TripCompleteModal
          trip={completingTrip}
          submitting={submitting}
          onSubmit={handleComplete}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  )
}
