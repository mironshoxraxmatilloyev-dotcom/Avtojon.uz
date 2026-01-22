const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function migrateAllDriverOwes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Barcha yopilgan reyslarni topish
    const completedFlights = await Flight.find({ 
      status: 'completed',
      netProfit: { $exists: true, $gt: 0 }
    }).populate('driver');

    console.log(`\n📊 ${completedFlights.length} ta yopilgan reys topildi`);

    let fixedCount = 0;
    let totalDifference = 0;

    console.log('\n🔄 Barcha reyslarni yangilash boshlandi...');

    for (let i = 0; i < completedFlights.length; i++) {
      const flight = completedFlights[i];
      const oldDriverOwes = flight.driverOwes || 0;
      const netProfit = flight.netProfit || 0;
      const businessProfit = flight.businessProfit || 0;
      const driverProfitAmount = flight.driverProfitAmount || 0;

      // YANGI TIZIM: driverOwes = sof foyda + hisobotlar qismi
      // Agar businessProfit yo'q bo'lsa, uni netProfit - driverProfitAmount deb hisoblaymiz
      let calculatedBusinessProfit = businessProfit;
      if (!businessProfit && netProfit > 0) {
        calculatedBusinessProfit = Math.max(0, netProfit - driverProfitAmount);
      }

      // Yangi driverOwes = sof foyda + biznesmen foydasi
      const newDriverOwes = netProfit + calculatedBusinessProfit;

      // Agar farq bor bo'lsa, yangilash
      if (Math.abs(newDriverOwes - oldDriverOwes) > 1000) { // 1000 so'm farq bo'lsa
        const difference = newDriverOwes - oldDriverOwes;
        totalDifference += difference;
        
        // Yangilash
        flight.driverOwes = newDriverOwes;
        if (!flight.businessProfit) {
          flight.businessProfit = calculatedBusinessProfit;
        }
        
        await flight.save();
        fixedCount++;

        // Har 10 ta reysda progress ko'rsatish
        if (fixedCount % 10 === 0) {
          console.log(`📈 ${fixedCount} ta reys yangilandi...`);
        }
      }
    }

    console.log(`\n🎉 MIGRATION YAKUNLANDI:`);
    console.log(`✅ ${fixedCount} ta reys yangilandi`);
    console.log(`💰 Jami farq: ${totalDifference.toLocaleString()} so'm`);

    // Endi haydovchilarning qarzlarini qayta hisoblash
    console.log('\n🔄 Haydovchilar qarzlarini qayta hisoblash...');
    
    const drivers = await Driver.find({});
    let updatedDrivers = 0;

    for (const driver of drivers) {
      const driverFlights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed',
        driverOwes: { $gt: 0 }
      });

      if (driverFlights.length === 0) continue;

      let totalOwes = 0;
      let totalPaid = 0;
      
      driverFlights.forEach(flight => {
        totalOwes += flight.driverOwes || 0;
        totalPaid += flight.driverPaidAmount || 0;
      });

      const remainingDebt = Math.max(0, totalOwes - totalPaid);

      // Agar qarz bor bo'lsa, previousDebt ni yangilash
      if (remainingDebt !== (driver.previousDebt || 0)) {
        driver.previousDebt = remainingDebt;
        await driver.save();
        updatedDrivers++;
      }
    }

    console.log(`✅ ${updatedDrivers} ta haydovchi qarzi yangilandi`);

    // Natijalarni ko'rsatish
    console.log('\n📊 YANGILANGAN HAYDOVCHILAR:');
    
    const topDebtors = await Driver.find({ 
      previousDebt: { $gt: 0 } 
    }).sort({ previousDebt: -1 }).limit(10);

    topDebtors.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.fullName}: ${driver.previousDebt.toLocaleString()} so'm qarz`);
    });

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Faqat production da ishlatish uchun tasdiqlash
console.log('⚠️  DIQQAT: Bu script barcha eski reyslarni yangilaydi!');
console.log('Davom etish uchun 5 soniya kuting...');

setTimeout(() => {
  migrateAllDriverOwes();
}, 5000);