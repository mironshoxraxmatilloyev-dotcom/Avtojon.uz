const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { FuelRefill, OilChange, Tire, ServiceLog, VehicleIncome, OtherExpense, VehicleAlert } = require('../models/VehicleMaintenance')
const Vehicle = require('../models/Vehicle')

// Helper: businessman ID olish
const getBusinessmanId = (req) => {
  if (req.businessman) return req.businessman._id
  if (req.driver) return req.driver.user
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
    const { _id, ...body } = req.body
    
    // Oldingi to'ldirishni topish (yoqilg'i sarfini hisoblash uchun)
    const lastRefill = await FuelRefill.findOne({ 
      vehicle: req.params.vehicleId 
    }).sort({ odometer: -1 })
    
    const refill = await FuelRefill.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req),
      pricePerLiter: body.liters ? body.cost / body.liters : 0,
      previousOdometer: lastRefill?.odometer || 0
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
    await VehicleAlert.findByIdAndUpdate(req.params.id, { isResolved: true, resolvedAt: new Date() })
    res.json({ success: true, message: 'Hal qilindi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ INCOME (DAROMAD) ============
router.get('/vehicles/:vehicleId/income', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const { startDate, endDate } = req.query
    
    const query = { vehicle: vehicleId }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }
    
    const incomes = await VehicleIncome.find(query).sort({ date: -1 }).lean()
    
    const stats = {
      totalIncome: incomes.reduce((sum, i) => sum + (i.amount || 0), 0),
      tripCount: incomes.filter(i => i.type === 'trip').length,
      totalDistance: incomes.reduce((sum, i) => sum + (i.distance || 0), 0),
      avgPerTrip: 0
    }
    
    if (stats.tripCount > 0) {
      stats.avgPerTrip = Math.round(stats.totalIncome / stats.tripCount)
    }
    
    res.json({ success: true, data: { incomes, stats } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/vehicles/:vehicleId/income', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const income = await VehicleIncome.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req)
    })
    
    // Mashina totalIncome ni yangilash
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, {
      $inc: { totalIncome: body.amount || 0 }
    })
    
    res.status(201).json({ success: true, data: income })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.put('/income/:id', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const oldIncome = await VehicleIncome.findById(req.params.id)
    const income = await VehicleIncome.findByIdAndUpdate(req.params.id, body, { new: true })
    
    // Farqni hisoblash va yangilash
    if (oldIncome && income) {
      const diff = (body.amount || income.amount) - oldIncome.amount
      await Vehicle.findByIdAndUpdate(income.vehicle, { $inc: { totalIncome: diff } })
    }
    
    res.json({ success: true, data: income })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/income/:id', protect, async (req, res) => {
  try {
    const income = await VehicleIncome.findById(req.params.id)
    if (income) {
      await Vehicle.findByIdAndUpdate(income.vehicle, { $inc: { totalIncome: -(income.amount || 0) } })
      await income.deleteOne()
    }
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ OTHER EXPENSES (BOSHQA XARAJATLAR) ============
router.get('/vehicles/:vehicleId/expenses', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const expenses = await OtherExpense.find({ vehicle: vehicleId }).sort({ date: -1 }).lean()
    
    const stats = {
      totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      byType: {}
    }
    
    expenses.forEach(e => {
      stats.byType[e.type] = (stats.byType[e.type] || 0) + (e.amount || 0)
    })
    
    res.json({ success: true, data: { expenses, stats } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/vehicles/:vehicleId/expenses', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const expense = await OtherExpense.create({
      ...body,
      vehicle: req.params.vehicleId,
      businessman: getBusinessmanId(req)
    })
    
    // Sug'urta bo'lsa, mashina sug'urta ma'lumotlarini yangilash
    if (body.type === 'insurance' && body.expiryDate) {
      await Vehicle.findByIdAndUpdate(req.params.vehicleId, {
        insuranceExpiry: body.expiryDate,
        insuranceCost: body.amount
      })
    }
    
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, {
      $inc: { totalExpenses: body.amount || 0 }
    })
    
    res.status(201).json({ success: true, data: expense })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.put('/expenses/:id', protect, async (req, res) => {
  try {
    const { _id, ...body } = req.body
    const oldExpense = await OtherExpense.findById(req.params.id)
    const expense = await OtherExpense.findByIdAndUpdate(req.params.id, body, { new: true })
    
    if (oldExpense && expense) {
      const diff = (body.amount || expense.amount) - oldExpense.amount
      await Vehicle.findByIdAndUpdate(expense.vehicle, { $inc: { totalExpenses: diff } })
    }
    
    res.json({ success: true, data: expense })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/expenses/:id', protect, async (req, res) => {
  try {
    const expense = await OtherExpense.findById(req.params.id)
    if (expense) {
      await Vehicle.findByIdAndUpdate(expense.vehicle, { $inc: { totalExpenses: -(expense.amount || 0) } })
      await expense.deleteOne()
    }
    res.json({ success: true, message: 'O\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ ANALYTICS (TAHLIL) ============
router.get('/vehicles/:vehicleId/analytics', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const { period = '30' } = req.query // kunlar soni
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))
    
    const vehicle = await Vehicle.findById(vehicleId).lean()
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Parallel so'rovlar
    const [fuelRefills, oilChanges, tires, services, incomes, otherExpenses, alerts] = await Promise.all([
      FuelRefill.find({ vehicle: vehicleId, date: { $gte: startDate } }).sort({ date: -1 }).lean(),
      OilChange.find({ vehicle: vehicleId }).sort({ date: -1 }).limit(5).lean(),
      Tire.find({ vehicle: vehicleId, status: { $ne: 'replaced' } }).lean(),
      ServiceLog.find({ vehicle: vehicleId, date: { $gte: startDate } }).lean(),
      VehicleIncome.find({ vehicle: vehicleId, date: { $gte: startDate } }).lean(),
      OtherExpense.find({ vehicle: vehicleId, date: { $gte: startDate } }).lean(),
      VehicleAlert.find({ vehicle: vehicleId, isResolved: false }).lean()
    ])
    
    // === XARAJATLAR ===
    const fuelCost = fuelRefills.reduce((sum, r) => sum + (r.cost || 0), 0)
    const oilCost = oilChanges.filter(o => new Date(o.date) >= startDate).reduce((sum, o) => sum + (o.cost || 0), 0)
    const tireCost = tires.filter(t => new Date(t.installDate) >= startDate).reduce((sum, t) => sum + (t.cost || 0), 0)
    const serviceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
    const otherCost = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalExpenses = fuelCost + oilCost + tireCost + serviceCost + otherCost
    
    // === DAROMAD ===
    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)
    
    // === SOF FOYDA ===
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0
    
    // === YOQILG'I SAMARADORLIGI ===
    let fuelEfficiency = { avgConsumption: 0, trend: 'stable', totalLiters: 0, totalKm: 0 }
    if (fuelRefills.length >= 2) {
      const totalLiters = fuelRefills.reduce((sum, r) => sum + (r.liters || 0), 0)
      const firstOdo = fuelRefills[fuelRefills.length - 1]?.odometer || 0
      const lastOdo = fuelRefills[0]?.odometer || 0
      const totalKm = lastOdo - firstOdo
      
      fuelEfficiency.totalLiters = totalLiters
      fuelEfficiency.totalKm = totalKm
      
      if (totalKm > 0) {
        fuelEfficiency.avgConsumption = Math.round((totalLiters / totalKm) * 100 * 10) / 10
        
        // Trend - oxirgi 3 ta to'ldirish vs oldingi 3 ta
        if (fuelRefills.length >= 6) {
          const recent = fuelRefills.slice(0, 3)
          const older = fuelRefills.slice(3, 6)
          const recentAvg = recent.reduce((s, r) => s + (r.fuelConsumption || 0), 0) / 3
          const olderAvg = older.reduce((s, r) => s + (r.fuelConsumption || 0), 0) / 3
          if (recentAvg > olderAvg * 1.1) fuelEfficiency.trend = 'increasing'
          else if (recentAvg < olderAvg * 0.9) fuelEfficiency.trend = 'decreasing'
        }
      }
    }
    
    // === MOY HOLATI ===
    const lastOilChange = oilChanges[0]
    let oilStatus = { status: 'ok', remainingKm: vehicle.oilChangeIntervalKm || 15000, nextChangeOdometer: 0 }
    if (lastOilChange) {
      const nextOdo = lastOilChange.nextChangeOdometer || (lastOilChange.odometer + (vehicle.oilChangeIntervalKm || 15000))
      oilStatus.nextChangeOdometer = nextOdo
      oilStatus.remainingKm = nextOdo - (vehicle.currentOdometer || 0)
      if (oilStatus.remainingKm <= 0) oilStatus.status = 'overdue'
      else if (oilStatus.remainingKm <= 1000) oilStatus.status = 'critical'
      else if (oilStatus.remainingKm <= 2000) oilStatus.status = 'warning'
    }
    
    // === SHINA HOLATI ===
    const currentOdo = vehicle.currentOdometer || 0
    const tiresStatus = tires.map(t => {
      const usedKm = currentOdo - (t.installOdometer || 0)
      const remainingKm = Math.max(0, (t.expectedLifeKm || 80000) - usedKm)
      const wearPercent = Math.min(100, Math.round((usedKm / (t.expectedLifeKm || 80000)) * 100))
      let status = 'good'
      if (wearPercent >= 90) status = 'critical'
      else if (wearPercent >= 75) status = 'warning'
      return { ...t, usedKm, remainingKm, wearPercent, calculatedStatus: status }
    })
    const worstTire = tiresStatus.reduce((worst, t) => 
      (!worst || t.wearPercent > worst.wearPercent) ? t : worst, null)
    
    // === OGOHLANTIRISHLAR ===
    const newAlerts = []
    
    // Moy ogohlantirishi
    if (oilStatus.status === 'overdue') {
      newAlerts.push({ type: 'oil', severity: 'danger', message: 'Moy almashtirish muddati o\'tdi!' })
    } else if (oilStatus.status === 'critical') {
      newAlerts.push({ type: 'oil', severity: 'warning', message: `Moy almashtirishga ${oilStatus.remainingKm} km qoldi` })
    }
    
    // Shina ogohlantirishi
    if (worstTire && worstTire.wearPercent >= 90) {
      newAlerts.push({ type: 'tire', severity: 'danger', message: `${worstTire.position} shina ${worstTire.wearPercent}% eskirgan` })
    }
    
    // Yoqilg'i sarfi ogohlantirishi
    const expectedConsumption = vehicle.expectedFuelConsumption || 25
    if (fuelEfficiency.avgConsumption > expectedConsumption * 1.2) {
      newAlerts.push({ type: 'fuel', severity: 'warning', message: `Yoqilg'i sarfi normaldan ${Math.round((fuelEfficiency.avgConsumption / expectedConsumption - 1) * 100)}% yuqori` })
    }
    
    // Zarar ogohlantirishi
    if (netProfit < 0) {
      newAlerts.push({ type: 'profit_warning', severity: 'danger', message: `Mashina ${Math.abs(netProfit).toLocaleString()} so'm zarar ko'rsatyapti` })
    }
    
    // === XARAJAT TAQSIMOTI ===
    const expenseBreakdown = {
      fuel: { amount: fuelCost, percent: totalExpenses > 0 ? Math.round((fuelCost / totalExpenses) * 100) : 0 },
      oil: { amount: oilCost, percent: totalExpenses > 0 ? Math.round((oilCost / totalExpenses) * 100) : 0 },
      tires: { amount: tireCost, percent: totalExpenses > 0 ? Math.round((tireCost / totalExpenses) * 100) : 0 },
      service: { amount: serviceCost, percent: totalExpenses > 0 ? Math.round((serviceCost / totalExpenses) * 100) : 0 },
      other: { amount: otherCost, percent: totalExpenses > 0 ? Math.round((otherCost / totalExpenses) * 100) : 0 }
    }
    
    // === ROI (Return on Investment) ===
    const purchasePrice = vehicle.purchasePrice || 0
    const roi = purchasePrice > 0 ? Math.round((netProfit / purchasePrice) * 100 * 10) / 10 : 0
    
    res.json({
      success: true,
      data: {
        vehicle: {
          _id: vehicle._id,
          plateNumber: vehicle.plateNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          currentOdometer: vehicle.currentOdometer,
          purchasePrice: vehicle.purchasePrice
        },
        period: parseInt(period),
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin,
          roi,
          isProfitable: netProfit >= 0
        },
        fuelEfficiency,
        oilStatus,
        tiresStatus: {
          total: tiresStatus.length,
          worstTire,
          needAttention: tiresStatus.filter(t => t.calculatedStatus !== 'good').length
        },
        expenseBreakdown,
        alerts: [...newAlerts, ...alerts],
        recentActivity: {
          fuelRefills: fuelRefills.length,
          services: services.length,
          incomes: incomes.length
        }
      }
    })
  } catch (err) {
    console.error('❌ Analytics error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ FLEET ANALYTICS (BARCHA MASHINALAR) ============
router.get('/fleet/analytics', protect, async (req, res) => {
  try {
    const businessmanId = getBusinessmanId(req)
    const { period = '30' } = req.query
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))
    
    // Barcha mashinalarni olish
    const vehicles = await Vehicle.find({ user: businessmanId, isActive: true }).lean()
    const vehicleIds = vehicles.map(v => v._id)
    
    // Parallel so'rovlar
    const [fuelRefills, oilChanges, tires, services, incomes, otherExpenses, alerts] = await Promise.all([
      FuelRefill.find({ vehicle: { $in: vehicleIds }, date: { $gte: startDate } }).lean(),
      OilChange.find({ vehicle: { $in: vehicleIds } }).sort({ date: -1 }).lean(),
      Tire.find({ vehicle: { $in: vehicleIds }, status: { $ne: 'replaced' } }).lean(),
      ServiceLog.find({ vehicle: { $in: vehicleIds }, date: { $gte: startDate } }).lean(),
      VehicleIncome.find({ vehicle: { $in: vehicleIds }, date: { $gte: startDate } }).lean(),
      OtherExpense.find({ vehicle: { $in: vehicleIds }, date: { $gte: startDate } }).lean(),
      VehicleAlert.find({ vehicle: { $in: vehicleIds }, isResolved: false }).lean()
    ])
    
    // Umumiy statistika
    const totalFuelCost = fuelRefills.reduce((sum, r) => sum + (r.cost || 0), 0)
    const totalServiceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
    const totalOtherCost = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalExpenses = totalFuelCost + totalServiceCost + totalOtherCost
    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)
    const netProfit = totalIncome - totalExpenses
    
    // Har bir mashina uchun foyda/zarar
    const vehicleStats = vehicles.map(v => {
      const vFuel = fuelRefills.filter(f => f.vehicle.toString() === v._id.toString())
      const vServices = services.filter(s => s.vehicle.toString() === v._id.toString())
      const vOther = otherExpenses.filter(e => e.vehicle.toString() === v._id.toString())
      const vIncome = incomes.filter(i => i.vehicle.toString() === v._id.toString())
      
      const expenses = vFuel.reduce((s, f) => s + (f.cost || 0), 0) +
                       vServices.reduce((s, s2) => s + (s2.cost || 0), 0) +
                       vOther.reduce((s, e) => s + (e.amount || 0), 0)
      const income = vIncome.reduce((s, i) => s + (i.amount || 0), 0)
      
      return {
        _id: v._id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        income,
        expenses,
        profit: income - expenses,
        isProfitable: income >= expenses
      }
    }).sort((a, b) => b.profit - a.profit)
    
    // Eng foydali va eng zararlı
    const mostProfitable = vehicleStats[0]
    const leastProfitable = vehicleStats[vehicleStats.length - 1]
    
    // Diqqat talab qiladigan mashinalar
    const needAttention = vehicles.filter(v => {
      const vAlerts = alerts.filter(a => a.vehicle.toString() === v._id.toString())
      return vAlerts.some(a => a.severity === 'danger')
    })
    
    res.json({
      success: true,
      data: {
        period: parseInt(period),
        summary: {
          totalVehicles: vehicles.length,
          totalIncome,
          totalExpenses,
          netProfit,
          profitableCount: vehicleStats.filter(v => v.isProfitable).length,
          unprofitableCount: vehicleStats.filter(v => !v.isProfitable).length
        },
        vehicleStats,
        mostProfitable,
        leastProfitable,
        needAttention: needAttention.length,
        alertsCount: alerts.length
      }
    })
  } catch (err) {
    console.error('❌ Fleet analytics error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ FLEET ALERTS (SMART ALERTS) ============
router.get('/fleet/alerts', protect, async (req, res) => {
  try {
    const businessmanId = getBusinessmanId(req)
    
    // Barcha mashinalarni olish
    const vehicles = await Vehicle.find({ user: businessmanId, isActive: true }).lean()
    const vehicleIds = vehicles.map(v => v._id)
    
    const alerts = []
    const today = new Date()
    
    // Parallel so'rovlar
    const [oilChanges, tires, services] = await Promise.all([
      OilChange.find({ vehicle: { $in: vehicleIds } }).sort({ date: -1 }).lean(),
      Tire.find({ vehicle: { $in: vehicleIds }, status: { $ne: 'replaced' } }).lean(),
      ServiceLog.find({ vehicle: { $in: vehicleIds } }).sort({ date: -1 }).lean()
    ])
    
    // Har bir mashina uchun alertlarni tekshirish
    for (const vehicle of vehicles) {
      const vId = vehicle._id.toString()
      
      // 1. Moy almashtirish tekshiruvi
      const lastOil = oilChanges.find(o => o.vehicle.toString() === vId)
      if (lastOil) {
        const nextOilKm = (lastOil.odometer || 0) + (lastOil.nextChangeKm || 10000)
        const kmLeft = nextOilKm - (vehicle.currentOdometer || 0)
        
        if (kmLeft <= 1000) {
          alerts.push({
            type: 'oil',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: kmLeft <= 0 ? 'Moy almashtirish vaqti o\'tdi!' : `${kmLeft} km qoldi`,
            severity: kmLeft <= 0 ? 'danger' : 'warning',
            kmLeft
          })
        }
      }
      
      // 2. Shina tekshiruvi
      const vTires = tires.filter(t => t.vehicle.toString() === vId)
      for (const tire of vTires) {
        const kmUsed = (vehicle.currentOdometer || 0) - (tire.installedAtKm || 0)
        const maxKm = tire.maxKm || 50000
        const kmLeft = maxKm - kmUsed
        
        if (kmLeft <= 5000) {
          alerts.push({
            type: 'tire',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: `${tire.position || 'Shina'}: ${kmLeft <= 0 ? 'Almashtirish kerak!' : `${kmLeft} km qoldi`}`,
            severity: kmLeft <= 0 ? 'danger' : 'warning',
            kmLeft
          })
        }
      }
      
      // 3. Texnik xizmat (oxirgi xizmatdan 6 oy o'tgan bo'lsa)
      const lastService = services.find(s => s.vehicle.toString() === vId)
      if (lastService) {
        const daysSinceService = Math.floor((today - new Date(lastService.date)) / (1000 * 60 * 60 * 24))
        if (daysSinceService >= 180) {
          alerts.push({
            type: 'service',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: `Oxirgi xizmatdan ${daysSinceService} kun o'tdi`,
            severity: daysSinceService >= 365 ? 'danger' : 'warning',
            daysLeft: 0
          })
        }
      } else if (vehicle.currentOdometer > 10000) {
        // Hech qachon xizmat ko'rsatilmagan
        alerts.push({
          type: 'service',
          vehicleId: vehicle._id,
          plateNumber: vehicle.plateNumber,
          message: 'Texnik xizmat tavsiya etiladi',
          severity: 'warning'
        })
      }
    }
    
    // Alertlarni severity bo'yicha tartiblash
    alerts.sort((a, b) => {
      const order = { danger: 0, warning: 1, info: 2 }
      return (order[a.severity] || 2) - (order[b.severity] || 2)
    })
    
    res.json({ success: true, data: alerts })
  } catch (err) {
    console.error('❌ Fleet alerts error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
