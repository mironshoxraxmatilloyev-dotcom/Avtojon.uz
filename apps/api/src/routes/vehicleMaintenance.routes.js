const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { FuelRefill, OilChange, Tire, ServiceLog, VehicleAlert } = require('../models/VehicleMaintenance')
const Vehicle = require('../models/Vehicle')

// Helper: businessman ID olish
const getBusinessmanId = (req) => {
  // Biznesmen o'zi kirgan bo'lsa
  if (req.businessman) return req.businessman._id
  // Shofyor kirgan bo'lsa - uning egasi (user)
  if (req.driver) return req.driver.user
  // Eski user model (admin)
  if (req.user) return req.user._id
  return null
}

// ============ FUEL REFILLS ============
// Yoqilg'i to'ldirishlarni olish
router.get('/vehicles/:vehicleId/fuel', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    
    // Bo'sh array qaytarish agar hech narsa topilmasa
    const refills = await FuelRefill.find({ vehicle: vehicleId }).sort({ date: -1 }).lean()
    
    // Statistika hisoblash
    const stats = {
      totalLiters: refills.reduce((sum, r) => sum + (r.liters || 0), 0),
      totalCost: refills.reduce((sum, r) => sum + (r.cost || 0), 0),
      avgPer100km: 0,
      monthlyConsumption: 0
    }
    
    // Oylik sarf
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const monthlyRefills = refills.filter(r => r.date && new Date(r.date) >= thisMonth)
    stats.monthlyConsumption = monthlyRefills.reduce((sum, r) => sum + (r.liters || 0), 0)
    
    // O'rtacha sarf (100km uchun)
    if (refills.length >= 2) {
      const firstOdo = refills[refills.length - 1]?.odometer || 0
      const lastOdo = refills[0]?.odometer || 0
      const totalKm = lastOdo - firstOdo
      if (totalKm > 0) {
        stats.avgPer100km = Math.round((stats.totalLiters / totalKm) * 100 * 10) / 10
      }
    }
    
    res.json({ success: true, data: { refills, stats } })
  } catch (err) {
    console.error('❌ Fuel GET error:', err.message, err.stack)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Yoqilg'i qo'shish
router.post('/vehicles/:vehicleId/fuel', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body // _id ni olib tashlash (frontend temp ID yuboradi)
    
    const refill = await FuelRefill.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req),
      pricePerLiter: body.liters ? body.cost / body.liters : 0
    })

    // Mashina odometrini yangilash
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, { 
      currentOdometer: body.odometer,
      lastFuelDate: body.date || new Date()
    })
    
    res.status(201).json({ success: true, data: refill })
  } catch (err) {
    console.error('❌ Fuel POST error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Yoqilg'i tahrirlash
router.put('/fuel/:id', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const refill = await FuelRefill.findByIdAndUpdate(req.params.id, {
      ...body,
      pricePerLiter: body.liters ? body.cost / body.liters : 0
    }, { new: true })
    res.json({ success: true, data: refill })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Yoqilg'i o'chirish
router.delete('/fuel/:id', protect, async (req, res) => {
  try {
    await FuelRefill.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ OIL CHANGES ============
// Moy almashtirishlarni olish
router.get('/vehicles/:vehicleId/oil', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    
    const changes = await OilChange.find({ vehicle: vehicleId }).sort({ date: -1 }).lean()
    const vehicle = await Vehicle.findById(vehicleId).lean()
    const lastChange = changes[0] || null
    
    // Holat hisoblash
    let status = 'ok'
    let remainingKm = 10000
    if (lastChange) {
      const nextOdo = lastChange.nextChangeOdometer || (lastChange.odometer || 0) + 10000
      remainingKm = nextOdo - (vehicle?.currentOdometer || 0)
      if (remainingKm <= 0) status = 'overdue'
      else if (remainingKm <= 2000) status = 'approaching'
    }
    
    res.json({ success: true, data: { changes, lastChange, status, remainingKm } })
  } catch (err) {
    console.error('❌ Oil GET error:', err.message, err.stack)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Moy almashtirish qo'shish
router.post('/vehicles/:vehicleId/oil', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body // _id ni olib tashlash
    
    const change = await OilChange.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req),
      nextChangeOdometer: body.nextChangeOdometer || (Number(body.odometer) + 10000)
    })
    
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, { 
      currentOdometer: body.odometer,
      lastOilChangeDate: body.date || new Date(),
      lastOilChangeOdometer: body.odometer
    })
    
    res.status(201).json({ success: true, data: change })
  } catch (err) {
    console.error('❌ Oil POST error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Moy tahrirlash
router.put('/oil/:id', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const change = await OilChange.findByIdAndUpdate(req.params.id, body, { new: true })
    res.json({ success: true, data: change })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Moy o'chirish
router.delete('/oil/:id', protect, async (req, res) => {
  try {
    await OilChange.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TIRES ============
// Shinalarni olish
router.get('/vehicles/:vehicleId/tires', protect, async (req, res) => {
  try {
    const tires = await Tire.find({ 
      vehicle: req.params.vehicleId
    }).sort({ position: 1 })
    
    const vehicle = await Vehicle.findById(req.params.vehicleId)
    const currentOdo = vehicle?.currentOdometer || 0
    
    // Har bir shina uchun qolgan km va holatni hisoblash
    const tiresWithStatus = tires.map(tire => {
      const usedKm = currentOdo - tire.installOdometer
      const remainingKm = Math.max(0, tire.expectedLifeKm - usedKm)
      let status = tire.status
      
      // Avtomatik holat aniqlash
      if (remainingKm <= 0) status = 'worn'
      else if (remainingKm <= 10000) status = 'used'
      
      return { ...tire.toObject(), usedKm, remainingKm, calculatedStatus: status }
    })
    
    res.json({ success: true, data: tiresWithStatus })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Shina qo'shish
router.post('/vehicles/:vehicleId/tires', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body // _id ni olib tashlash
    
    const tire = await Tire.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req)
    })
    res.status(201).json({ success: true, data: tire })
  } catch (err) {
    console.error('❌ Tire POST error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Shina yangilash
router.put('/tires/:id', protect, async (req, res) => {
  try {
    const tire = await Tire.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ success: true, data: tire })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Shina o'chirish
router.delete('/tires/:id', protect, async (req, res) => {
  try {
    await Tire.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ SERVICE LOGS ============
// Xizmatlarni olish
router.get('/vehicles/:vehicleId/services', protect, async (req, res) => {
  try {
    const services = await ServiceLog.find({ 
      vehicle: req.params.vehicleId
    }).sort({ date: -1 })
    
    const stats = {
      totalServices: services.length,
      totalCost: services.reduce((sum, s) => sum + s.cost, 0),
      lastService: services[0] || null
    }
    
    res.json({ success: true, data: { services, stats } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xizmat qo'shish
router.post('/vehicles/:vehicleId/services', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body // _id ni olib tashlash
    
    const service = await ServiceLog.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req)
    })
    
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, { 
      currentOdometer: body.odometer,
      lastServiceDate: body.date || new Date()
    })
    
    res.status(201).json({ success: true, data: service })
  } catch (err) {
    console.error('❌ Service POST error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xizmat tahrirlash
router.put('/services/:id', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const service = await ServiceLog.findByIdAndUpdate(req.params.id, body, { new: true })
    res.json({ success: true, data: service })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xizmat o'chirish
router.delete('/services/:id', protect, async (req, res) => {
  try {
    await ServiceLog.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ ALERTS ============
router.get('/vehicles/:vehicleId/alerts', protect, async (req, res) => {
  try {
    const alerts = await VehicleAlert.find({ 
      vehicle: req.params.vehicleId,
      isResolved: false
    }).sort({ createdAt: -1 })
    res.json({ success: true, data: alerts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.put('/alerts/:id/resolve', protect, async (req, res) => {
  try {
    await VehicleAlert.findByIdAndUpdate(req.params.id, { isResolved: true })
    res.json({ success: true, message: 'Hal qilindi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
