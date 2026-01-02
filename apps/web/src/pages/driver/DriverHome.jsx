import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../store/langStore'
import { History } from 'lucide-react'
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
  const { t } = useTranslation()
  const [activeTrip, setActiveTrip] = useState(null)
  const [pendingTrips, setPendingTrips] = useState([])
  const [trips, setTrips] = useState([])
  const [activeFlight, setActiveFlight] = useState(null)
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('home')
  const [driverId, setDriverId] = useState(null)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [newTripNotification, setNewTripNotification] = useState(null)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async (options = {}) => {
    const { silent = false } = options
    if (!silent) setError(null)
    try {
      // 🚀 TEZKOR: Bitta so'rov bilan barcha ma'lumotlarni olish
      const res = await api.get('/driver/me/dashboard')
      const { driver, activeFlight: active, allFlights, stats: serverStats } = res.data.data
      
      setFlights(allFlights || [])
      setActiveFlight(active || null)
      setTrips([]) // Eski trip tizimi endi ishlatilmaydi
      setActiveTrip(null)
      setPendingTrips([])
      if (driver?._id) setDriverId(driver._id)
      if (driver?.currentBalance !== undefined) setCurrentBalance(driver.currentBalance)
    } catch (err) {
      // Fallback - eski usul
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
      } catch (fallbackErr) {
        if (!silent) setError({ type: fallbackErr.isNetworkError ? 'network' : 'generic', message: fallbackErr.userMessage || "Ma'lumotlarni yuklashda xatolik" })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    if (!navigator.geolocation) return
    
    // Joylashuvni yuborish - faqat interval bilan (30 sekundda 1 marta)
    let lastSentTime = 0
    const MIN_INTERVAL = 30000 // 30 sekund
    
    const sendLocation = (position) => {
      const now = Date.now()
      // Oxirgi yuborishdan 30 sekund o'tmagan bo'lsa, yubormaymiz
      if (now - lastSentTime < MIN_INTERVAL) return
      lastSentTime = now
      
      api.post('/driver/me/location', { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude, 
        accuracy: position.coords.accuracy, 
        speed: position.coords.speed 
      }).catch(() => {})
    }
    
    // Dastlabki joylashuvni olish
    navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { 
      enableHighAccuracy: true, 
      timeout: 30000, 
      maximumAge: 10000 
    })
    
    // Har 30 sekundda yangilash
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 10000 
      })
    }, MIN_INTERVAL)
    
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (!driverId) return
    const socket = connectSocket()
    const join = () => joinDriverRoom(driverId)
    socket.connected ? join() : socket.on('connect', join)
    const onNew = (d) => { showToast.success('🚛 Yangi marshrut!'); setNewTripNotification(d.trip || d.flight); fetchData(); setTimeout(() => setNewTripNotification(null), 5000) }
    const onUpdate = (d) => { 
      if (d.flight) { 
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(d.flight))
        setActiveFlight(p => p?._id === newFlight._id ? newFlight : p)
        setFlights(p => p.map(f => f._id === newFlight._id ? newFlight : f)) 
      } 
    }
    const onComplete = (d) => { 
      showToast.success('Marshrut yopildi!')
      setActiveFlight(null)
      if (d.flight) {
        const newFlight = JSON.parse(JSON.stringify(d.flight))
        setFlights(p => p.map(f => f._id === newFlight._id ? newFlight : f))
      } else {
        fetchData({ silent: true })
      }
    }
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

  const recentFlights = useMemo(() => 
    flights.filter(f => f.status === 'completed').slice(0, 5)
  , [flights])

  // Xarajat tasdiqlanganda flight ni yangilash
  const handleFlightUpdate = useCallback((updatedFlight) => {
    // Deep copy qilish - React state yangilanishini ta'minlash
    const newFlight = JSON.parse(JSON.stringify(updatedFlight))
    // Modal ochiq bo'lsa yangilash, aks holda faqat state yangilash
    setSelectedFlight(prev => prev?._id === newFlight._id ? newFlight : prev)
    setFlights(prev => prev.map(f => f._id === newFlight._id ? newFlight : f))
    if (activeFlight?._id === newFlight._id) {
      setActiveFlight(newFlight)
    }
  }, [activeFlight])

  if (loading) return <DriverHomeSkeleton />
  if (error) return <ErrorState error={error} onRetry={() => { setLoading(true); fetchData() }} />

  return (
    <div className="min-h-screen bg-slate-100">
      <NewTripNotification trip={newTripNotification} onClose={() => setNewTripNotification(null)} />
      <DriverHeader user={user} onLogout={handleLogout} />
      <div className="max-w-2xl mx-auto">
        <DriverTabs activeTab={tab} onTabChange={(newTab) => { setTab(newTab); setSelectedFlight(null) }} />
        <main className="p-4 space-y-4 pb-8">
          {tab === 'home' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                {activeFlight ? <ActiveFlightCard flight={activeFlight} onConfirm={handleConfirmFlight} actionLoading={actionLoading} onFlightUpdate={handleFlightUpdate} />
                  : activeTrip ? <ActiveTripCard trip={activeTrip} onComplete={handleCompleteTrip} actionLoading={actionLoading} />
                  : pendingTrips.length > 0 ? <PendingTrips trips={pendingTrips} onStart={handleStartTrip} actionLoading={actionLoading} />
                  : <EmptyState stats={stats} recentFlights={recentFlights} onSelectFlight={setSelectedFlight} />}
              </div>
              {(activeFlight || activeTrip || pendingTrips.length > 0) && <StatsCards stats={stats} currentBalance={currentBalance} />}
            </div>
          )}
          {tab === 'history' && (
            <div className="space-y-4">
              <FlightHistory flights={flights} onSelect={setSelectedFlight} />
              <TripHistory trips={trips} />
              {!flights.length && !trips.length && (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
                  <History size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">{t('historyEmpty')}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <FlightDetailModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} onUpdate={handleFlightUpdate} />
    </div>
  )
}
