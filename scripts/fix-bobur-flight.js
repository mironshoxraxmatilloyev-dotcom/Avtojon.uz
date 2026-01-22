const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');

async function fixBoburFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Bobur ning reysini topish
    const flight = await Flight.findById('695b5e61340abbda0b0c941d');
    if (!flight) {
      console.log('❌ Reys topilmadi');
      return;
    }

    console.log('\n📊 REYS MA\'LUMOTLARI (oldin):');
    console.log('Status:', flight.status);
    console.log('Sof foyda:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('Biznesmen foydasi:', (flight.businessProfit || 0).toLocaleString(), 'so\'m');
    console.log('Haydovchi berishi kerak:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');

    // FAOL REYS UCHUN TO'G'RI QIYMATLAR:
    // - Faol reysda haydovchi hech narsa bermaydi
    // - Faqat reys yopilganda hisob-kitob qilinadi
    
    if (flight.status === 'active') {
      flight.driverOwes = 0; // Faol reysda qarz yo'q
      await flight.save();
      console.log('\n✅ TUZATILDI: Faol reysda driverOwes = 0 qilindi');
    }

    // Qayta o'qish
    const updatedFlight = await Flight.findById('695b5e61340abbda0b0c941d');

    console.log('\n📊 REYS MA\'LUMOTLARI (keyin):');
    console.log('Status:', updatedFlight.status);
    console.log('Sof foyda:', (updatedFlight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('Biznesmen foydasi:', (updatedFlight.businessProfit || 0).toLocaleString(), 'so\'m');
    console.log('Haydovchi berishi kerak:', (updatedFlight.driverOwes || 0).toLocaleString(), 'so\'m');

    console.log('\n💡 TUSHUNTIRISH:');
    console.log('- Faol reysda haydovchi hech narsa bermaydi (driverOwes = 0)');
    console.log('- Sof foyda haydovchining qo\'lida turadi');
    console.log('- Reys yopilganda hisob-kitob qilinadi');
    console.log('- Shunda haydovchi berishi kerak bo\'lgan pul hisoblanadi');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixBoburFlight();