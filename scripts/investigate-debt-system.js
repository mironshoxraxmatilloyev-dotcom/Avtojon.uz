const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function investigateDebtSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 HISOBOTLAR QISMINI TAHLIL QILISH');
    console.log('=' .repeat(60));

    // 1. BARCHA HAYDOVCHILARNI OLISH
    const drivers = await Driver.find({}).lean();
    console.log(`\n📊 JAMI HAYDOVCHILAR: ${drivers.length} ta`);

    // 2. BARCHA REYSLARNI OLISH
    const flights = await Flight.find({}).lean();
    console.log(`📊 JAMI REYSLAR: ${flights.length} ta`);

    // 3. HISOBOTLAR QISMIDAGI LOGIKANI SIMULATSIYA QILISH
    console.log('\n🎯 HISOBOTLAR QISMIDAGI LOGIKA (/flights/driver-debts):');
    console.log('-'.repeat(50));

    // API endpoint logikasini takrorlash
    const filter = {
      status: { $in: ['completed', 'active'] }
    };

    const apiFlights = await Flight.find(filter)
      .populate('driver', 'fullName phone currentBalance previousDebt')
      .lean();

    console.log(`📋 API qaytaradigan reyslar: ${apiFlights.length} ta`);

    // Har bir reys uchun driverOwes ni hisoblash (API logikasi)
    const processedFlights = apiFlights.map(f => {
      const totalIncome = (f.totalPayment || 0) + (f.roadMoney || f.totalGivenBudget || 0);
      const lightExpenses = f.lightExpenses || 0;
      const netProfit = f.netProfit || (totalIncome - lightExpenses);
      const driverProfitAmount = f.driverProfitAmount || 0;

      let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
      if (calculatedDriverOwes === 0 && netProfit > 0) {
        calculatedDriverOwes = netProfit - driverProfitAmount;
      }

      return {
        _id: f._id,
        driver: f.driver,
        status: f.status,
        totalPayment: f.totalPayment || 0,
        totalGivenBudget: f.totalGivenBudget || 0,
        totalExpenses: f.totalExpenses || 0,
        netProfit: netProfit,
        driverProfitAmount: driverProfitAmount,
        driverOwes: calculatedDriverOwes,
        driverPaidAmount: f.driverPaidAmount || 0,
        driverPaymentStatus: f.driverPaymentStatus || 'pending'
      };
    });

    // Faqat driverOwes > 0 bo'lgan reyslar
    const debtFlights = processedFlights.filter(f => f.driverOwes > 0);
    console.log(`💰 Qarz bo'lgan reyslar: ${debtFlights.length} ta`);

    // Haydovchilar bo'yicha guruhlash
    const driverGroups = {};
    debtFlights.forEach(flight => {
      const driverId = flight.driver?._id?.toString() || 'unknown';
      if (!driverGroups[driverId]) {
        driverGroups[driverId] = {
          driver: flight.driver,
          flights: [],
          totalOwes: 0,
          totalPaid: 0
        };
      }
      driverGroups[driverId].flights.push(flight);
      driverGroups[driverId].totalOwes += flight.driverOwes;
      driverGroups[driverId].totalPaid += flight.driverPaidAmount;
    });

    console.log('\n👥 HAYDOVCHILAR BO\'YICHA QARZLAR:');
    console.log('=' .repeat(60));

    Object.values(driverGroups).forEach((group, index) => {
      const remaining = group.totalOwes - group.totalPaid;
      console.log(`\n${index + 1}. ${group.driver?.fullName || 'Noma\'lum'}:`);
      console.log(`   ID: ${group.driver?._id}`);
      console.log(`   Reyslar soni: ${group.flights.length} ta`);
      console.log(`   Jami berishi kerak: ${group.totalOwes.toLocaleString()} so'm`);
      console.log(`   To'langan: ${group.totalPaid.toLocaleString()} so'm`);
      console.log(`   Qolgan qarz: ${remaining.toLocaleString()} so'm`);
      console.log(`   previousDebt (DB): ${(group.driver?.previousDebt || 0).toLocaleString()} so'm`);
      console.log(`   currentBalance: ${(group.driver?.currentBalance || 0).toLocaleString()} so'm`);
      
      // MUHIM: Header da ko'rsatilishi kerak bo'lgan jami
      const totalForHeader = remaining + (group.driver?.previousDebt || 0);
      console.log(`   🎯 HEADER DA: ${totalForHeader.toLocaleString()} so'm`);
    });

    // 4. MUAMMO TAHLILI
    console.log('\n🚨 MUAMMO TAHLILI:');
    console.log('=' .repeat(60));

    const driversWithMissingDebt = Object.values(driverGroups).filter(group => {
      const remaining = group.totalOwes - group.totalPaid;
      const previousDebt = group.driver?.previousDebt || 0;
      return remaining > 0 && previousDebt === 0;
    });

    console.log(`❌ previousDebt = 0 bo'lgan haydovchilar: ${driversWithMissingDebt.length} ta`);
    
    driversWithMissingDebt.forEach((group, index) => {
      const remaining = group.totalOwes - group.totalPaid;
      console.log(`   ${index + 1}. ${group.driver?.fullName}: ${remaining.toLocaleString()} so'm qarz, lekin previousDebt = 0`);
    });

    // 5. YECHIM TAKLIFI
    console.log('\n💡 YECHIM TAKLIFI:');
    console.log('=' .repeat(60));
    console.log('1. Barcha haydovchilar uchun previousDebt ni to\'g\'rilash kerak');
    console.log('2. previousDebt = (jami driverOwes) - (jami to\'langan)');
    console.log('3. FlightHeader.jsx da totalDriverOwes = driverOwes + previousDebt');
    console.log('4. DriverDebts.jsx da ham previousDebt ni hisobga olish');

    // 6. AUTO-FIX TAKLIFI
    console.log('\n🔧 AUTO-FIX SCRIPT YARATISH:');
    let fixScript = '';
    driversWithMissingDebt.forEach(group => {
      const remaining = group.totalOwes - group.totalPaid;
      if (remaining > 0) {
        fixScript += `await Driver.findByIdAndUpdate('${group.driver._id}', { previousDebt: ${remaining} });\n`;
      }
    });

    if (fixScript) {
      console.log('Quyidagi script bilan to\'g\'rilash mumkin:');
      console.log(fixScript);
    } else {
      console.log('✅ Barcha haydovchilar uchun previousDebt to\'g\'ri');
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

investigateDebtSystem();