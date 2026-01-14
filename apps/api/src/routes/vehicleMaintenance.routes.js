const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { FuelRefill, OilChange, Tire, ServiceLog, VehicleIncome, OtherExpense, VehicleAlert } = require('../models/VehicleMaintenance')
const Vehicle = require('../models/Vehicle')

// Helper: businessman ID olish
const getBusinessmanId = (req) => {
  console.log('🔍 getBusinessmanId called:', {
    hasBusinessman: !!req.businessman,
    hasDriver: !!req.driver,
    hasUser: !!req.user,
    userRole: req.userRole,
    userId: req.user?._id,
    businessmanId: req.businessman?._id,
    driverUserId: req.driver?.user
  })
  
  if (req.businessman) {
    console.log('✅ Returning businessman._id:', req.businessman._id)
    return req.businessman._id
  }
  if (req.driver) {
    console.log('✅ Returning driver.user:', req.driver.user)
    return req.driver.user
  }
  if (req.user) {
    console.log('✅ Returning user._id:', req.user._id)
    return req.user._id
  }
  console.log('❌ No ID found')
  return null
}

// Helper: Mashina ownership tekshirish
const checkVehicleOwnership = async (vehicleId, userId) => {
  try {
    console.log('🔍 checkVehicleOwnership:', { vehicleId, userId })
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: userId, isActive: true })
      .select('_id currentOdometer oilChangeIntervalKm serviceIntervalKm fuelType')
      .lean()
    console.log('🔍 Vehicle found:', !!vehicle)
    return vehicle
  } catch (err) {
    console.error('❌ checkVehicleOwnership error:', err.message)
    return null
  }
}

// Helper: Ogohlantirish yaratish/yangilash
const checkAndCreateAlerts = async (vehicleId, businessmanId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId).lean()
    if (!vehicle) return
    
    const currentOdo = vehicle.currentOdometer || 0
    
    // Oxirgi moy almashtirishni olish
    const lastOilChange = await OilChange.findOne({ vehicle: vehicleId })
      .sort({ date: -1 }).lean()
    
    // Moy almashtirish ogohlantirishi
    if (lastOilChange) {
      const nextOdo = lastOilChange.nextChangeOdometer || (lastOilChange.odometer + 10000)
      const remainingKm = nextOdo - currentOdo
      
      // Eski alertni o'chirish
      await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'oil', isResolved: false })
      
      if (remainingKm <= 0) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'oil',
          severity: 'danger',
          message: `Moy almashtirish vaqti o'tdi! ${Math.abs(remainingKm)} km ortiqcha yurildi`,
          threshold: remainingKm
        })
      } else if (remainingKm <= 1000) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'oil',
          severity: 'warning',
          message: `Moy almashtirishga ${remainingKm} km qoldi`,
          threshold: remainingKm
        })
      } else if (remainingKm <= 2000) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'oil',
          severity: 'info',
          message: `Moy almashtirishga ${remainingKm} km qoldi`,
          threshold: remainingKm
        })
      }
    }
    
    // Shina ogohlantirishi
    const tires = await Tire.find({ vehicle: vehicleId, status: { $ne: 'replaced' } }).lean()
    await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'tire', isResolved: false })
    
    for (const tire of tires) {
      const usedKm = Math.max(0, currentOdo - (tire.installOdometer || 0))
      const expectedLife = tire.expectedLifeKm || 80000
      const remainingKm = expectedLife - usedKm
      
      if (remainingKm <= 0) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'tire',
          severity: 'danger',
          message: `${tire.position} shina almashtirish kerak! ${Math.abs(remainingKm)} km ortiqcha yurildi`,
          threshold: remainingKm
        })
      } else if (remainingKm <= 5000) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'tire',
          severity: 'warning',
          message: `${tire.position} shinaga ${remainingKm} km qoldi`,
          threshold: remainingKm
        })
      }
    }
    
    // Texnik xizmat ogohlantirishi
    const lastService = await ServiceLog.findOne({ vehicle: vehicleId })
      .sort({ date: -1 }).lean()
    
    await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'service', isResolved: false })
    
    if (lastService) {
      const nextServiceOdo = lastService.nextServiceOdometer || (lastService.odometer + 30000)
      const remainingKm = nextServiceOdo - currentOdo
      
      if (remainingKm <= 0) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'service',
          severity: 'warning',
          message: `Texnik xizmat vaqti keldi! ${Math.abs(remainingKm)} km ortiqcha yurildi`,
          threshold: remainingKm
        })
      } else if (remainingKm <= 3000) {
        await VehicleAlert.create({
          vehicle: vehicleId,
          businessman: businessmanId,
          type: 'service',
          severity: 'info',
          message: `Texnik xizmatga ${remainingKm} km qoldi`,
          threshold: remainingKm
        })
      }
    }
    
    console.log(`✅ Alerts checked for vehicle ${vehicleId}`)
  } catch (err) {
    console.error('❌ Alert check error:', err.message)
  }
}

// Helper: Yoqilg'i sarfini hisoblash
const calculateFuelConsumption = async (vehicleId, currentOdometer, currentLiters) => {
  try {
    // Oldingi yoqilg'i to'ldirishni topish
    const lastRefill = await FuelRefill.findOne({ vehicle: vehicleId })
      .sort({ odometer: -1 }).lean()
    
    if (!lastRefill || !lastRefill.odometer) {
      return { distanceTraveled: null, fuelConsumption: null, previousOdometer: 0 }
    }
    
    const distanceTraveled = currentOdometer - lastRefill.odometer
    
    if (distanceTraveled <= 0) {
      return { distanceTraveled: 0, fuelConsumption: null, previousOdometer: lastRefill.odometer }
    }
    
    // Sarflanish = (litr / km) * 100 = L/100km
    // Yoki km/litr (metan uchun km/kub)
    const fuelConsumption = Math.round((currentLiters / distanceTraveled) * 100 * 10) / 10
    const kmPerUnit = Math.round((distanceTraveled / currentLiters) * 10) / 10
    
    return { 
      distanceTraveled, 
      fuelConsumption, // L/100km
      kmPerUnit, // km/litr yoki km/kub
      previousOdometer: lastRefill.odometer 
    }
  } catch (err) {
    console.error('❌ Fuel consumption calc error:', err.message)
    return { distanceTraveled: null, fuelConsumption: null, previousOdometer: 0 }
  }
}

// Helper: Validatsiya
const validateMaintenanceData = (type, data, currentOdometer = 0) => {
  const errors = []
  
  // Umumiy validatsiyalar
  if (data.odometer !== undefined && data.odometer !== null && data.odometer !== '') {
    const odo = Number(data.odometer)
    if (isNaN(odo) || odo < 0) errors.push('Odometer noto\'g\'ri')
    // Juda katta qiymat tekshirish (10 million km dan katta)
    if (odo > 10000000) {
      errors.push('Odometer qiymati juda katta')
    }
  }
  
  if (data.date) {
    const date = new Date(data.date)
    const now = new Date()
    now.setHours(23, 59, 59, 999) // Bugungi kun oxiri
    if (date > now) errors.push('Kelajakdagi sana kiritish mumkin emas')
    // 10 yildan oldingi sana ham xato
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
    if (date < tenYearsAgo) errors.push('Sana juda eski')
  }
  
  // Tur bo'yicha validatsiya
  if (type === 'fuel') {
    if (!data.liters || Number(data.liters) <= 0) errors.push('Litr miqdori majburiy va musbat bo\'lishi kerak')
    if (!data.cost || Number(data.cost) <= 0) errors.push('Narx majburiy va musbat bo\'lishi kerak')
    if (data.liters && Number(data.liters) > 2000) errors.push('Litr miqdori juda katta (max 2000)')
    if (data.cost && Number(data.cost) > 100000000) errors.push('Narx juda katta')
  }
  
  if (type === 'oil') {
    if (!data.oilType) errors.push('Moy turi majburiy')
    if (!data.cost || Number(data.cost) <= 0) errors.push('Narx majburiy va musbat bo\'lishi kerak')
    if (data.cost && Number(data.cost) > 50000000) errors.push('Narx juda katta')
  }
  
  if (type === 'tire') {
    if (!data.brand) errors.push('Shina brendi majburiy')
    if (!data.position) errors.push('Shina pozitsiyasi majburiy')
    // size majburiy emas
    if (data.cost && Number(data.cost) < 0) errors.push('Narx salbiy bo\'lishi mumkin emas')
    if (data.expectedLifeKm && Number(data.expectedLifeKm) > 500000) errors.push('Kutilgan umr juda katta')
    // installOdometer majburiy emas, lekin agar berilgan bo'lsa tekshirish
    if (data.installOdometer !== undefined && data.installOdometer !== null && data.installOdometer !== '') {
      const odo = Number(data.installOdometer)
      if (isNaN(odo) || odo < 0) errors.push('O\'rnatish km noto\'g\'ri')
    }
  }
  
  if (type === 'service') {
    if (!data.type) errors.push('Xizmat turi majburiy')
    if (!data.cost || Number(data.cost) <= 0) errors.push('Narx majburiy va musbat bo\'lishi kerak')
    if (data.cost && Number(data.cost) > 500000000) errors.push('Narx juda katta')
  }
  
  if (type === 'income') {
    // Ijara uchun rentalDays va rentalRate dan amount hisoblanadi
    if (data.type === 'rental') {
      if (!data.rentalDays || Number(data.rentalDays) <= 0) errors.push('Kunlar soni majburiy')
      if (!data.rentalRate || Number(data.rentalRate) <= 0) errors.push('Kunlik narx majburiy')
      // amount avtomatik hisoblanadi, shuning uchun tekshirmaymiz
    } else {
      if (!data.amount || Number(data.amount) <= 0) errors.push('Summa majburiy va musbat bo\'lishi kerak')
    }
    if (data.amount && Number(data.amount) > 1000000000) errors.push('Summa juda katta')
    if (data.distance && Number(data.distance) < 0) errors.push('Masofa salbiy bo\'lishi mumkin emas')
    if (data.distance && Number(data.distance) > 50000) errors.push('Masofa juda katta (max 50,000 km)')
  }
  
  return errors
}

// ============ FUEL REFILLS ============
// Yoqilg'i to'ldirishlarni olish
router.get('/vehicles/:vehicleId/fuel', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    const refills = await FuelRefill.find({ vehicle: vehicleId })
      .select('date liters cost odometer fuelType station pricePerLiter fuelConsumption')
      .sort({ date: -1 })
      .limit(100)
      .lean()
    
    // Statistika hisoblash
    const stats = {
      totalLiters: refills.reduce((sum, r) => sum + (r.liters || 0), 0),
      totalCost: refills.reduce((sum, r) => sum + (r.cost || 0), 0),
      avgPer100km: 0,
      avgPricePerLiter: 0,
      monthlyConsumption: 0
    }
    
    // O'rtacha narx
    if (stats.totalLiters > 0) {
      stats.avgPricePerLiter = Math.round(stats.totalCost / stats.totalLiters)
    }
    
    // Oylik sarf
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    const monthlyRefills = refills.filter(r => r.date && new Date(r.date) >= thisMonth)
    stats.monthlyConsumption = monthlyRefills.reduce((sum, r) => sum + (r.liters || 0), 0)
    
    // O'rtacha sarf (100km uchun) - to'g'ri hisoblash
    if (refills.length >= 2) {
      // Odometr bo'yicha tartiblash
      const sorted = [...refills].filter(r => r.odometer && r.odometer > 0).sort((a, b) => a.odometer - b.odometer)
      if (sorted.length >= 2) {
        let totalKm = 0
        let totalFuel = 0
        
        for (let i = 1; i < sorted.length; i++) {
          const kmDiff = sorted[i].odometer - sorted[i - 1].odometer
          const liters = sorted[i].liters || 0
          if (kmDiff > 0 && liters > 0) {
            totalKm += kmDiff
            totalFuel += liters
          }
        }
        
        if (totalKm > 0 && totalFuel > 0) {
          stats.avgPer100km = Math.round((totalFuel / totalKm) * 100 * 10) / 10
          stats.kmPerUnit = Math.round((totalKm / totalFuel) * 10) / 10
          stats.totalKmCalculated = totalKm
        }
      }
    }
    
    res.json({ success: true, data: { refills, stats } })
  } catch (err) {
    console.error('❌ Fuel GET error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Yoqilg'i qo'shish
router.post('/vehicles/:vehicleId/fuel', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, ...body } = req.body
    
    console.log('📤 Fuel POST request:', { vehicleId, businessmanId, body })
    
    if (!businessmanId) {
      console.error('❌ BusinessmanId not found in request')
      return res.status(401).json({ success: false, message: 'Foydalanuvchi aniqlanmadi' })
    }
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    console.log('📤 Vehicle ownership check:', { vehicleId, businessmanId, found: !!vehicle })
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('fuel', body, vehicle.currentOdometer)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    // Yoqilg'i sarfini hisoblash (agar odometer berilgan bo'lsa)
    let consumptionData = { distanceTraveled: null, fuelConsumption: null, previousOdometer: 0 }
    if (body.odometer && body.liters) {
      consumptionData = await calculateFuelConsumption(vehicleId, body.odometer, body.liters)
    }
    
    const refill = await FuelRefill.create({
      ...body,
      vehicle: vehicleId,
      businessman: businessmanId,
      pricePerLiter: body.liters ? Math.round(body.cost / body.liters) : 0,
      previousOdometer: consumptionData.previousOdometer,
      distanceTraveled: consumptionData.distanceTraveled,
      fuelConsumption: consumptionData.fuelConsumption
    })

    // Mashina odometrini yangilash (faqat kattaroq bo'lsa)
    let maintenanceAlerts = []
    if (body.odometer && body.odometer > (vehicle.currentOdometer || 0)) {
      await Vehicle.findByIdAndUpdate(vehicleId, { 
        currentOdometer: body.odometer,
        lastFuelDate: body.date || new Date(),
        // Hisoblangan yoqilg'i sarfini saqlash
        calculatedFuelConsumption: consumptionData.fuelConsumption || vehicle.calculatedFuelConsumption,
        lastCalculatedAt: new Date()
      })
      
      // Alertlarni tekshirish (odometer yangilanganda)
      await checkAndCreateAlerts(vehicleId, businessmanId)
      
      // Yangi alertlarni olish va response da qaytarish
      maintenanceAlerts = await VehicleAlert.find({ 
        vehicle: vehicleId, 
        isResolved: false,
        severity: { $in: ['warning', 'danger'] }
      }).select('type severity message threshold').lean()
    }
    
    // Javobga sarflanish ma'lumotlarini qo'shish
    const responseData = {
      ...refill.toObject(),
      consumption: consumptionData.fuelConsumption 
        ? `${consumptionData.fuelConsumption} L/100km (${consumptionData.kmPerUnit} km/L)`
        : null,
      alerts: maintenanceAlerts // Ogohlantirish xabarlari
    }
    
    res.status(201).json({ success: true, data: responseData })
  } catch (err) {
    console.error('❌ Fuel POST error:', err.message, err.stack)
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
    const businessmanId = getBusinessmanId(req)
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    const changes = await OilChange.find({ vehicle: vehicleId })
      .select('date odometer oilType oilBrand liters cost nextChangeOdometer oilFilterCost airFilterCost cabinFilterCost gasFilterCost')
      .sort({ date: -1 })
      .limit(50)
      .lean()
    
    const lastChange = changes[0] || null
    
    // Holat hisoblash
    let status = 'ok'
    let remainingKm = 10000
    if (lastChange) {
      const nextOdo = lastChange.nextChangeOdometer || (lastChange.odometer || 0) + 10000
      remainingKm = nextOdo - (vehicle.currentOdometer || 0)
      if (remainingKm <= 0) status = 'overdue'
      else if (remainingKm <= 2000) status = 'approaching'
    }
    
    res.json({ success: true, data: { changes, lastChange, status, remainingKm } })
  } catch (err) {
    console.error('❌ Oil GET error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Moy almashtirish qo'shish
router.post('/vehicles/:vehicleId/oil', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, nextChangeKm, ...body } = req.body
    
    console.log('📤 Oil POST request:', { vehicleId, businessmanId, body, nextChangeKm })
    
    if (!businessmanId) {
      console.error('❌ BusinessmanId not found in request')
      return res.status(401).json({ success: false, message: 'Foydalanuvchi aniqlanmadi' })
    }
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    console.log('📤 Vehicle ownership check:', { vehicleId, businessmanId, found: !!vehicle })
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('oil', body, vehicle.currentOdometer)
    if (errors.length > 0) {
      console.log('📤 Validation errors:', errors)
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    // Keyingi almashtirish odometrini hisoblash
    const oilChangeInterval = vehicle.oilChangeIntervalKm || 10000
    const currentOdo = Number(body.odometer) || vehicle.currentOdometer || 0
    
    // nextChangeKm yoki nextChangeOdometer dan foydalanish
    let nextChangeOdometer = body.nextChangeOdometer
    if (!nextChangeOdometer && nextChangeKm) {
      nextChangeOdometer = currentOdo + Number(nextChangeKm)
    }
    if (!nextChangeOdometer) {
      nextChangeOdometer = currentOdo + oilChangeInterval
    }
    
    console.log('📤 Creating oil change:', { currentOdo, nextChangeOdometer })
    
    const change = await OilChange.create({
      ...body,
      vehicle: vehicleId,
      businessman: businessmanId,
      nextChangeOdometer
    })
    
    console.log('📤 Oil change created:', change._id)
    
    // Mashina odometrini va moy ma'lumotlarini yangilash
    const updateData = {
      lastOilChangeDate: body.date || new Date(),
      lastOilChangeOdometer: currentOdo
    }
    
    if (currentOdo > (vehicle.currentOdometer || 0)) {
      updateData.currentOdometer = currentOdo
    }
    
    await Vehicle.findByIdAndUpdate(vehicleId, updateData)
    
    // Eski moy alertlarini o'chirish (moy almashtirildi)
    await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'oil', isResolved: false })
    
    // Javobga keyingi almashtirish ma'lumotini qo'shish
    const responseData = {
      ...change.toObject(),
      nextChangeInfo: `Keyingi almashtirish: ${nextChangeOdometer.toLocaleString()} km da`
    }
    
    res.status(201).json({ success: true, data: responseData })
  } catch (err) {
    console.error('❌ Oil POST error:', err.message, err.stack)
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
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    
    console.log('📤 Tires GET request:', { vehicleId, businessmanId })
    
    if (!businessmanId) {
      console.error('❌ BusinessmanId not found in request')
      return res.status(401).json({ success: false, message: 'Foydalanuvchi aniqlanmadi' })
    }
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    console.log('📤 Vehicle ownership check:', { vehicleId, businessmanId, found: !!vehicle })
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    console.log('📤 Fetching tires for vehicle:', vehicleId)
    
    const tires = await Tire.find({ vehicle: vehicleId })
      .select('position brand model size cost installDate installOdometer expectedLifeKm status dotNumber serialNumber')
      .sort({ position: 1 })
      .lean()
      .catch(err => {
        console.error('❌ Tire.find error:', err.message, err.stack)
        throw err
      })
    
    console.log('📤 Found tires:', tires.length)
    
    const currentOdo = vehicle.currentOdometer || 0
    
    // Har bir shina uchun qolgan km va holatni hisoblash
    const tiresWithStatus = tires.map(tire => {
      try {
        const usedKm = Math.max(0, currentOdo - (tire.installOdometer || 0))
        const expectedLife = tire.expectedLifeKm || 80000
        const remainingKm = Math.max(0, expectedLife - usedKm)
        
        // Vaqt bo'yicha eskirish
        const installDate = new Date(tire.installDate)
        const ageYears = (Date.now() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        const ageWearPercent = Math.min(100, Math.round((ageYears / 5) * 100))
        const kmWearPercent = Math.min(100, Math.round((usedKm / expectedLife) * 100))
        
        let status = tire.status
        // Avtomatik holat aniqlash
        const maxWear = Math.max(ageWearPercent, kmWearPercent)
        if (maxWear >= 90 || remainingKm <= 0) status = 'worn'
        else if (maxWear >= 70 || remainingKm <= 10000) status = 'used'
        
        return { ...tire, usedKm, remainingKm, calculatedStatus: status }
      } catch (err) {
        console.error('❌ Error processing tire:', tire._id, err.message)
        return { ...tire, usedKm: 0, remainingKm: 0, calculatedStatus: 'used' }
      }
    })
    
    console.log('✅ Tires GET success:', tiresWithStatus.length)
    res.json({ success: true, data: tiresWithStatus })
  } catch (err) {
    console.error('❌ Tires GET error:', err.message, err.stack)
    res.status(500).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined })
  }
})

// Shina qo'shish
router.post('/vehicles/:vehicleId/tires', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, ...body } = req.body
    
    console.log('📤 Tire POST request:', { vehicleId, businessmanId, body })
    
    if (!businessmanId) {
      console.error('❌ BusinessmanId not found in request')
      return res.status(401).json({ success: false, message: 'Foydalanuvchi aniqlanmadi' })
    }
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    console.log('📤 Vehicle ownership check:', { vehicleId, businessmanId, found: !!vehicle })
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('tire', body, vehicle.currentOdometer)
    if (errors.length > 0) {
      console.log('📤 Validation errors:', errors)
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    console.log('📤 Creating tire:', body)
    
    const tire = await Tire.create({
      ...body,
      vehicle: vehicleId,
      businessman: businessmanId
    })
    
    console.log('✅ Tire created:', tire._id)
    
    // Shu pozitsiyadagi eski shina alertini o'chirish
    if (body.position) {
      await VehicleAlert.deleteMany({ 
        vehicle: vehicleId, 
        type: 'tire', 
        isResolved: false,
        message: { $regex: body.position, $options: 'i' }
      })
    }
    
    res.status(201).json({ success: true, data: tire })
  } catch (err) {
    console.error('❌ Tire POST error:', err.message, err.stack)
    res.status(500).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined })
  }
})

// Barcha shinalarni qo'shish (to'liq almashtirish)
router.post('/vehicles/:vehicleId/tires/bulk', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, count, ...body } = req.body
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('tire', body, vehicle.currentOdometer)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    if (!count || Number(count) <= 0) {
      return res.status(400).json({ success: false, message: 'Shinalar soni majburiy' })
    }
    
    // Pozitsiyalar ro'yxati
    const positions = ['front_left', 'front_right', 'rear_left_1', 'rear_left_2', 'rear_right_1', 'rear_right_2', 'rear_left_3', 'rear_right_3']
    const selectedPositions = positions.slice(0, Number(count))
    
    // Eski shinalarni replaced qilish
    await Tire.updateMany(
      { vehicle: vehicleId, status: { $ne: 'replaced' } },
      { status: 'replaced', replacedDate: new Date(), replacedOdometer: vehicle.currentOdometer }
    )
    
    // Yangi shinalarni qo'shish
    const tires = await Tire.insertMany(
      selectedPositions.map(position => ({
        ...body,
        position,
        vehicle: vehicleId,
        businessman: businessmanId
      }))
    )
    
    // Barcha shina alertlarini o'chirish
    await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'tire', isResolved: false })
    
    res.status(201).json({ success: true, data: tires, message: `${tires.length} ta shina qo'shildi` })
  } catch (err) {
    console.error('❌ Bulk tire POST error:', err.message)
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
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    const services = await ServiceLog.find({ vehicle: vehicleId })
      .select('type date odometer cost description serviceName')
      .sort({ date: -1 })
      .limit(100)
      .lean()
    
    const stats = {
      totalServices: services.length,
      totalCost: services.reduce((sum, s) => sum + (s.cost || 0), 0),
      lastService: services[0] || null
    }
    
    res.json({ success: true, data: { services, stats } })
  } catch (err) {
    console.error('❌ Services GET error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xizmat qo'shish
router.post('/vehicles/:vehicleId/services', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, ...body } = req.body
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('service', body, vehicle.currentOdometer)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    const service = await ServiceLog.create({
      ...body,
      vehicle: vehicleId,
      businessman: businessmanId
    })
    
    // Mashina odometrini yangilash (faqat kattaroq bo'lsa)
    if (body.odometer && body.odometer > (vehicle.currentOdometer || 0)) {
      await Vehicle.findByIdAndUpdate(vehicleId, { 
        currentOdometer: body.odometer,
        lastServiceDate: body.date || new Date()
      })
    }
    
    // Texnik xizmat alertini o'chirish
    await VehicleAlert.deleteMany({ vehicle: vehicleId, type: 'service', isResolved: false })
    
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
    const businessmanId = getBusinessmanId(req)
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    const query = { vehicle: vehicleId }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }
    
    const incomes = await VehicleIncome.find(query)
      .select('type date amount fromCity toCity distance cargoWeight clientName description')
      .sort({ date: -1 })
      .limit(200)
      .lean()
    
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
    console.error('❌ Income GET error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/vehicles/:vehicleId/income', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const businessmanId = getBusinessmanId(req)
    const { _id, ...body } = req.body
    
    // Ownership tekshirish
    const vehicle = await checkVehicleOwnership(vehicleId, businessmanId)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Ijara uchun amount ni avtomatik hisoblash
    if (body.type === 'rental' && body.rentalDays && body.rentalRate) {
      body.amount = Number(body.rentalDays) * Number(body.rentalRate)
    }
    
    // Validatsiya
    const errors = validateMaintenanceData('income', body)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }
    
    const income = await VehicleIncome.create({
      ...body,
      vehicle: vehicleId,
      businessman: businessmanId
    })
    
    // Mashina totalIncome ni yangilash
    await Vehicle.findByIdAndUpdate(vehicleId, {
      $inc: { totalIncome: body.amount || 0 }
    })
    
    res.status(201).json({ success: true, data: income })
  } catch (err) {
    console.error('❌ Income POST error:', err.message)
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

// ============ ANALYTICS (TAHLIL) - OPTIMIZED ============
router.get('/vehicles/:vehicleId/analytics', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params
    const { period = '30' } = req.query
    const businessmanId = getBusinessmanId(req)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))
    
    // Mashina va ownership tekshiruvi
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId, 
      user: businessmanId 
    }).select('_id plateNumber brand model currentOdometer purchasePrice oilChangeIntervalKm expectedFuelConsumption fuelType').lean()
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' })
    }
    
    // Optimallashtirilgan parallel so'rovlar - faqat kerakli fieldlar
    const [fuelRefills, oilChanges, tires, services, incomes, otherExpenses, alerts] = await Promise.all([
      // Yoqilg'i - period ichida
      FuelRefill.find({ vehicle: vehicleId, date: { $gte: startDate } })
        .select('date liters cost odometer fuelConsumption')
        .sort({ date: -1 }).lean(),
      // Moy - period ichida + oxirgi 1 ta (holat uchun)
      OilChange.find({ vehicle: vehicleId, date: { $gte: startDate } })
        .select('date cost odometer nextChangeOdometer oilType')
        .sort({ date: -1 }).lean(),
      // Shinalar - period ichida o'rnatilganlar
      Tire.find({ vehicle: vehicleId, installDate: { $gte: startDate }, status: { $ne: 'replaced' } })
        .select('position cost installDate installOdometer expectedLifeKm')
        .lean(),
      // Xizmatlar - period ichida
      ServiceLog.find({ vehicle: vehicleId, date: { $gte: startDate } })
        .select('date cost type')
        .lean(),
      // Daromadlar - period ichida
      VehicleIncome.find({ vehicle: vehicleId, date: { $gte: startDate } })
        .select('date amount type')
        .lean(),
      // Boshqa xarajatlar - period ichida
      OtherExpense.find({ vehicle: vehicleId, date: { $gte: startDate } })
        .select('date amount type')
        .lean(),
      // Alertlar - faqat hal qilinmaganlar
      VehicleAlert.find({ vehicle: vehicleId, isResolved: false })
        .select('type severity message')
        .limit(10).lean()
    ])
    
    // Moy holati uchun oxirgi almashtirishni olish (agar period ichida yo'q bo'lsa)
    let lastOilChange = oilChanges[0]
    if (!lastOilChange) {
      lastOilChange = await OilChange.findOne({ vehicle: vehicleId })
        .select('date odometer nextChangeOdometer oilType')
        .sort({ date: -1 }).lean()
    }
    
    // Shina holati uchun barcha aktiv shinalarni olish
    const allActiveTires = await Tire.find({ vehicle: vehicleId, status: { $ne: 'replaced' } })
      .select('position installOdometer expectedLifeKm installDate')
      .lean()
    
    // === XARAJATLAR - TO'G'RI HISOBLASH ===
    const fuelCost = fuelRefills.reduce((sum, r) => sum + (r.cost || 0), 0)
    const oilCost = oilChanges.reduce((sum, o) => sum + (o.cost || 0), 0)
    const tireCost = tires.reduce((sum, t) => sum + (t.cost || 0), 0)
    const serviceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
    const otherCost = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalExpenses = fuelCost + oilCost + tireCost + serviceCost + otherCost
    
    // === DAROMAD ===
    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)
    
    // === SOF FOYDA ===
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0
    
    // === YOQILG'I SAMARADORLIGI - TO'G'RI HISOBLASH ===
    let fuelEfficiency = { avgConsumption: 0, trend: 'stable', totalLiters: 0, totalKm: 0, kmPerCubicMeter: 0 }
    if (fuelRefills.length >= 2) {
      // Odometr bo'yicha tartiblash (kichikdan kattaga)
      const sortedRefills = [...fuelRefills].filter(r => r.odometer && r.odometer > 0).sort((a, b) => (a.odometer || 0) - (b.odometer || 0))
      
      if (sortedRefills.length >= 2) {
        let totalKm = 0
        let totalLiters = 0
        
        // Har bir ketma-ket juftlik uchun sarfni hisoblash
        for (let i = 1; i < sortedRefills.length; i++) {
          const prevOdo = sortedRefills[i - 1].odometer
          const currOdo = sortedRefills[i].odometer
          const currLiters = sortedRefills[i].liters || 0
          
          const kmDiff = currOdo - prevOdo
          if (kmDiff > 0 && currLiters > 0) {
            totalKm += kmDiff
            totalLiters += currLiters
          }
        }
        
        fuelEfficiency.totalLiters = totalLiters
        fuelEfficiency.totalKm = totalKm
        
        if (totalKm > 0 && totalLiters > 0) {
          fuelEfficiency.avgConsumption = Math.round((totalLiters / totalKm) * 100 * 10) / 10
          // Metan uchun 1 kub metrda necha km
          if (vehicle.fuelType === 'metan' || vehicle.fuelType === 'gas') {
            fuelEfficiency.kmPerCubicMeter = Math.round(totalKm / totalLiters * 10) / 10
          }
          
          // Trend
          if (sortedRefills.length >= 6) {
            const recent = sortedRefills.slice(-3)
            const older = sortedRefills.slice(-6, -3)
            const recentAvg = recent.reduce((s, r) => s + (r.fuelConsumption || 0), 0) / 3
            const olderAvg = older.reduce((s, r) => s + (r.fuelConsumption || 0), 0) / 3
            if (olderAvg > 0) {
              if (recentAvg > olderAvg * 1.1) fuelEfficiency.trend = 'increasing'
              else if (recentAvg < olderAvg * 0.9) fuelEfficiency.trend = 'decreasing'
            }
          }
        }
      }
    }
    
    // === MOY HOLATI ===
    const oilInterval = vehicle.oilChangeIntervalKm || 15000
    let oilStatus = { status: 'ok', remainingKm: oilInterval, nextChangeOdometer: 0 }
    if (lastOilChange) {
      const nextOdo = lastOilChange.nextChangeOdometer || (lastOilChange.odometer + oilInterval)
      oilStatus.nextChangeOdometer = nextOdo
      oilStatus.remainingKm = nextOdo - (vehicle.currentOdometer || 0)
      if (oilStatus.remainingKm <= 0) oilStatus.status = 'overdue'
      else if (oilStatus.remainingKm <= 1000) oilStatus.status = 'critical'
      else if (oilStatus.remainingKm <= 2000) oilStatus.status = 'warning'
    }
    
    // === SHINA HOLATI ===
    const currentOdo = vehicle.currentOdometer || 0
    const tiresStatus = allActiveTires.map(t => {
      const usedKm = Math.max(0, currentOdo - (t.installOdometer || 0))
      const expectedLife = t.expectedLifeKm || 80000
      const remainingKm = Math.max(0, expectedLife - usedKm)
      const wearPercent = Math.min(100, Math.round((usedKm / expectedLife) * 100))
      
      // Vaqt bo'yicha eskirish (5 yil = 100%)
      const installDate = new Date(t.installDate)
      const ageYears = (Date.now() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      const ageWearPercent = Math.min(100, Math.round((ageYears / 5) * 100))
      
      // Eng katta eskirishni olish
      const finalWearPercent = Math.max(wearPercent, ageWearPercent)
      
      let status = 'good'
      if (finalWearPercent >= 90) status = 'critical'
      else if (finalWearPercent >= 75) status = 'warning'
      
      return { position: t.position, usedKm, remainingKm, wearPercent: finalWearPercent, calculatedStatus: status }
    })
    const worstTire = tiresStatus.reduce((worst, t) => 
      (!worst || t.wearPercent > worst.wearPercent) ? t : worst, null)
    
    // === OGOHLANTIRISHLAR ===
    const newAlerts = []
    
    if (oilStatus.status === 'overdue') {
      newAlerts.push({ type: 'oil', severity: 'danger', message: 'Moy almashtirish muddati o\'tdi!' })
    } else if (oilStatus.status === 'critical') {
      newAlerts.push({ type: 'oil', severity: 'warning', message: `Moy almashtirishga ${oilStatus.remainingKm} km qoldi` })
    }
    
    // Barcha eskirgan shinalar uchun alert
    tiresStatus.forEach(tire => {
      if (tire.wearPercent >= 90) {
        newAlerts.push({ type: 'tire', severity: 'danger', message: `${tire.position} shina ${tire.wearPercent}% eskirgan - almashtirish kerak!` })
      } else if (tire.wearPercent >= 75) {
        newAlerts.push({ type: 'tire', severity: 'warning', message: `${tire.position} shinaga ${tire.remainingKm} km qoldi` })
      }
    })
    
    const expectedConsumption = vehicle.expectedFuelConsumption || 25
    if (fuelEfficiency.avgConsumption > 0 && fuelEfficiency.avgConsumption > expectedConsumption * 1.2) {
      newAlerts.push({ type: 'fuel', severity: 'warning', message: `Yoqilg'i sarfi normaldan ${Math.round((fuelEfficiency.avgConsumption / expectedConsumption - 1) * 100)}% yuqori` })
    }
    
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
    
    // === YANGI: MOLIYAVIY INSIGHTS ===
    const periodDays = parseInt(period)
    const insights = {}
    
    // 1 km narxi (yoqilg'i + moy + shina + xizmat)
    if (fuelEfficiency.totalKm > 0) {
      insights.costPerKm = totalExpenses / fuelEfficiency.totalKm
    }
    
    // 1 litr/kubda necha km
    if (fuelEfficiency.totalLiters > 0 && fuelEfficiency.totalKm > 0) {
      if (vehicle.fuelType === 'metan' || vehicle.fuelType === 'gas') {
        fuelEfficiency.kmPerCubicMeter = Math.round(fuelEfficiency.totalKm / fuelEfficiency.totalLiters * 10) / 10
      } else {
        fuelEfficiency.kmPerLiter = Math.round(fuelEfficiency.totalKm / fuelEfficiency.totalLiters * 10) / 10
      }
    }
    
    // Kunlik o'rtacha xarajat
    if (periodDays > 0) {
      insights.dailyExpense = totalExpenses / periodDays
    }
    
    // O'rtacha yoqilg'i narxi
    if (fuelRefills.length > 0 && fuelEfficiency.totalLiters > 0) {
      insights.avgFuelPrice = fuelCost / fuelEfficiency.totalLiters
    }
    
    // Break-even (o'zini qoplash) - qancha oy qoldi
    if (purchasePrice > 0 && netProfit > 0) {
      // Jami qaytgan pul (barcha vaqt uchun)
      const allTimeIncome = await VehicleIncome.aggregate([
        { $match: { vehicle: vehicle._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
      const allTimeExpenses = await Promise.all([
        FuelRefill.aggregate([{ $match: { vehicle: vehicle._id } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
        OilChange.aggregate([{ $match: { vehicle: vehicle._id } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
        ServiceLog.aggregate([{ $match: { vehicle: vehicle._id } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
        OtherExpense.aggregate([{ $match: { vehicle: vehicle._id } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
      ])
      
      const totalEarned = (allTimeIncome[0]?.total || 0) - 
        (allTimeExpenses[0][0]?.total || 0) - 
        (allTimeExpenses[1][0]?.total || 0) - 
        (allTimeExpenses[2][0]?.total || 0) - 
        (allTimeExpenses[3][0]?.total || 0)
      
      insights.totalEarned = Math.max(0, totalEarned)
      insights.roiPercent = Math.round((totalEarned / purchasePrice) * 100)
      
      // Qolgan oylar
      const remaining = purchasePrice - totalEarned
      if (remaining > 0 && netProfit > 0) {
        const monthlyProfit = (netProfit / periodDays) * 30
        insights.breakEvenMonths = Math.ceil(remaining / monthlyProfit)
      } else if (remaining <= 0) {
        insights.breakEvenMonths = 0 // Allaqachon qoplangan
      }
    }
    
    // Moy almashtirish taxminiy vaqti (kunlarda)
    if (oilStatus.remainingKm > 0 && fuelEfficiency.totalKm > 0) {
      const dailyKm = fuelEfficiency.totalKm / periodDays
      if (dailyKm > 0) {
        insights.oilChangeInDays = Math.ceil(oilStatus.remainingKm / dailyKm)
      }
    }
    
    // Shina almashtirish taxminiy vaqti
    if (worstTire && worstTire.remainingKm > 0 && fuelEfficiency.totalKm > 0) {
      const dailyKm = fuelEfficiency.totalKm / periodDays
      if (dailyKm > 0) {
        insights.tireChangeInDays = Math.ceil(worstTire.remainingKm / dailyKm)
      }
    }
    
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
        insights,
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
      const currentOdo = vehicle.currentOdometer || 0
      
      // 1. Moy almashtirish tekshiruvi
      const lastOil = oilChanges.find(o => o.vehicle.toString() === vId)
      if (lastOil) {
        const oilInterval = vehicle.oilChangeIntervalKm || 10000
        const nextOilKm = lastOil.nextChangeOdometer || ((lastOil.odometer || 0) + oilInterval)
        const kmLeft = nextOilKm - currentOdo
        
        if (kmLeft <= 2000) {
          alerts.push({
            type: 'oil',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: kmLeft <= 0 
              ? `Moy almashtirish kerak! ${Math.abs(kmLeft).toLocaleString()} km o'tib ketdi` 
              : `Moy almashtirishga ${kmLeft.toLocaleString()} km qoldi`,
            severity: kmLeft <= 0 ? 'danger' : 'warning',
            threshold: kmLeft
          })
        }
      }
      
      // 2. Shina tekshiruvi
      const vTires = tires.filter(t => t.vehicle.toString() === vId)
      for (const tire of vTires) {
        const installOdo = tire.installOdometer || 0
        const expectedLife = tire.expectedLifeKm || 80000
        const kmUsed = currentOdo - installOdo
        const kmLeft = expectedLife - kmUsed
        
        if (kmLeft <= 10000) {
          alerts.push({
            type: 'tire',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: kmLeft <= 0 
              ? `${tire.position} shina almashtirish kerak!` 
              : `${tire.position} shinaga ${kmLeft.toLocaleString()} km qoldi`,
            severity: kmLeft <= 0 ? 'danger' : 'warning',
            threshold: kmLeft
          })
        }
      }
      
      // 3. Texnik xizmat (oxirgi xizmatdan 6 oy o'tgan bo'lsa)
      const lastService = services.find(s => s.vehicle.toString() === vId)
      if (lastService) {
        const daysSinceService = Math.floor((today - new Date(lastService.date)) / (1000 * 60 * 60 * 24))
        const serviceInterval = vehicle.serviceIntervalKm || 30000
        const nextServiceKm = (lastService.odometer || 0) + serviceInterval
        const kmLeft = nextServiceKm - currentOdo
        
        if (daysSinceService >= 180 || kmLeft <= 3000) {
          alerts.push({
            type: 'service',
            vehicleId: vehicle._id,
            plateNumber: vehicle.plateNumber,
            message: kmLeft <= 0 
              ? `Texnik xizmat kerak! ${Math.abs(kmLeft).toLocaleString()} km o'tib ketdi`
              : daysSinceService >= 180 
                ? `Texnik xizmat kerak! ${daysSinceService} kun o'tdi`
                : `Texnik xizmatga ${kmLeft.toLocaleString()} km qoldi`,
            severity: (kmLeft <= 0 || daysSinceService >= 365) ? 'danger' : 'warning',
            threshold: kmLeft
          })
        }
      } else if (currentOdo > 15000) {
        // Hech qachon xizmat ko'rsatilmagan va 15000 km dan oshgan
        alerts.push({
          type: 'service',
          vehicleId: vehicle._id,
          plateNumber: vehicle.plateNumber,
          message: `Texnik xizmat kerak! ${currentOdo.toLocaleString()} km yurildi`,
          severity: currentOdo > 30000 ? 'danger' : 'warning',
          threshold: 0
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
