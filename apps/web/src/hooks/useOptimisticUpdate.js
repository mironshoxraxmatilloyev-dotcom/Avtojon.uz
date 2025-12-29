import { useCallback } from 'react'
import api from '../services/api'
import { showToast } from '../components/Toast'

/**
 * 🚀 Optimistic Update Hook
 * 
 * UI ni darhol yangilaydi, API fonda ishlaydi.
 * Xatolik bo'lsa, eski holatga qaytaradi.
 */
export function useOptimisticUpdate() {
  
  // 🚀 Shofyor qo'shish
  const addDriverOptimistic = useCallback(async ({
    driverData,
    vehicleData,
    setDrivers,
    setVehicles,
    onSuccess,
    onError
  }) => {
    const tempId = 'temp_' + Date.now()
    const tempVehicleId = 'temp_v_' + Date.now()
    
    // Optimistic driver
    const optimisticDriver = {
      _id: tempId,
      ...driverData,
      status: 'free',
      createdAt: new Date().toISOString()
    }
    
    // Optimistic vehicle
    const optimisticVehicle = vehicleData?.plateNumber ? {
      _id: tempVehicleId,
      plateNumber: vehicleData.plateNumber.trim().toUpperCase(),
      brand: vehicleData.brand || '',
      year: vehicleData.year || undefined,
      currentDriver: tempId
    } : null
    
    // 1. UI ni darhol yangilash
    setDrivers(prev => [optimisticDriver, ...prev])
    if (optimisticVehicle) {
      setVehicles(prev => [optimisticVehicle, ...prev])
    }
    
    try {
      // 2. API ga yuborish
      const driverRes = await api.post('/drivers', driverData)
      const newDriver = driverRes.data.data
      
      // 3. Mashina qo'shish
      let newVehicle = null
      if (vehicleData?.plateNumber) {
        const vehicleRes = await api.post('/vehicles', {
          ...vehicleData,
          plateNumber: vehicleData.plateNumber.trim().toUpperCase(),
          currentDriver: newDriver._id
        })
        newVehicle = vehicleRes.data.data
      }
      
      // 4. Haqiqiy data bilan yangilash
      setDrivers(prev => prev.map(d => 
        d._id === tempId ? newDriver : d
      ))
      if (newVehicle) {
        setVehicles(prev => prev.map(v => 
          v._id === tempVehicleId ? newVehicle : v
        ))
      }
      
      onSuccess?.({ driver: newDriver, vehicle: newVehicle })
      return { success: true, driver: newDriver, vehicle: newVehicle }
    } catch (err) {
      // 5. Xatolik - qaytarish
      setDrivers(prev => prev.filter(d => d._id !== tempId))
      if (optimisticVehicle) {
        setVehicles(prev => prev.filter(v => v._id !== tempVehicleId))
      }
      
      const errorMsg = err.response?.data?.message || 'Qo\'shishda xatolik'
      showToast.error(errorMsg)
      onError?.(err)
      return { success: false, error: errorMsg }
    }
  }, [])

  // 🚀 Shofyor yangilash
  const updateDriverOptimistic = useCallback(async ({
    id,
    data,
    setDrivers,
    oldDriver,
    onSuccess,
    onError
  }) => {
    // 1. UI ni darhol yangilash
    setDrivers(prev => prev.map(d => 
      d._id === id ? { ...d, ...data } : d
    ))
    
    try {
      // 2. API ga yuborish
      const res = await api.put(`/drivers/${id}`, data)
      const updatedDriver = res.data.data
      
      // 3. Haqiqiy data bilan yangilash
      setDrivers(prev => prev.map(d => 
        d._id === id ? updatedDriver : d
      ))
      
      onSuccess?.(updatedDriver)
      return { success: true, driver: updatedDriver }
    } catch (err) {
      // 4. Xatolik - eski holatga qaytarish
      if (oldDriver) {
        setDrivers(prev => prev.map(d => 
          d._id === id ? oldDriver : d
        ))
      }
      
      const errorMsg = err.response?.data?.message || 'Yangilashda xatolik'
      showToast.error(errorMsg)
      onError?.(err)
      return { success: false, error: errorMsg }
    }
  }, [])

  // 🚀 Shofyor o'chirish
  const deleteDriverOptimistic = useCallback(async ({
    id,
    setDrivers,
    oldDriver,
    onSuccess,
    onError
  }) => {
    // 1. UI dan darhol o'chirish
    setDrivers(prev => prev.filter(d => d._id !== id))
    
    try {
      // 2. API ga yuborish
      await api.delete(`/drivers/${id}`)
      onSuccess?.()
      return { success: true }
    } catch (err) {
      // 3. Xatolik - qaytarish
      if (oldDriver) {
        setDrivers(prev => [...prev, oldDriver])
      }
      
      const errorMsg = err.response?.data?.message || 'O\'chirishda xatolik'
      showToast.error(errorMsg)
      onError?.(err)
      return { success: false, error: errorMsg }
    }
  }, [])

  // 🚀 Marshrut ochish
  const startFlightOptimistic = useCallback(async ({
    flightData,
    setDrivers,
    setActiveFlights,
    onSuccess,
    onError
  }) => {
    const { driverId } = flightData
    const tempId = 'temp_flight_' + Date.now()
    
    const optimisticFlight = {
      _id: tempId,
      ...flightData,
      status: 'active',
      createdAt: new Date().toISOString(),
      name: `${flightData.firstLeg?.fromCity} → ${flightData.firstLeg?.toCity}`,
      legs: [{
        fromCity: flightData.firstLeg?.fromCity,
        toCity: flightData.firstLeg?.toCity,
        status: 'active'
      }]
    }
    
    // 1. UI ni darhol yangilash
    setDrivers(prev => prev.map(d => 
      d._id === driverId ? { ...d, status: 'busy' } : d
    ))
    setActiveFlights(prev => ({ ...prev, [driverId]: optimisticFlight }))
    
    try {
      // 2. API ga yuborish
      const res = await api.post('/flights', flightData)
      const newFlight = res.data.data
      
      // 3. Haqiqiy data bilan yangilash
      setActiveFlights(prev => ({ ...prev, [driverId]: newFlight }))
      
      onSuccess?.(newFlight)
      return { success: true, flight: newFlight }
    } catch (err) {
      // 4. Xatolik - qaytarish
      setDrivers(prev => prev.map(d => 
        d._id === driverId ? { ...d, status: 'free' } : d
      ))
      setActiveFlights(prev => {
        const newMap = { ...prev }
        delete newMap[driverId]
        return newMap
      })
      
      const errorMsg = err.response?.data?.message || 'Marshrut ochishda xatolik'
      showToast.error(errorMsg)
      onError?.(err)
      return { success: false, error: errorMsg }
    }
  }, [])

  return {
    addDriverOptimistic,
    updateDriverOptimistic,
    deleteDriverOptimistic,
    startFlightOptimistic
  }
}

export default useOptimisticUpdate
