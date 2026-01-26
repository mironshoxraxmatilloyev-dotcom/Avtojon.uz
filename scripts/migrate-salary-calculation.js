#!/usr/bin/env node

/**
 * Eski mashrutlarni yangi salary calculation logikasiga o'tkazish
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });
const mongoose = require('mongoose');

// Model pathlarini to'g'ri qilish
const Flight = require(path.join(__dirname, '../apps/api/src/models/Flight'));
const Driver = require(path.join(__dirname, '../apps/api/src/models/Driver'));

async function migrateSalaryCalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 MongoDB ga ulandi');

    // Barcha completed flightlarni olish - yo'l puli qo'shilgan mashrutlar
    const flights = await Flight.find({ 
      status: 'completed',
      totalGivenBudget: { $gt: 0 } // Yo'l puli berilgan mashrutlar
    });

    console.log(`📊 Jami ${flights.length} ta mashrut topildi`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const flight of flights) {
      try {
        console.log(`\n🔄 ${flight.name || flight._id} ni yangilash...`);
        
        const oldTotalIncome = flight.totalIncome;
        const oldDriverProfitAmount = flight.driverProfitAmount;
        const oldNetProfit = flight.netProfit;

        // Yangi hisoblash - faqat save() chaqirilganda pre-save hook ishlaydi
        await flight.save();

        console.log(`   Eski jami kirim: ${(oldTotalIncome || 0).toLocaleString()}`);
        console.log(`   Yangi jami kirim: ${(flight.totalIncome || 0).toLocaleString()}`);
        console.log(`   Eski shofyor ulushi: ${(oldDriverProfitAmount || 0).toLocaleString()}`);
        console.log(`   Yangi shofyor ulushi: ${(flight.driverProfitAmount || 0).toLocaleString()}`);
        console.log(`   Eski sof foyda: ${(oldNetProfit || 0).toLocaleString()}`);
        console.log(`   Yangi sof foyda: ${(flight.netProfit || 0).toLocaleString()}`);

        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Xatolik: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📈 NATIJALAR:');
    console.log(`   ✅ Yangilandi: ${updatedCount} ta`);
    console.log(`   ❌ Xatolik: ${errorCount} ta`);

    // Driver earnings ni ham yangilash kerak
    console.log('\n🔄 Driver earnings ni qayta hisoblash...');
    
    const drivers = await Driver.find({ isActive: true });
    
    for (const driver of drivers) {
      const driverFlights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed',
        driverProfitAmount: { $gt: 0 }
      });

      const totalEarnings = driverFlights.reduce((sum, f) => sum + (f.driverProfitAmount || 0), 0);
      
      console.log(`   ${driver.fullName}: ${totalEarnings.toLocaleString()} so'm`);
      
      driver.totalEarnings = totalEarnings;
      driver.pendingEarnings = totalEarnings; // Barcha earnings pending deb belgilaymiz
      await driver.save();
    }

    console.log('\n🎯 MIGRATION TUGADI!');
    console.log('   Endi yo\'l puli shofyor oyligiga ta\'sir qilmaydi');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB dan uzildi');
  }
}

migrateSalaryCalculation();