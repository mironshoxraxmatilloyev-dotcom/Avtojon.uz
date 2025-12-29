import { create } from 'zustand'
import api from '../services/api'

/**
 * 🚀 Global Data Store - Optimistic Updates bilan
 * 
 * Bu store barcha sahifalarda ma'lumotlarni sinxronlashtirib turadi.
 * Modal yopilganda UI darhol yangilanadi, API fonda ishlaydi.
 */
export const useDataStore = create((set, get) => ({
  // Data
  drivers: [],
  vehicles: [],
  flights: [],
  activeFlights: {}, // driverId -> flight
  
  // Loading states
  loading: {
    drivers: false,
    vehicles: false,
    flights: false,
    initial: true
  },
  
  // Error state
  error: null,
  
  // Last fetch time - cache uchun
  lastFetch: {
    drivers: 0,
    vehicles: 0,
    flights: 0
  },

  // ============================================
  // FETCH METHODS
  // ============================================
  
  fetchAll: async (force = false) => {
    const state = get()
    const now = Date.now()
    const CACHE_TTL = 30000 // 30 sekund
    
    // Cache tekshirish
    if (!force && 
        state.drivers.length > 0 && 
        (now - state.lastFetch.drivers) < CACHE_TTL) {
      set({ loading: { ...state.loading, initial: false } })
      return
    }
    
    set({ loading: { ...state.loading, initial: true }, error: null })
    
    try {
      const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/vehicles'),
        api.get('/flights', { params: { status: 'active' } })
      ])
      
      const drivers = driversRes.data.data || []
      const vehicles = vehiclesRes.data.data || []
      const flights = flightsRes.data.data || []
      
      // Active flights map
      const activeFlights = {}
      flights.forEach(f => {
        const driverId = f.driver?._id || f.driver
        if (driverId) activeFlights[driverId] = f
      })
      
      set({
        drivers,
        vehicles,
        flights,
        activeFlights,
        loading: { drivers: false, vehicles: false, flights: false, initial: false },
        lastFetch: { drivers: now, vehicles: now, flights: now },
        error: null
      })
    } catch (err) {
      set({
        error: {
          type: err.isNetworkError ? 'network' : err.isServerError ? 'server' : 'generic',
          message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
        },
        loading: { drivers: false, vehicles: false, flights: false, initial: false }
      })
    }
  },

  fetchDrivers: async (force = false) => {
    const state = get()
    const now = Date.now()
    
    if (!force && state.drivers.length > 0 && (now - state.lastFetch.drivers) < 30000) {
      return state.drivers
    }
    
    set({ loading: { ...state.loading, drivers: true } })
    
    try {
      const res = await api.get('/drivers')
      const drivers = res.data.data || []
      set({
        drivers,
        loading: { ...get().loading, drivers: false },
        lastFetch: { ...get().lastFetch, drivers: now }
      })
      return drivers
    } catch (err) {
      set({ loading: { ...get().loading, drivers: false } })
      throw err
    }
  },

  fetchVehicles: async (force = false) => {
    const state = get()
    const now = Date.now()
    
    if (!force && state.vehicles.length > 0 && (now - state.lastFetch.vehicles) < 30000) {
      return state.vehicles
    }
    
    set({ loading: { ...state.loading, vehicles: true } })
    
    try {
      const res = await api.get('/vehicles')
      const vehicles = res.data.data || []
      set({
        vehicles,
        loading: { ...get().loading, vehicles: false },
        lastFetch: { ...get().lastFetch, vehicles: now }
      })
      return vehicles
    } catch (err) {
      set({ loading: { ...get().loading, vehicles: false } })
      throw err
    }
  },

  fetchFlights: async (params = {}, force = false) => {
    const state = get()
    const now = Date.now()
    
    if (!force && state.flights.length > 0 && (now - state.lastFetch.flights) < 30000) {
      return state.flights
    }
    
    set({ loading: { ...state.loading, flights: true } })
    
    try {
      const res = await api.get('/flights', { params })
      const flights = res.data.data || []
      
      // Active flights map yangilash
      if (params.status === 'active' || !params.status) {
        const activeFlights = {}
        flights.filter(f => f.status === 'active').forEach(f => {
          const driverId = f.driver?._id || f.driver
          if (driverId) activeFlights[driverId] = f
        })
        set({ activeFlights })
      }
      
      set({
        flights,
        loading: { ...get().loading, flights: false },
        lastFetch: { ...get().lastFetch, flights: now }
      })
      return flights
    } catch (err) {
      set({ loading: { ...get().loading, flights: false } })
      throw err
    }
  },

  // ============================================
  // OPTIMISTIC UPDATE METHODS
  // ============================================

  // 🚀 Shofyor qo'shish - OPTIMISTIC
  addDriver: async (driverData, vehicleData) => {
    const tempId = 'temp_' + Date.now()
    const optimisticDriver = {
      _id: tempId,
      ...driverData,
      status: 'free',
      createdAt: new Date().toISOString()
    }
    
    // 1. UI ni darhol yangilash
    set(state => ({
      drivers: [optimisticDriver, ...state.drivers]
    }))
    
    try {
      // 2. API ga yuborish
      const driverRes = await api.post('/drivers', driverData)
      const newDriver = driverRes.data.data
      
      // 3. Mashina qo'shish (agar bor bo'lsa)
      let newVehicle = null
      if (vehicleData?.plateNumber) {
        const vehicleRes = await api.post('/vehicles', {
          ...vehicleData,
          currentDriver: newDriver._id
        })
        newVehicle = vehicleRes.data.data
      }
      
      // 4. Haqiqiy data bilan yangilash
      set(state => ({
        drivers: state.drivers.map(d => 
          d._id === tempId ? newDriver : d
        ),
        vehicles: newVehicle ? [...state.vehicles, newVehicle] : state.vehicles
      }))
      
      return { success: true, driver: newDriver, vehicle: newVehicle }
    } catch (err) {
      // 5. Xatolik - optimistic update ni qaytarish
      set(state => ({
        drivers: state.drivers.filter(d => d._id !== tempId)
      }))
      throw err
    }
  },

  // 🚀 Shofyor yangilash - OPTIMISTIC
  updateDriver: async (id, data) => {
    const state = get()
    const oldDriver = state.drivers.find(d => d._id === id)
    
    // 1. UI ni darhol yangilash
    set(state => ({
      drivers: state.drivers.map(d => 
        d._id === id ? { ...d, ...data } : d
      )
    }))
    
    try {
      // 2. API ga yuborish
      const res = await api.put(`/drivers/${id}`, data)
      const updatedDriver = res.data.data
      
      // 3. Haqiqiy data bilan yangilash
      set(state => ({
        drivers: state.drivers.map(d => 
          d._id === id ? updatedDriver : d
        )
      }))
      
      return { success: true, driver: updatedDriver }
    } catch (err) {
      // 4. Xatolik - eski holatga qaytarish
      if (oldDriver) {
        set(state => ({
          drivers: state.drivers.map(d => 
            d._id === id ? oldDriver : d
          )
        }))
      }
      throw err
    }
  },

  // 🚀 Shofyor o'chirish - OPTIMISTIC
  deleteDriver: async (id) => {
    const state = get()
    const oldDriver = state.drivers.find(d => d._id === id)
    const oldVehicle = state.vehicles.find(v => 
      v.currentDriver === id || v.currentDriver?._id === id
    )
    
    // 1. UI dan darhol o'chirish
    set(state => ({
      drivers: state.drivers.filter(d => d._id !== id)
    }))
    
    try {
      // 2. API ga yuborish
      await api.delete(`/drivers/${id}`)
      return { success: true }
    } catch (err) {
      // 3. Xatolik - qaytarish
      if (oldDriver) {
        set(state => ({
          drivers: [...state.drivers, oldDriver]
        }))
      }
      throw err
    }
  },

  // 🚀 Marshrut ochish - OPTIMISTIC
  startFlight: async (flightData) => {
    const { driverId } = flightData
    const tempId = 'temp_' + Date.now()
    
    const optimisticFlight = {
      _id: tempId,
      ...flightData,
      status: 'active',
      createdAt: new Date().toISOString(),
      legs: [{
        fromCity: flightData.firstLeg?.fromCity,
        toCity: flightData.firstLeg?.toCity,
        status: 'active'
      }]
    }
    
    // 1. UI ni darhol yangilash
    set(state => ({
      flights: [optimisticFlight, ...state.flights],
      activeFlights: { ...state.activeFlights, [driverId]: optimisticFlight },
      drivers: state.drivers.map(d => 
        d._id === driverId ? { ...d, status: 'busy' } : d
      )
    }))
    
    try {
      // 2. API ga yuborish
      const res = await api.post('/flights', flightData)
      const newFlight = res.data.data
      
      // 3. Haqiqiy data bilan yangilash
      set(state => ({
        flights: state.flights.map(f => 
          f._id === tempId ? newFlight : f
        ),
        activeFlights: { ...state.activeFlights, [driverId]: newFlight }
      }))
      
      return { success: true, flight: newFlight }
    } catch (err) {
      // 4. Xatolik - qaytarish
      set(state => ({
        flights: state.flights.filter(f => f._id !== tempId),
        activeFlights: (() => {
          const newMap = { ...state.activeFlights }
          delete newMap[driverId]
          return newMap
        })(),
        drivers: state.drivers.map(d => 
          d._id === driverId ? { ...d, status: 'free' } : d
        )
      }))
      throw err
    }
  },

  // 🚀 Mashrut tugatish - OPTIMISTIC
  completeFlight: async (flightId) => {
    const state = get()
    const flight = state.flights.find(f => f._id === flightId)
    const driverId = flight?.driver?._id || flight?.driver
    
    // 1. UI ni darhol yangilash
    set(state => ({
      flights: state.flights.map(f => 
        f._id === flightId ? { ...f, status: 'completed' } : f
      ),
      activeFlights: (() => {
        const newMap = { ...state.activeFlights }
        if (driverId) delete newMap[driverId]
        return newMap
      })(),
      drivers: state.drivers.map(d => 
        d._id === driverId ? { ...d, status: 'free' } : d
      )
    }))
    
    try {
      // 2. API ga yuborish
      const res = await api.put(`/flights/${flightId}/complete`)
      return { success: true, flight: res.data.data }
    } catch (err) {
      // 3. Xatolik - qaytarish
      if (flight) {
        set(state => ({
          flights: state.flights.map(f => 
            f._id === flightId ? flight : f
          ),
          activeFlights: driverId ? { ...state.activeFlights, [driverId]: flight } : state.activeFlights,
          drivers: state.drivers.map(d => 
            d._id === driverId ? { ...d, status: 'busy' } : d
          )
        }))
      }
      throw err
    }
  },

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  getDriverVehicle: (driverId) => {
    const state = get()
    return state.vehicles.find(v => 
      v.currentDriver === driverId || v.currentDriver?._id === driverId
    )
  },
  
  getDriverActiveFlight: (driverId) => {
    return get().activeFlights[driverId] || null
  },
  
  clearError: () => set({ error: null }),
  
  // Cache ni tozalash
  invalidateCache: () => set({
    lastFetch: { drivers: 0, vehicles: 0, flights: 0 }
  })
}))

export default useDataStore
