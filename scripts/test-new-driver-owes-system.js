const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function testNewDriverOwesSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Test uchun haydovchi topish
    const driver = await Driver.findOne({ fullName: /baxtiyor/i });
    if (!driver) {
      console.log('❌ Test haydovchi topilmadi');
      return;
    }

    console.log('\n🔍 YANGI TIZIM TESTI');
    console.log('Haydovchi:', driver.fullName);
    console.log('Avvalgi qarz:', driver.previousDebt?.toLocaleString() || 0, 'so\'m');
    console.log('Qo\'lidagi pul:', driver.currentBalance?.toLocaleString() || 0, 'so\'m');

    // Haydovchining oxirgi reysini topish
    const lastFlight = await Flight.findOne({ 
      driver: driver._id, 
      status: 'completed' 
    }).sort({ createdAt: -1 }).populate('driver');

    if (!lastFlight) {
      console.log('❌ Yopilgan reys topilmadi');
      return;
    }

    console.log('\n📊 OXIRGI REYS MA\'LUMOTLARI:');
    console.log('Reys ID:', lastFlight._id);
    console.log('Yo\'nalish:', lastFlight.fromCity, '→', lastFlight.toCity);
    console.log('Jami kirim:', lastFlight.totalIncome?.toLocaleString() || 0, 'so\'m');
    console.log('Jami xarajat:', lastFlight.totalExpenses?.toLocaleString() || 0, 'so\'m');
    console.log('Sof foyda:', lastFlight.netProfit?.toLocaleString() || 0, 'so\'m');
    console.log('Haydovchi ulushi:', lastFlight.driverProfitAmount?.toLocaleString() || 0, 'so\'m');
    console.log('Biznesmen foydasi:', lastFlight.businessProfit?.toLocaleString() || 0, 'so\'m');

    console.log('\n💰 HAYDOVCHI BERISHI KERAK:');
    console.log('Joriy reys (driverOwes):', lastFlight.driverOwes?.toLocaleString() || 0, 'so\'m');
    console.log('Avvalgi qarz:', lastFlight.driver?.previousDebt?.toLocaleString() || 0, 'so\'m');
    console.log('JAMI berishi kerak:', lastFlight.totalDriverOwes?.toLocaleString() || 0, 'so\'m');

    console.log('\n📋 TO\'LOV HOLATI:');
    console.log('To\'lov statusi:', lastFlight.driverPaymentStatus || 'pending');
    console.log('To\'langan summa:', lastFlight.driverPaidAmount?.toLocaleString() || 0, 'so\'m');
    console.log('Qolgan qarz:', lastFlight.driverRemainingDebt?.toLocaleString() || 0, 'so\'m');

    // Yangi tizim bo'yicha hisoblash
    const netProfit = lastFlight.netProfit || 0;
    const businessProfit = lastFlight.businessProfit || 0;
    const expectedDriverOwes = netProfit + businessProfit; // Sof foyda + hisobotlar qismi
    
    console.log('\n🧮 YANGI TIZIM BO\'YICHA HISOBLASH:');
    console.log('Sof foyda (haydovchi ulushi):', netProfit.toLocaleString(), 'so\'m');
    console.log('Hisobotlar qismi (biznesmen ulushi):', businessProfit.toLocaleString(), 'so\'m');
    console.log('Kutilayotgan driverOwes:', expectedDriverOwes.toLocaleString(), 'so\'m');
    console.log('Hozirgi driverOwes:', (lastFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    
    if (expectedDriverOwes !== (lastFlight.driverOwes || 0)) {
      console.log('⚠️  FARQ BOR! Yangi tizim bo\'yicha qayta hisoblash kerak');
    } else {
      console.log('✅ Hisoblash to\'g\'ri');
    }

    // Misol: Yangi reys ochilganda qanday ko'rsatilishi kerak
    console.log('\n🚀 YANGI REYS OCHILGANDA:');
    console.log('Haydovchining qo\'lidagi pul:', driver.currentBalance?.toLocaleString() || 0, 'so\'m');
    console.log('Avvalgi qarz:', driver.previousDebt?.toLocaleString() || 0, 'so\'m');
    
    // Misol: 5M sof foyda bo'lganda
    const newNetProfit = 5000000;
    const newBusinessProfit = newNetProfit - (newNetProfit * 0.1); // 10% haydovchi ulushi
    const newDriverOwes = newNetProfit + newBusinessProfit;
    const totalOwesWithPrevious = newDriverOwes + (driver.previousDebt || 0);
    
    console.log('\n📈 YANGI REYS MISOLI (5M sof foyda):');
    console.log('Yangi sof foyda:', newNetProfit.toLocaleString(), 'so\'m');
    console.log('Yangi biznesmen foydasi:', newBusinessProfit.toLocaleString(), 'so\'m');
    console.log('Yangi reys uchun berishi kerak:', newDriverOwes.toLocaleString(), 'so\'m');
    console.log('Avvalgi qarz bilan jami:', totalOwesWithPrevious.toLocaleString(), 'so\'m');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testNewDriverOwesSystem();