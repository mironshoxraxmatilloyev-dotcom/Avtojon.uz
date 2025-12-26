import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { History, Truck, Clock, Play, Bell, X, WifiOff, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { showToast } from '../../components/Toast'
import { connectSocket, joinDriverRoom } from '../../services/socket'
import { DriverHomeSkeleton } from '../../components/ui'
import {
  DriverHeader, DriverTabs, ActiveFlightCard, ActiveTripCard,
  PendingTrips, StatsCards, EmptyState, FlightHistory, TripHistory,
  FlightDetailModal, NewTripNotification, ErrorState
} from '../../components/driverPanel'

export default function DriverHome() {
  const { user, logout } = useAuthStore()
  const [activeTrip, setActiveTrip] = useState(null)
  const [pendingTrips, setPendingTrips] = useState([])
  const [trips, setTrips] = useState([])
  const [activeFlight, setActiveFlight] = useState(null)
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('home')
  const [driverId, setDriverId] = useState(null)
  const [newTripNotification, setNewTripNotification] = useState(null)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async (options = {}) => {
    const { silent = false } = options
    if (!silent) setError(null)
    try {
      const [tripsRes, profileRes, flightsRes] = await Promise.all([
        api.get('/driver/me/trips'),
        api.get('/driver/me'),
        api.get('/driver/me/flights').catch(() => ({ data: { data: [] } }))
      ])
      const allTrips = tripsRes.data.data || []
      const allFlights = flightsRes.data.data || []
      setTrips(allTrips)
      setActiveTrip(allTrips.find(t => t.status === 'in_progress') || null)
      setPendingTrips(allTrips.filter(t => t.status === 'pending'))
      setFlights(allFlights)
      setActiveFlight(allFlights.find(f => f.status === 'active') || null)
      if (profileRes.data.data?._id) setDriverId(profileRes.data.data._id)
    } catch (err) {
      if (!silent) setError({ type: err.isNetworkError ? 'network' : 'generic', message: err.userMessage || "Ma'lumotlarni yuklashda xatolik" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    if (!navigator.geolocation) return
    const sendLoc = (p) => api.post('/driver/me/location', { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, speed: p.coords.speed }).catch(() => {})
    const watchId = navigator.geolocation.watchPosition(sendLoc, () => {}, { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 })
    const interval = setInterval(() => navigator.geolocation.getCurrentPosition(sendLoc, () => {}, { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 }), 15000)
    return () => { navigator.geolocation.clearWatch(watchId); clearInterval(interval) }
  }, [fetchData])

  useEffect(() => {
    if (!driverId) return
    const socket = connectSocket()
    const join = () => joinDriverRoom(driverId)
    socket.connected ? join() : socket.on('connect', join)
    const onNew = (d) => { showToast.success('🚛 Yangi reys!'); setNewTripNotification(d.trip || d.flight); fetchData(); setTimeout(() => setNewTripNotification(null), 5000) }
    const onUpdate = (d) => { if (d.flight) { setActiveFlight(p => p?._id === d.flight._id ? d.flight : p); setFlights(p => p.map(f => f._id === d.flight._id ? d.flight : f)) } }
    const onComplete = (d) => { showToast.success('✅ Reys yopildi!'); setActiveFlight(null); d.flight ? setFlights(p => p.map(f => f._id === d.flight._id ? d.flight : f)) : fetchData({ silent: true }) }
    const onCancel = () => { showToast.error('❌ Bekor qilindi!'); setActiveTrip(null); setActiveFlight(null); fetchData({ silent: true }) }
    ;['new-trip', 'new-flight', 'flight-started'].forEach(e => socket.on(e, onNew))
    socket.on('flight-updated', onUpdate)
    socket.on('flight-completed', onComplete)
    ;['trip-cancelled', 'flight-cancelled', 'flight-deleted'].forEach(e => socket.on(e, onCancel))
    return () => { socket.off('connect', join); ['new-trip', 'new-flight', 'flight-started', 'flight-updated', 'flight-completed', 'trip-cancelled', 'flight-cancelled', 'flight-deleted'].forEach(e => socket.off(e)) }
  }, [driverId, fetchData])

  const handleLogout = () => { logout(); window.location.href = '/login' }
  const handleCompleteTrip = async () => { if (!activeTrip || actionLoading) return; const id = activeTrip._id; setActiveTrip(null); showToast.success('Tugatildi!'); api.put(`/driver/me/trips/${id}/complete`).catch(() => fetchData({ silent: true })) }
  const handleConfirmFlight = async () => { if (!activeFlight || actionLoading) return; setActionLoading(true); try { const r = await api.put(`/driver/me/flights/${activeFlight._id}/confirm`); if (r.data.data) setActiveFlight(r.data.data); showToast.success('Tasdiqlandi!') } catch (e) { showToast.error(e.response?.data?.message || 'Xatolik') } finally { setActionLoading(false) } }
  const handleStartTrip = async (id) => { if (actionLoading) return; const t = pendingTrips.find(x => x._id === id); if (!t) return; setPendingTrips(p => p.filter(x => x._id !== id)); setActiveTrip({ ...t, status: 'in_progress' }); showToast.success('Boshlandi!'); api.put(`/driver/me/trips/${id}/start`).catch(() => fetchData({ silent: true })) }

  const stats = useMemo(() => ({
    totalCompletedTrips: flights.filter(f => f.status === 'completed').length + trips.filter(t => t.status === 'completed').length,
    totalBonusAmount: flights.reduce((s, f) => s + (f.profit > 0 ? f.profit : 0), 0) + trips.reduce((s, t) => s + (t.bonusAmount || 0), 0)
  }), [flights, trips])

  if (loading) return <DriverHomeSkeleton />
  if (error) return <ErrorState error={error} onRetry={() => { setLoading(true); fetchData() }} />

  return (
    <div className="min-h-screen bg-slate-100">
      <NewTripNotification trip={newTripNotification} onClose={() => setNewTripNotification(null)} />
      <DriverHeader user={user} onLogout={handleLogout} />
      <DriverTabs activeTab={tab} onTabChange={setTab} />
      <main className="p-3 space-y-3 pb-6">
        {tab === 'home' && (
          <>
            {activeFlight ? <ActiveFlightCard flight={activeFlight} onConfirm={handleConfirmFlight} actionLoading={actionLoading} />
              : activeTrip ? <ActiveTripCard trip={activeTrip} onComplete={handleCompleteTrip} actionLoading={actionLoading} />
              : pendingTrips.length > 0 ? <PendingTrips trips={pendingTrips} onStart={handleStartTrip} actionLoading={actionLoading} />
              : <EmptyState />}
            <StatsCards stats={stats} />
          </>
        )}
        {tab === 'history' && (
          <div className="space-y-3">
            <FlightHistory flights={flights} onSelect={setSelectedFlight} />
            <TripHistory trips={trips} />
            {!flights.length && !trips.length && (
              <div className="bg-white rounded-xl p-6 text-center border border-slate-100">
                <History size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500 text-sm">Reyslar tarixi bo'sh</p>
              </div>
            )}
          </div>
        )}
      </main>
      <FlightDetailModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
    </div>
  )
}
