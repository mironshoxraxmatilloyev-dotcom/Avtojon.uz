require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function checkDriverPayments() {
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

    flights.forEach((flight, index) => {
      console.log(`\n${index + 1}. ${flight.name} (${flight.status})`);
      console.log('   Yaratilgan:', flight.createdAt?.toLocaleString('uz-UZ'));
      console.log('   Yopilgan:', flight.completedAt?.toLocaleString('uz-UZ') || 'Hali yopilmagan');
      console.log('   Avvalgi qoldiq:', (flight.previousBalance || 0).toLocaleString(), 'so\'m');
      console.log('   Sof foyda:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
      console.log('   Shofyor ulushi:', (flight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
      console.log('   Haydovchi berishi kerak:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
      console.log('   Haydovchi bergan:', (flight.driverPaidAmount || 0).toLocaleString(), 'so\'m');
      console.log('   Qolgan qarz:', (flight.driverRemainingDebt || 0).toLocaleString(), 'so\'m');
      
      if (flight.driverPayments && flight.driverPayments.length > 0) {
        console.log('   To\'lovlar:');
        flight.driverPayments.forEach((payment, i) => {
          console.log(`     ${i + 1}. ${payment.amount.toLocaleString()} so'm - ${payment.date?.toLocaleString('uz-UZ')}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDriverPayments();
