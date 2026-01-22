const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function safeTestMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('🔍 XAVFSIZ TEST - HECH NARSA O\'ZGARTIRILMAYDI');
    console.log('Faqat nima o\'zgarishi kerakligini ko\'rsatamiz\n');

    // Faqat 5 ta reys bilan test
    const testFlights = await Flight.find({ 
      status: 'completed',
      netProfit: { $exists: true, $gt: 0 }
    }).populate('driver').limit(5);

    console.log(`📊 ${testFlights.length} ta reys bilan test:\n`);

    let totalDifference = 0;

    testFlights.forEach((flight, index) => {
      const oldDriverOwes = flight.driverOwes || 0;
      const netProfit = flight.netProfit || 0;
      const businessProfit = flight.businessProfit || 0;
      const driverProfitAmount = flight.driverProfitAmount || 0;

      // Yangi hisoblash
      let calculatedBusinessProfit = businessProfit;
      if (!businessProfit && netProfit > 0) {
        calculatedBusinessProfit = Math.max(0, netProfit - driverProfitAmount);
      }

      const newDriverOwes = netProfit + calculatedBusinessProfit;
      const difference = newDriverOwes - oldDriverOwes;
      totalDifference += difference;

      console.log(`${index + 1}. REYS ID: ${flight._id}`);
      console.log(`   Haydovchi: ${flight.driver?.fullName || 'Noma\'lum'}`);
      console.log(`   Sof foyda: ${netProfit.toLocaleString()} so'm`);
      console.log(`   Biznesmen foydasi: ${calculatedBusinessProfit.toLocaleString()} so'm`);
      console.log(`   ESKI driverOwes: ${oldDriverOwes.toLocaleString()} so'm`);
      console.log(`   YANGI driverOwes: ${newDriverOwes.toLocaleString()} so'm`);
      console.log(`   FARQ: ${difference.toLocaleString()} so'm`);
      
      if (Math.abs(difference) > 1000) {
        console.log(`   ⚠️  YANGILANISHI KERAK`);
      } else {
        console.log(`   ✅ TO'G'RI`);
      }
      console.log('');
    });

    console.log(`💰 JAMI FARQ: ${totalDifference.toLocaleString()} so'm`);
    console.log('\n🔒 BU FAQAT TEST - HECH NARSA O\'ZGARTIRILMADI');
    console.log('Agar natija to\'g\'ri bo\'lsa, asosiy scriptni ishlatishingiz mumkin');

    // Haydovchilar qarzini ham ko'rsatish
    console.log('\n👥 HAYDOVCHILAR HOLATI:');
    
    const drivers = await Driver.find({}).limit(3);
    for (const driver of drivers) {
      const driverFlights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed',
        driverOwes: { $gt: 0 }
      });

      let currentTotal = 0;
      let newTotal = 0;
      
      driverFlights.forEach(flight => {
        const oldOwes = flight.driverOwes || 0;
        const netProfit = flight.netProfit || 0;
        const businessProfit = flight.businessProfit || (netProfit - (flight.driverProfitAmount || 0));
        const newOwes = netProfit + Math.max(0, businessProfit);
        
        currentTotal += oldOwes;
        newTotal += newOwes;
      });

      console.log(`\n👤 ${driver.fullName}:`);
      console.log(`   Hozirgi jami qarz: ${currentTotal.toLocaleString()} so'm`);
      console.log(`   Yangi jami qarz: ${newTotal.toLocaleString()} so'm`);
      console.log(`   Farq: ${(newTotal - currentTotal).toLocaleString()} so'm`);
      console.log(`   Qo'lidagi pul: ${(driver.currentBalance || 0).toLocaleString()} so'm`);
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

safeTestMigration();