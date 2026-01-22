const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function fixOldDriverOwes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Barcha yopilgan reyslarni topish
    const completedFlights = await Flight.find({ 
      status: 'completed',
      netProfit: { $exists: true, $gt: 0 }
    }).populate('driver').sort({ createdAt: -1 }).limit(10);

    console.log(`\n📊 ${completedFlights.length} ta yopilgan reys topildi`);

    let fixedCount = 0;

    for (const flight of completedFlights) {
      const oldDriverOwes = flight.driverOwes || 0;
      const netProfit = flight.netProfit || 0;
      const businessProfit = flight.businessProfit || 0;
      const driverProfitAmount = flight.driverProfitAmount || 0;

      // YANGI TIZIM: driverOwes = sof foyda + hisobotlar qismi
      // Agar businessProfit yo'q bo'lsa, uni netProfit - driverProfitAmount deb hisoblaymiz
      let calculatedBusinessProfit = businessProfit;
      if (!businessProfit && netProfit > 0) {
        calculatedBusinessProfit = netProfit - driverProfitAmount;
      }

      // Yangi driverOwes = sof foyda + biznesmen foydasi
      const newDriverOwes = netProfit + calculatedBusinessProfit;

      console.log(`\n🔍 REYS: ${flight._id}`);
      console.log(`Haydovchi: ${flight.driver?.fullName || 'Noma\'lum'}`);
      console.log(`Yo'nalish: ${flight.fromCity} → ${flight.toCity}`);
      console.log(`Sof foyda: ${netProfit.toLocaleString()} so'm`);
      console.log(`Biznesmen foydasi: ${calculatedBusinessProfit.toLocaleString()} so'm`);
      console.log(`Eski driverOwes: ${oldDriverOwes.toLocaleString()} so'm`);
      console.log(`Yangi driverOwes: ${newDriverOwes.toLocaleString()} so'm`);

      // Agar farq bor bo'lsa, yangilash
      if (Math.abs(newDriverOwes - oldDriverOwes) > 1000) { // 1000 so'm farq bo'lsa
        console.log(`⚠️  FARQ: ${(newDriverOwes - oldDriverOwes).toLocaleString()} so'm`);
        
        // Yangilash
        flight.driverOwes = newDriverOwes;
        if (!flight.businessProfit) {
          flight.businessProfit = calculatedBusinessProfit;
        }
        
        await flight.save();
        fixedCount++;
        console.log(`✅ Yangilandi`);
      } else {
        console.log(`✅ To'g'ri`);
      }
    }

    console.log(`\n🎉 NATIJA: ${fixedCount} ta reys yangilandi`);

    // Endi bir nechta haydovchining jami qarzini ko'ramiz
    console.log('\n📋 HAYDOVCHILAR QARZLARI:');
    
    const drivers = await Driver.find({}).limit(5);
    for (const driver of drivers) {
      const driverFlights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed',
        driverOwes: { $gt: 0 }
      });

      let totalOwes = 0;
      let totalPaid = 0;
      
      driverFlights.forEach(flight => {
        totalOwes += flight.driverOwes || 0;
        totalPaid += flight.driverPaidAmount || 0;
      });

      const remainingDebt = totalOwes - totalPaid;

      console.log(`\n👤 ${driver.fullName}:`);
      console.log(`  Jami berishi kerak: ${totalOwes.toLocaleString()} so'm`);
      console.log(`  To'lagan: ${totalPaid.toLocaleString()} so'm`);
      console.log(`  Qolgan qarz: ${remainingDebt.toLocaleString()} so'm`);
      console.log(`  Avvalgi qarz (DB): ${(driver.previousDebt || 0).toLocaleString()} so'm`);
      console.log(`  Qo'lidagi pul: ${(driver.currentBalance || 0).toLocaleString()} so'm`);
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixOldDriverOwes();