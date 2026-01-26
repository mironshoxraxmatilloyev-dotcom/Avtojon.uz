#!/usr/bin/env node

/**
 * Test: Yo'l puli shofyor oyligiga ta'sir qilmasligini tekshirish
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });
const mongoose = require('mongoose');

// Model pathlarini to'g'ri qilish
const Flight = require(path.join(__dirname, '../apps/api/src/models/Flight'));
const Driver = require(path.join(__dirname, '../apps/api/src/models/Driver'));

async function testSalaryWithoutRoadMoney() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 MongoDB ga ulandi');

    // Test ma'lumotlari
    const testData = {
      totalPayment: 5000000,      // Mijozdan olingan: 5,000,000 so'm
      totalGivenBudget: 2000000,  // Yo'l uchun berilgan: 2,000,000 so'm
      driverProfitPercent: 10,    // Shofyor foizi: 10%
      totalExpenses: 1500000,     // Xarajatlar: 1,500,000 so'm
      lightExpenses: 1500000      // Yengil xarajatlar: 1,500,000 so'm
    };

    console.log('\n📊 TEST MA\'LUMOTLARI:');
    console.log('   Mijozdan olingan:', testData.totalPayment.toLocaleString(), 'so\'m');
    console.log('   Yo\'l uchun berilgan:', testData.totalGivenBudget.toLocaleString(), 'so\'m');
    console.log('   Shofyor foizi:', testData.driverProfitPercent + '%');
    console.log('   Xarajatlar:', testData.totalExpenses.toLocaleString(), 'so\'m');

    // Test flight yaratish
    const testFlight = new Flight({
      user: new mongoose.Types.ObjectId(),
      driver: new mongoose.Types.ObjectId(),
      vehicle: new mongoose.Types.ObjectId(),
      status: 'completed',
      driverProfitPercent: testData.driverProfitPercent,
      legs: [{
        fromCity: 'Toshkent',
        toCity: 'Samarqand',
        payment: testData.totalPayment,
        paymentType: 'cash',
        givenBudget: testData.totalGivenBudget
      }],
      expenses: [{
        type: 'fuel',
        amount: testData.lightExpenses,
        amountInUZS: testData.lightExpenses,
        expenseClass: 'light'
      }]
    });

    // Pre-save hook ishga tushadi
    await testFlight.save(); // save() chaqirilganda pre-save hook ishlaydi
    
    console.log('\n🧮 HISOBLASH NATIJALARI:');
    console.log('   Jami kirim (totalIncome):', testFlight.totalIncome.toLocaleString(), 'so\'m');
    console.log('   Sof foyda (netProfit):', testFlight.netProfit.toLocaleString(), 'so\'m');
    console.log('   Shofyor ulushi (driverProfitAmount):', testFlight.driverProfitAmount.toLocaleString(), 'so\'m');
    console.log('   Biznesmen foydasi (businessProfit):', testFlight.businessProfit.toLocaleString(), 'so\'m');
    console.log('   Shofyor berishi kerak (driverOwes):', testFlight.driverOwes.toLocaleString(), 'so\'m');

    console.log('\n✅ TEKSHIRISH:');
    
    // 1. Jami kirim faqat mijozdan olingan bo'lishi kerak
    const expectedTotalIncome = testData.totalPayment;
    if (testFlight.totalIncome === expectedTotalIncome) {
      console.log('   ✅ Jami kirim to\'g\'ri: faqat mijozdan olingan pul');
    } else {
      console.log('   ❌ Jami kirim noto\'g\'ri:', testFlight.totalIncome, 'kutilgan:', expectedTotalIncome);
    }

    // 2. Shofyor ulushi faqat mijozdan olingan puldan hisoblanishi kerak
    const expectedDriverProfit = Math.round(testData.totalPayment * testData.driverProfitPercent / 100);
    if (testFlight.driverProfitAmount === expectedDriverProfit) {
      console.log('   ✅ Shofyor ulushi to\'g\'ri: faqat mijozdan olingan puldan');
    } else {
      console.log('   ❌ Shofyor ulushi noto\'g\'ri:', testFlight.driverProfitAmount, 'kutilgan:', expectedDriverProfit);
    }

    // 3. Sof foyda to'g'ri hisoblanishi kerak
    const expectedNetProfit = testData.totalPayment - testData.lightExpenses;
    if (testFlight.netProfit === expectedNetProfit) {
      console.log('   ✅ Sof foyda to\'g\'ri hisoblanadi');
    } else {
      console.log('   ❌ Sof foyda noto\'g\'ri:', testFlight.netProfit, 'kutilgan:', expectedNetProfit);
    }

    console.log('\n📈 ESKI vs YANGI TIZIM:');
    console.log('   ESKI tizim: Shofyor ulushi =', Math.round((testData.totalPayment + testData.totalGivenBudget) * testData.driverProfitPercent / 100).toLocaleString(), 'so\'m');
    console.log('   YANGI tizim: Shofyor ulushi =', testFlight.driverProfitAmount.toLocaleString(), 'so\'m');
    console.log('   Farq:', Math.round((testData.totalPayment + testData.totalGivenBudget) * testData.driverProfitPercent / 100) - testFlight.driverProfitAmount, 'so\'m kamroq');

    console.log('\n🎯 XULOSA:');
    console.log('   Yo\'l uchun berilgan pul endi shofyor oyligiga TA\'SIR QILMAYDI');
    console.log('   Shofyor ulushi faqat mijozdan olingan puldan hisoblanadi');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB dan uzildi');
  }
}

testSalaryWithoutRoadMoney();