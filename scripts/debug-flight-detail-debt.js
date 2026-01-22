const mongoose = require('mongoose');
require('dotenv').config({ path: '../api/.env' });

const Flight = require('../api/src/models/Flight');
const Driver = require('../api/src/models/Driver');

async function debugFlightDetailDebt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Buxoro - Jizzax marshrutini topish
    const flights = await Flight.find({
      $or: [
        { 'legs.fromCity': /buxoro/i, 'legs.toCity': /jizzax/i },
        { 'legs.fromCity': /jizzax/i, 'legs.toCity': /buxoro/i },
        { name: /buxoro.*jizzax/i },
        { name: /jizzax.*buxoro/i }
      ]
    })
    .populate('driver', 'fullName phone currentBalance previousDebt')
    .populate('vehicle', 'plateNumber brand')
    .sort({ createdAt: -1 })
    .limit(5);

    console.log(`\n🔍 TOPILGAN MARSHRUTLAR (${flights.length} ta):`);
    console.log('='.repeat(60));

    flights.forEach((flight, index) => {
      console.log(`\n${index + 1}. MARSHRUT: ${flight.name || 'Noma\'lum'}`);
      console.log(`   ID: ${flight._id}`);
      console.log(`   Status: ${flight.status}`);
      console.log(`   Haydovchi: ${flight.driver?.fullName || 'Noma\'lum'}`);
      console.log(`   Yaratilgan: ${flight.createdAt?.toLocaleDateString('uz-UZ')}`);
      
      // Legs ma'lumotlari
      if (flight.legs && flight.legs.length > 0) {
        console.log(`   Yo'nalishlar:`);
        flight.legs.forEach((leg, legIndex) => {
          console.log(`     ${legIndex + 1}. ${leg.fromCity} → ${leg.toCity} (${(leg.payment || 0).toLocaleString()} so'm)`);
        });
      }

      // Qarz ma'lumotlari
      console.log(`\n   💰 QARZ MA'LUMOTLARI:`);
      console.log(`   driverOwes (DB): ${(flight.driverOwes || 0).toLocaleString()} so'm`);
      console.log(`   driverPaidAmount (DB): ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
      console.log(`   businessProfit (DB): ${(flight.businessProfit || 0).toLocaleString()} so'm`);
      console.log(`   netProfit (DB): ${(flight.netProfit || 0).toLocaleString()} so'm`);
      console.log(`   driverProfitAmount (DB): ${(flight.driverProfitAmount || 0).toLocaleString()} so'm`);
      
      // Qolgan qarz hisoblash
      const remainingDebt = (flight.driverOwes || 0) - (flight.driverPaidAmount || 0);
      console.log(`   🎯 Qolgan qarz: ${remainingDebt.toLocaleString()} so'm`);
      
      // Haydovchi ma'lumotlari
      if (flight.driver) {
        console.log(`\n   👤 HAYDOVCHI MA'LUMOTLARI:`);
        console.log(`   currentBalance: ${(flight.driver.currentBalance || 0).toLocaleString()} so'm`);
        console.log(`   previousDebt: ${(flight.driver.previousDebt || 0).toLocaleString()} so'm`);
      }
    });

    // Agar bitta marshrut topilsa, batafsil ma'lumot
    if (flights.length === 1) {
      const flight = flights[0];
      console.log(`\n\n🔍 BATAFSIL TAHLIL - ${flight.name}:`);
      console.log('='.repeat(60));
      
      // Moliyaviy hisob-kitob
      const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0);
      const totalExpenses = flight.totalExpenses || 0;
      const lightExpenses = flight.lightExpenses || 0;
      const heavyExpenses = flight.heavyExpenses || 0;
      const netProfit = flight.netProfit || (totalIncome - totalExpenses);
      
      console.log(`\n💰 MOLIYAVIY HISOB-KITOB:`);
      console.log(`   Jami kirim: ${totalIncome.toLocaleString()} so'm`);
      console.log(`   Jami xarajat: ${totalExpenses.toLocaleString()} so'm`);
      console.log(`   - Yengil xarajat: ${lightExpenses.toLocaleString()} so'm`);
      console.log(`   - Katta xarajat: ${heavyExpenses.toLocaleString()} so'm`);
      console.log(`   Sof foyda: ${netProfit.toLocaleString()} so'm`);
      
      // Shofyor ulushi
      const driverProfitPercent = flight.driverProfitPercent || 0;
      const driverProfitAmount = flight.driverProfitAmount || 0;
      console.log(`\n👤 SHOFYOR ULUSHI:`);
      console.log(`   Foiz: ${driverProfitPercent}%`);
      console.log(`   Summa: ${driverProfitAmount.toLocaleString()} so'm`);
      
      // Biznesmen foydasi
      const businessProfit = flight.businessProfit || 0;
      console.log(`\n🏢 BIZNESMEN FOYDASI:`);
      console.log(`   businessProfit: ${businessProfit.toLocaleString()} so'm`);
      console.log(`   driverOwes: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
      
      // To'lov holati
      console.log(`\n💳 TO'LOV HOLATI:`);
      console.log(`   To'langan: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
      console.log(`   Qolgan: ${((flight.driverOwes || 0) - (flight.driverPaidAmount || 0)).toLocaleString()} so'm`);
      console.log(`   Status: ${flight.driverPaymentStatus || 'pending'}`);
    }

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugFlightDetailDebt();