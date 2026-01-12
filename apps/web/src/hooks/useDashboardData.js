import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../contexts/SocketContext'

// 🎯 Demo data
const DEMO_DATA = {
  stats: {
    drivers: 8, vehicles: 12, activeTrips: 3, completedTrips: 156,
    totalExpenses: 45000000, pendingTrips: 5, totalBonus: 8500000, totalPenalty: 1200000,
    busyDrivers: 3, freeDrivers: 5
  },
  activeTrips: [
    { _id: 'demo1', driver: { fullName: 'Akmal Karimov' }, vehicle: { plateNumber: '01 A 123 AB' }, startAddress: 'Toshkent', endAddress: 'Samarqand', status: 'in_progress' },
    { _id: 'demo2', driver: { fullName: 'Bobur Aliyev' }, vehicle: { plateNumber: '01 B 456 CD' }, startAddress: 'Buxoro', endAddress: 'Navoiy', status: 'in_progress' },
  ],
  driverLocations: [
    { _id: 'd1', fullName: 'Akmal Karimov', phone: '+998901234567', status: 'busy', lastLocation: { lat: 39.65, lng: 66.96 } },
    { _id: 'd2', fullName: 'Bobur Aliyev', phone: '+998901234568', status: 'busy', lastLocation: { lat: 40.12, lng: 65.37 } },
    { _id: 'd3', fullName: 'Jasur Toshmatov', phone: '+998901234570', status: 'free', lastLocation: { lat: 41.31, lng: 69.28 } }
  ]
}

// 🚀 Dashboard Data Hook
export function useDashboardData() {
  const { isDemo } = useAuthStore()
  const { socket } = useSocket()
  const isDemoMode = isDemo()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    drivers: 0, vehicles: 0, activeTrips: 0, completedTrips: 0,
    totalExpenses: 0, pendingTrips: 0, totalBonus: 0, totalPenalty: 0,
    busyDrivers: 0, freeDrivers: 0
  })
  const [activeTrips, setActiveTrips] = useState([])
  const [activeFlights, setActiveFlights] = useState([])
  const [driverLocations, setDriverLocations] = useState([])
  const [tripRoutes, setTripRoutes] = useState({})

  // 🎯 Fetch driver locations
  const fetchDriverLocations = useCallback(async () => {
    if (isDemoMode) return
    try {
      const { data } = await api.get('/drivers/locations')
      setDriverLocations(data.data || [])
    } catch (error) {
      console.error('Driver locations error:', error)
    }
  }, [isDemoMode])

  // 🎯 Fetch all stats
  const fetchStats = useCallback(async () => {
    if (isDemoMode) {
      setStats(DEMO_DATA.stats)
      setActiveTrips(DEMO_DATA.activeTrips)
      setDriverLocations(DEMO_DATA.driverLocations)
      setLoading(false)
      return
    }

    try {
      const [driversRes, vehiclesRes, tripsRes, flightsRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/vehicles'),
        api.get('/trips'),
        api.get('/flights', { params: { status: 'active' } }).catch(() => ({ data: { data: [] } }))
      ])
      
      const trips = tripsRes.data.data || []
      const drivers = driversRes.data.data || []
      const flights = flightsRes.data.data || []
      
      setStats({
        drivers: drivers.length,
        vehicles: vehiclesRes.data.data?.length || 0,
        activeTrips: flights.length,
        completedTrips: trips.filter(t => t.status === 'completed').length,
        pendingTrips: 0,
        totalExpenses: 0,
        totalBonus: 0,
        totalPenalty: 0,
        busyDrivers: drivers.filter(d => d.status === 'busy').length,
        freeDrivers: drivers.filter(d => d.status === 'free').length
      })
      
      setActiveTrips(trips.filter(t => t.status === 'in_progress'))
      setActiveFlights(flights)
    } catch (error) {
      console.error('Stats error:', error)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  // 🔌 Socket listeners
  useEffect(() => {
    if (!socket) return

    socket.on('driver-location', (data) => {
      setDriverLocations(prev => prev.map(driver => 
        driver._id === data.driverId 
          ? { ...driver, lastLocation: data.location }
          : driver
      ))
    })

    socket.on('trip-started', (data) => {
      setStats(prev => ({
        ...prev,
        activeTrips: prev.activeTrips + 1,
        busyDrivers: prev.busyDrivers + 1,
        freeDrivers: Math.max(0, prev.freeDrivers - 1)
      }))
      if (data.trip) {
        setActiveTrips(prev => [data.trip, ...prev])
      }
    })

    socket.on('trip-completed', (data) => {
      setStats(prev => ({
        ...prev,
        activeTrips: Math.max(0, prev.activeTrips - 1),
        completedTrips: prev.completedTrips + 1,
        busyDrivers: Math.max(0, prev.busyDrivers - 1),
        freeDrivers: prev.freeDrivers + 1
      }))
      if (data.trip) {
        setActiveTrips(prev => prev.filter(t => t._id !== data.trip._id))
      }
    })

    return () => {
      socket.off('driver-location')
      socket.off('trip-started')
      socket.off('trip-completed')
    }
  }, [socket])

  // 🎯 Initial fetch
  useEffect(() => {
    fetchStats()
    if (!isDemoMode) {
      fetchDriverLocations()
      const interval = setInterval(fetchDriverLocations, 15000)
      return () => clearInterval(interval)
    }
  }, [fetchStats, fetchDriverLocations, isDemoMode])

  return {
    loading,
    stats,
    activeTrips,
    activeFlights,
    driverLocations,
    tripRoutes,
    isDemoMode,
    refreshLocations: fetchDriverLocations
  }
}

export default useDashboardData
