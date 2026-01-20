require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function testDriverCashInHand() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Oxirgi reysni topish
    const flight = await Flight.findOne({ status: 'completed' })
      .populate('driver', 'fullName')
      .sort({ completedAt: -1 });
    
    if (!flight) {
      console.log('❌ Yopilgan reys topilmadi');
      return;
    }

    console.log('🚀 Reys:', flight.name);
    console.log('👤 Haydovchi:', flight.driver?.fullName);
    console.log('📅 Yopilgan:', flight.completedAt?.toLocaleString('uz-UZ'));
    console.log();

    // Manual hisoblash
    const previousBalance = flight.previousBalance || 0;
    const cashPayments = (flight.legs || []).reduce((sum, leg) => {
      if (leg.paymentType === 'cash' || leg.paymentType === 'transfer') {
        return sum + (leg.payment || 0);
      }
      return sum;
    }, 0);
    const totalGivenBudget = flight.totalGivenBudget || 0;
    const totalExpenses = flight.totalExpenses || 0;
    const driverProfitAmount = flight.driverProfitAmount || 0;

    // Eski formula (noto'g'ri)
    const oldFormula = previousBalance + cashPayments + totalGivenBudget - totalExpenses;
    
    // Yangi formula (to'g'ri)
    const newFormula = previousBalance + cashPayments + totalGivenBudget - totalExpenses - driverProfitAmount;

    console.log('📊 HISOBLASH:');
    console.log('   Avvalgi qoldiq:', previousBalance.toLocaleString(), 'so\'m');
    console.log('   Naqd to\'lovlar:', cashPayments.toLocaleString(), 'so\'m');
    console.log('   Yo\'l uchun berilgan:', totalGivenBudget.toLocaleString(), 'so\'m');
    console.log('   Jami xarajatlar:', totalExpenses.toLocaleString(), 'so\'m');
    console.log('   Shofyor oyligi:', driverProfitAmount.toLocaleString(), 'so\'m');
    console.log();

    console.log('💰 NATIJALAR:');
    console.log('   Eski formula (noto\'g\'ri):', oldFormula.toLocaleString(), 'so\'m');
    console.log('   Yangi formula (to\'g\'ri):', newFormula.toLocaleString(), 'so\'m');
    console.log('   Backend (virtual field):', (flight.driverCashInHand || 0).toLocaleString(), 'so\'m');
    console.log();

    console.log('✅ XULOSA:');
    if (flight.driverCashInHand === newFormula) {
      console.log('   Backend virtual field to\'g\'ri ishlayapti!');
    } else {
      console.log('   ⚠️  Backend virtual field noto\'g\'ri!');
      console.log('   Kutilgan:', newFormula.toLocaleString(), 'so\'m');
      console.log('   Haqiqiy:', (flight.driverCashInHand || 0).toLocaleString(), 'so\'m');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testDriverCashInHand();