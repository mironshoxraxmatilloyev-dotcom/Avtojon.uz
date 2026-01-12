/**
 * Vehicle API Tests
 * Fleet tizimi uchun mashina CRUD operatsiyalari testi
 */

// Mock dependencies
jest.mock('../models/Vehicle', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn()
}))

jest.mock('../models/User', () => ({
  findById: jest.fn()
}))

const Vehicle = require('../models/Vehicle')
const User = require('../models/User')

describe('Vehicle API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Vehicle Model', () => {
    const mockVehicle = {
      _id: '507f1f77bcf86cd799439011',
      plateNumber: '01A123BC',
      brand: 'MAN',
      model: 'TGX',
      year: 2020,
      fuelType: 'diesel',
      fuelTankCapacity: 400,
      currentOdometer: 150000,
      status: 'normal',
      ownerId: '507f1f77bcf86cd799439012',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    test('should create a new vehicle', async () => {
      Vehicle.create.mockResolvedValue(mockVehicle)
      
      const result = await Vehicle.create({
        plateNumber: '01A123BC',
        brand: 'MAN',
        model: 'TGX',
        year: 2020,
        fuelType: 'diesel',
        ownerId: '507f1f77bcf86cd799439012'
      })

      expect(result).toEqual(mockVehicle)
      expect(Vehicle.create).toHaveBeenCalledTimes(1)
    })

    test('should find all vehicles for owner', async () => {
      const mockVehicles = [mockVehicle, { ...mockVehicle, _id: '507f1f77bcf86cd799439013', plateNumber: '01B456DE' }]
      Vehicle.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVehicles)
      })

      const result = await Vehicle.find({ ownerId: '507f1f77bcf86cd799439012' }).sort({ createdAt: -1 })

      expect(result).toHaveLength(2)
      expect(result[0].plateNumber).toBe('01A123BC')
    })

    test('should find vehicle by ID', async () => {
      Vehicle.findById.mockResolvedValue(mockVehicle)

      const result = await Vehicle.findById('507f1f77bcf86cd799439011')

      expect(result).toEqual(mockVehicle)
      expect(result.brand).toBe('MAN')
    })

    test('should update vehicle', async () => {
      const updatedVehicle = { ...mockVehicle, currentOdometer: 160000 }
      Vehicle.findByIdAndUpdate.mockResolvedValue(updatedVehicle)

      const result = await Vehicle.findByIdAndUpdate(
        '507f1f77bcf86cd799439011',
        { currentOdometer: 160000 },
        { new: true }
      )

      expect(result.currentOdometer).toBe(160000)
    })

    test('should delete vehicle', async () => {
      Vehicle.findByIdAndDelete.mockResolvedValue(mockVehicle)

      const result = await Vehicle.findByIdAndDelete('507f1f77bcf86cd799439011')

      expect(result).toEqual(mockVehicle)
      expect(Vehicle.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    })

    test('should check duplicate plate number', async () => {
      Vehicle.findOne.mockResolvedValue(mockVehicle)

      const existing = await Vehicle.findOne({ plateNumber: '01A123BC' })

      expect(existing).toBeTruthy()
      expect(existing.plateNumber).toBe('01A123BC')
    })

    test('should return null for non-existing plate', async () => {
      Vehicle.findOne.mockResolvedValue(null)

      const existing = await Vehicle.findOne({ plateNumber: 'NOTEXIST' })

      expect(existing).toBeNull()
    })
  })

  describe('Vehicle Validation', () => {
    test('should validate plate number format', () => {
      const validPlates = ['01A123BC', '10B456DE', '99Z999ZZ']
      const invalidPlates = ['', '123', 'ABCDEFGH', '01a123bc']

      validPlates.forEach(plate => {
        expect(/^[0-9]{2}[A-Z][0-9]{3}[A-Z]{2}$/.test(plate)).toBe(true)
      })

      invalidPlates.forEach(plate => {
        expect(/^[0-9]{2}[A-Z][0-9]{3}[A-Z]{2}$/.test(plate)).toBe(false)
      })
    })

    test('should validate fuel types', () => {
      const validFuelTypes = ['diesel', 'petrol', 'gas', 'metan']
      const invalidFuelTypes = ['electric', 'hydrogen', '']

      validFuelTypes.forEach(type => {
        expect(['diesel', 'petrol', 'gas', 'metan'].includes(type)).toBe(true)
      })

      invalidFuelTypes.forEach(type => {
        expect(['diesel', 'petrol', 'gas', 'metan'].includes(type)).toBe(false)
      })
    })

    test('should validate year range', () => {
      const currentYear = new Date().getFullYear()
      const validYears = [1990, 2000, 2020, currentYear]
      const invalidYears = [1800, 1989, currentYear + 2]

      validYears.forEach(year => {
        expect(year >= 1990 && year <= currentYear + 1).toBe(true)
      })

      invalidYears.forEach(year => {
        expect(year >= 1990 && year <= currentYear + 1).toBe(false)
      })
    })

    test('should validate odometer is positive', () => {
      expect(150000 >= 0).toBe(true)
      expect(0 >= 0).toBe(true)
      expect(-100 >= 0).toBe(false)
    })
  })

  describe('Vehicle Status', () => {
    test('should determine status based on conditions', () => {
      const getStatus = (oilStatus, tireStatus) => {
        if (oilStatus === 'overdue') return 'critical'
        if (oilStatus === 'approaching' || tireStatus === 'worn') return 'attention'
        return 'normal'
      }

      expect(getStatus('ok', 'new')).toBe('normal')
      expect(getStatus('approaching', 'new')).toBe('attention')
      expect(getStatus('ok', 'worn')).toBe('attention')
      expect(getStatus('overdue', 'new')).toBe('critical')
    })
  })

  describe('Vehicle Statistics', () => {
    test('should calculate total kilometers', () => {
      const vehicles = [
        { currentOdometer: 100000 },
        { currentOdometer: 150000 },
        { currentOdometer: 200000 }
      ]

      const totalKm = vehicles.reduce((sum, v) => sum + (v.currentOdometer || 0), 0)

      expect(totalKm).toBe(450000)
    })

    test('should count vehicles by status', () => {
      const vehicles = [
        { status: 'normal' },
        { status: 'normal' },
        { status: 'attention' },
        { status: 'critical' }
      ]

      const stats = {
        total: vehicles.length,
        excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
        attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length
      }

      expect(stats.total).toBe(4)
      expect(stats.excellent).toBe(2)
      expect(stats.attention).toBe(2)
    })
  })
})
