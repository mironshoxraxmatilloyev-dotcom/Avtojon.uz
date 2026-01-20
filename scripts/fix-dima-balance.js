require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function fixDimaBalance() {
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
      driver: driver._id
    }).sort({ createdAt: 1 });

    console.log('📊 Barcha reyslar:', flights.length, 'ta\n');

    // Balansni qayta hisoblash
    let calculatedBalance = 0;

    for (let i = 0; i < flights.length; i++) {
      const flight = flights[i];
      
      if (flight.status === 'completed') {
        const previousBalance = i === 0 ? 0 : calculatedBalance;
        const netProfit = flight.netProfit || 0;
        const driverProfitAmount = flight.driverProfitAmount || 0;
        const driverPaidAmount = flight.driverPaidAmount || 0;

        // Reys yopilganda haydovchida qolgan pul
        const balanceAfterFlight = previousBalance + netProfit - driverProfitAmount;
        
        // Haydovchi pul bergandan keyin
        const balanceAfterPayment = balanceAfterFlight - driverPaidAmount;

        console.log(`${i + 1}. ${flight.name} (${flight.status})`);
        console.log('   Eski previousBalance:', (flight.previousBalance || 0).toLocaleString(), 'so\'m');
        console.log('   To\'g\'ri previousBalance:', previousBalance.toLocaleString(), 'so\'m');
        
        if (flight.previousBalance !== previousBalance) {
          console.log('   ⚠️  previousBalance noto\'g\'ri! Tuzatish kerak.');
          flight.previousBalance = previousBalance;
          await flight.save();
          console.log('   ✅ previousBalance tuzatildi');
        }

        calculatedBalance = balanceAfterPayment;
      } else if (flight.status === 'active') {
        console.log(`${i + 1}. ${flight.name} (${flight.status})`);
        console.log('   Eski previousBalance:', (flight.previousBalance || 0).toLocaleString(), 'so\'m');
        console.log('   To\'g\'ri previousBalance:', calculatedBalance.toLocaleString(), 'so\'m');
        
        if (flight.previousBalance !== calculatedBalance) {
          console.log('   ⚠️  previousBalance noto\'g\'ri! Tuzatish kerak.');
          flight.previousBalance = calculatedBalance;
          await flight.save();
          console.log('   ✅ previousBalance tuzatildi');
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 XULOSA:');
    console.log('   Hisoblangan balans:', calculatedBalance.toLocaleString(), 'so\'m');
    console.log('   Hozirgi balans:', (driver.currentBalance || 0).toLocaleString(), 'so\'m');
    
    if (driver.currentBalance !== calculatedBalance) {
      console.log('   ⚠️  Balans noto\'g\'ri! Tuzatish kerak.');
      driver.currentBalance = calculatedBalance;
      await driver.save();
      console.log('   ✅ Balans tuzatildi:', calculatedBalance.toLocaleString(), 'so\'m');
    } else {
      console.log('   ✅ Balans to\'g\'ri!');
    }
    
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixDimaBalance();
