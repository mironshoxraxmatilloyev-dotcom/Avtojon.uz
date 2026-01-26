#!/usr/bin/env node

/**
 * Hozirgi tizimda shofyor oyligini tekshirish
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });
const mongoose = require('mongoose');

// Model pathlarini to'g'ri qilish
const Flight = require(path.join(__dirname, '../apps/api/src/models/Flight'));
const Driver = require(path.join(__dirname, '../apps/api/src/models/Driver'));

async function checkCurrentSalaryCalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 MongoDB ga ulandi');

    // Oxirgi 5 ta completed flight ni olish
    const flights = await Flight.find({ 
      status: 'completed',
      driverProfitPercent: { $gt: 0 }
    })
    .populate('driver', 'fullName')
    .sort({ completedAt: -1 })
    .limit(5)
    .lean();

    console.log('\n📊 OXIRGI 5 TA YOPILGAN MASHRUT:');
    console.log('=' .repeat(80));

    flights.forEach((flight, index) => {
      console.log(`\n${index + 1}. ${flight.name || 'Noma\'lum mashrut'}`);
      console.log(`   Shofyor: ${flight.driver?.fullName || 'Noma\'lum'}`);
      console.log(`   Mijozdan olingan: ${(flight.totalPayment || 0).toLocaleString()} so'm`);
      console.log(`   Yo'l uchun berilgan: ${(flight.totalGivenBudget || 0).toLocaleString()} so'm`);
      console.log(`   Jami kirim: ${(flight.totalIncome || 0).toLocaleString()} so'm`);
      console.log(`   Xarajatlar: ${(flight.totalExpenses || 0).toLocaleString()} so'm`);
      console.log(`   Sof foyda: ${(flight.netProfit || 0).toLocaleString()} so'm`);
      console.log(`   Shofyor foizi: ${flight.driverProfitPercent || 0}%`);
      console.log(`   Shofyor ulushi: ${(flight.driverProfitAmount || 0).toLocaleString()} so'm`);
      
      // Hisoblash tekshiruvi
      const expectedTotalIncome = flight.totalPayment || 0;
      const expectedDriverProfit = Math.round((flight.totalPayment || 0) * (flight.driverProfitPercent || 0) / 100);
      const expectedNetProfit = (flight.totalPayment || 0) - (flight.lightExpenses || 0);
      
      console.log('\n   🔍 TEKSHIRISH:');
      if (flight.totalIncome === expectedTotalIncome) {
        console.log('   ✅ Jami kirim to\'g\'ri');
      } else {
        console.log(`   ❌ Jami kirim noto'g'ri: ${flight.totalIncome} (kutilgan: ${expectedTotalIncome})`);
      }
      
      if (flight.driverProfitAmount === expectedDriverProfit) {
        console.log('   ✅ Shofyor ulushi to\'g\'ri');
      } else {
        console.log(`   ❌ Shofyor ulushi noto'g'ri: ${flight.driverProfitAmount} (kutilgan: ${expectedDriverProfit})`);
      }
      
      console.log('   -'.repeat(40));
    });

    console.log('\n🎯 XULOSA:');
    console.log('   Agar yuqorida ❌ belgilar ko\'rinsa, eski ma\'lumotlar yangilanmagan');
    console.log('   Yangi mashrutlar uchun yo\'l puli shofyor oyligiga ta\'sir qilmaydi');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB dan uzildi');
  }
}

checkCurrentSalaryCalculation();