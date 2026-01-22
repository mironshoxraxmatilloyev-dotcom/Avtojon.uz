const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function backupAndMigrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // 1. BACKUP YARATISH
    console.log('📦 Backup yaratilmoqda...');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      flights: [],
      drivers: []
    };

    // Barcha yopilgan reyslarni backup qilish
    const allFlights = await Flight.find({ 
      status: 'completed',
      netProfit: { $exists: true, $gt: 0 }
    }).lean();

    backupData.flights = allFlights.map(flight => ({
      _id: flight._id,
      driverOwes: flight.driverOwes,
      businessProfit: flight.businessProfit,
      netProfit: flight.netProfit,
      driverProfitAmount: flight.driverProfitAmount
    }));

    // Barcha haydovchilarni backup qilish
    const allDrivers = await Driver.find({}).lean();
    backupData.drivers = allDrivers.map(driver => ({
      _id: driver._id,
      fullName: driver.fullName,
      previousDebt: driver.previousDebt,
      currentBalance: driver.currentBalance
    }));

    // Backup faylga saqlash
    const backupFileName = `backup-driver-owes-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saqlandi: ${backupFileName}`);

    // 2. MIGRATION BOSHLASH
    console.log('\n🔄 Migration boshlandi...');
    
    let fixedFlights = 0;
    let totalDifference = 0;

    for (const flight of allFlights) {
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

      // Agar farq bor bo'lsa, yangilash
      if (Math.abs(newDriverOwes - oldDriverOwes) > 1000) {
        const difference = newDriverOwes - oldDriverOwes;
        totalDifference += difference;
        
        // Database da yangilash
        await Flight.findByIdAndUpdate(flight._id, {
          driverOwes: newDriverOwes,
          businessProfit: calculatedBusinessProfit
        });
        
        fixedFlights++;

        if (fixedFlights % 10 === 0) {
          console.log(`📈 ${fixedFlights} ta reys yangilandi...`);
        }
      }
    }

    // 3. HAYDOVCHILAR QARZINI YANGILASH
    console.log('\n👥 Haydovchilar qarzini yangilash...');
    
    let updatedDrivers = 0;
    
    for (const driver of allDrivers) {
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

      // Agar qarz o'zgargan bo'lsa, yangilash
      if (remainingDebt !== (driver.previousDebt || 0)) {
        await Driver.findByIdAndUpdate(driver._id, {
          previousDebt: remainingDebt
        });
        updatedDrivers++;
      }
    }

    // 4. NATIJALAR
    console.log('\n🎉 MIGRATION YAKUNLANDI:');
    console.log(`✅ ${fixedFlights} ta reys yangilandi`);
    console.log(`👥 ${updatedDrivers} ta haydovchi qarzi yangilandi`);
    console.log(`💰 Jami farq: ${totalDifference.toLocaleString()} so'm`);
    console.log(`📦 Backup fayl: ${backupFileName}`);

    // 5. RESTORE SCRIPT YARATISH
    const restoreScript = `
const mongoose = require('mongoose');
const fs = require('fs');
const Flight = require('./apps/api/src/models/Flight');
const Driver = require('./apps/api/src/models/Driver');

async function restore() {
  try {
    await mongoose.connect('${process.env.MONGODB_URI}');
    const backup = JSON.parse(fs.readFileSync('${backupFileName}', 'utf8'));
    
    console.log('Restoring flights...');
    for (const flight of backup.flights) {
      await Flight.findByIdAndUpdate(flight._id, {
        driverOwes: flight.driverOwes,
        businessProfit: flight.businessProfit
      });
    }
    
    console.log('Restoring drivers...');
    for (const driver of backup.drivers) {
      await Driver.findByIdAndUpdate(driver._id, {
        previousDebt: driver.previousDebt,
        currentBalance: driver.currentBalance
      });
    }
    
    console.log('✅ Restore completed');
  } catch (error) {
    console.error('❌ Restore error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

restore();
`;

    fs.writeFileSync(`restore-${Date.now()}.js`, restoreScript);
    console.log(`🔄 Restore script yaratildi: restore-${Date.now()}.js`);

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

console.log('⚠️  DIQQAT: Bu script backup yaratadi va keyin migration qiladi');
console.log('Backup fayl yaratiladi, agar muammo bo\'lsa, restore qilish mumkin');
console.log('Davom etish uchun 3 soniya kuting...');

setTimeout(() => {
  backupAndMigrate();
}, 3000);