/**
 * Vehicle Maintenance API Tests
 * Yoqilg'i, moy, shina va xizmat operatsiyalari testi
 */

describe('Vehicle Maintenance Tests', () => {
  describe('Fuel Management', () => {
    const mockFuelRefill = {
      _id: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      date: new Date(),
      liters: 400,
      cost: 5200000,
      odometer: 155000,
      fuelType: 'diesel',
      station: 'Lukoil'
    }

    test('should calculate fuel consumption per 100km', () => {
      const refills = [
        { liters: 400, odometer: 150000 },
        { liters: 380, odometer: 151200 }
      ]

      // Consumption = (liters / distance) * 100
      const distance = refills[1].odometer - refills[0].odometer
      const consumption = (refills[1].liters / distance) * 100

      expect(distance).toBe(1200)
      expect(consumption.toFixed(1)).toBe('31.7') // L/100km
    })

    test('should calculate total fuel cost', () => {
      const refills = [
        { cost: 5200000 },
        { cost: 4800000 },
        { cost: 5000000 }
      ]

      const totalCost = refills.reduce((sum, r) => sum + r.cost, 0)

      expect(totalCost).toBe(15000000)
    })

    test('should calculate monthly consumption', () => {
      const now = new Date()
      const thisMonth = now.getMonth()
      
      const refills = [
        { date: new Date(now.getFullYear(), thisMonth, 5), liters: 400 },
        { date: new Date(now.getFullYear(), thisMonth, 15), liters: 380 },
        { date: new Date(now.getFullYear(), thisMonth - 1, 20), liters: 350 }
      ]

      const monthlyLiters = refills
        .filter(r => new Date(r.date).getMonth() === thisMonth)
        .reduce((sum, r) => sum + r.liters, 0)

      expect(monthlyLiters).toBe(780)
    })

    test('should validate fuel refill data', () => {
      const isValid = (refill) => {
        return refill.liters > 0 && 
               refill.cost > 0 && 
               refill.odometer >= 0 &&
               ['diesel', 'petrol', 'gas', 'metan'].includes(refill.fuelType)
      }

      expect(isValid(mockFuelRefill)).toBe(true)
      expect(isValid({ ...mockFuelRefill, liters: -10 })).toBe(false)
      expect(isValid({ ...mockFuelRefill, fuelType: 'electric' })).toBe(false)
    })
  })

  describe('Oil Management', () => {
    const mockOilChange = {
      _id: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      date: new Date(),
      odometer: 150000,
      oilType: '10W-40',
      oilBrand: 'Mobil',
      liters: 12,
      cost: 1500000,
      nextChangeOdometer: 160000
    }

    test('should calculate remaining km until oil change', () => {
      const currentOdometer = 157000
      const nextChangeOdometer = 160000

      const remainingKm = nextChangeOdometer - currentOdometer

      expect(remainingKm).toBe(3000)
    })

    test('should determine oil status', () => {
      const getOilStatus = (remainingKm) => {
        if (remainingKm <= 0) return 'overdue'
        if (remainingKm <= 1000) return 'approaching'
        return 'ok'
      }

      expect(getOilStatus(5000)).toBe('ok')
      expect(getOilStatus(800)).toBe('approaching')
      expect(getOilStatus(0)).toBe('overdue')
      expect(getOilStatus(-500)).toBe('overdue')
    })

    test('should calculate average oil change interval', () => {
      const oilChanges = [
        { odometer: 140000 },
        { odometer: 150000 },
        { odometer: 160000 }
      ]

      const intervals = []
      for (let i = 1; i < oilChanges.length; i++) {
        intervals.push(oilChanges[i].odometer - oilChanges[i-1].odometer)
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

      expect(avgInterval).toBe(10000)
    })
  })

  describe('Tire Management', () => {
    const mockTire = {
      _id: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      position: 'Old chap',
      brand: 'Michelin',
      model: 'X Line Energy',
      size: '315/80 R22.5',
      installDate: new Date(),
      installOdometer: 140000,
      expectedLifeKm: 50000,
      cost: 2500000
    }

    test('should calculate tire wear percentage', () => {
      const currentOdometer = 165000
      const installOdometer = 140000
      const expectedLifeKm = 50000

      const usedKm = currentOdometer - installOdometer
      const wearPercent = Math.min(100, (usedKm / expectedLifeKm) * 100)

      expect(usedKm).toBe(25000)
      expect(wearPercent).toBe(50)
    })

    test('should determine tire status', () => {
      const getTireStatus = (wearPercent) => {
        if (wearPercent >= 90) return 'worn'
        if (wearPercent >= 70) return 'used'
        return 'new'
      }

      expect(getTireStatus(30)).toBe('new')
      expect(getTireStatus(75)).toBe('used')
      expect(getTireStatus(95)).toBe('worn')
    })

    test('should validate tire positions', () => {
      const validPositions = [
        'Old chap', 'Old o\'ng', 
        'Orqa chap', 'Orqa o\'ng',
        'Orqa chap (ichki)', 'Orqa o\'ng (ichki)',
        'Zaxira'
      ]

      expect(validPositions.includes('Old chap')).toBe(true)
      expect(validPositions.includes('Invalid')).toBe(false)
    })

    test('should calculate total tire cost', () => {
      const tires = [
        { cost: 2500000 },
        { cost: 2500000 },
        { cost: 2500000 },
        { cost: 2500000 }
      ]

      const totalCost = tires.reduce((sum, t) => sum + t.cost, 0)

      expect(totalCost).toBe(10000000)
    })
  })

  describe('Service Management', () => {
    const mockService = {
      _id: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      type: 'TO-1',
      date: new Date(),
      odometer: 150000,
      cost: 3000000,
      description: 'Filtrlar almashtirish',
      serviceName: 'Avtoservis'
    }

    test('should validate service types', () => {
      const validTypes = [
        'TO-1', 'TO-2', 'Moy almashtirish', 'Tormoz', 
        'Shina', 'Dvigatel', 'Uzatmalar qutisi', 
        'Elektrika', 'Kuzov', 'Boshqa'
      ]

      expect(validTypes.includes('TO-1')).toBe(true)
      expect(validTypes.includes('Invalid')).toBe(false)
    })

    test('should calculate total service cost', () => {
      const services = [
        { cost: 3000000 },
        { cost: 1500000 },
        { cost: 5000000 }
      ]

      const totalCost = services.reduce((sum, s) => sum + s.cost, 0)

      expect(totalCost).toBe(9500000)
    })

    test('should group services by type', () => {
      const services = [
        { type: 'TO-1', cost: 3000000 },
        { type: 'TO-2', cost: 5000000 },
        { type: 'TO-1', cost: 3200000 },
        { type: 'Tormoz', cost: 1500000 }
      ]

      const grouped = services.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + s.cost
        return acc
      }, {})

      expect(grouped['TO-1']).toBe(6200000)
      expect(grouped['TO-2']).toBe(5000000)
      expect(grouped['Tormoz']).toBe(1500000)
    })
  })

  describe('Overall Statistics', () => {
    test('should calculate total maintenance cost', () => {
      const stats = {
        totalFuelCost: 15000000,
        totalOilCost: 3000000,
        totalTireCost: 10000000,
        totalServiceCost: 9500000
      }

      const totalCost = stats.totalFuelCost + stats.totalOilCost + 
                        stats.totalTireCost + stats.totalServiceCost

      expect(totalCost).toBe(37500000)
    })

    test('should format money correctly', () => {
      const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

      // Intl.NumberFormat turli space ishlatishi mumkin
      expect(formatMoney(1500000).replace(/\s/g, '')).toBe('1500000')
      expect(formatMoney(0)).toBe('0')
      expect(formatMoney(null)).toBe('0')
    })
  })
})
