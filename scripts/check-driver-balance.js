require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function checkDriverBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Haydovchini topish (Dima)
    const driver = await Driver.findOne({ fullName: /Dima/i });
    
    if (!driver) {
      console.log('❌ Haydovchi topilmadi');
      return;
    }

    console.log('👤 Haydovchi:', driver.fullName);
    console.log('💰 Hozirgi balans:', driver.currentBalance?.toLocaleString(), 'so\'m\n');

    // Haydovchining barcha reyslarini topish
    const flights = await Flight.find({ 
      driver: driver._id,
      status: 'completed'
    }).sort({ completedAt: 1 });

    console.log('📊 Yopilgan reyslar:', flights.length, 'ta\n');

    let calculatedBalance = 0;

    flights.forEach((flight, index) => {
      const previousBalance = flight.previousBalance || 0;
      const netProfit = flight.netProfit || 0;
      const driverProfitAmount = flight.driverProfitAmount || 0;
      const driverOwes = flight.driverOwes || 0;
      const driverPaidAmount = flight.driverPaidAmount || 0;

      // Reys yopilganda haydovchida qolgan pul
      const balanceAfterFlight = previousBalance + netProfit - driverProfitAmount;
      
      // Haydovchi pul bergandan keyin
      const balanceAfterPayment = balanceAfterFlight - driverPaidAmount;

      console.log(`\n${index + 1}. ${flight.name}`);
      console.log('   Avvalgi qoldiq:', previousBalance.toLocaleString(), 'so\'m');
      console.log('   Sof foyda:', netProfit.toLocaleString(), 'so\'m');
      console.log('   Shofyor ulushi:', driverProfitAmount.toLocaleString(), 'so\'m');
      console.log('   Reys yopilganda balans:', balanceAfterFlight.toLocaleString(), 'so\'m');
      console.log('   Haydovchi berishi kerak:', driverOwes.toLocaleString(), 'so\'m');
      console.log('   Haydovchi bergan:', driverPaidAmount.toLocaleString(), 'so\'m');
      console.log('   Pul bergandan keyin balans:', balanceAfterPayment.toLocaleString(), 'so\'m');

      calculatedBalance = balanceAfterPayment;
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 XULOSA:');
    console.log('   Hisoblangan balans:', calculatedBalance.toLocaleString(), 'so\'m');
    console.log('   Hozirgi balans:', (driver.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('   Farq:', (calculatedBalance - (driver.currentBalance || 0)).toLocaleString(), 'so\'m');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDriverBalance();
