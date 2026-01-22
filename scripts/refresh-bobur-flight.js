const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');

async function refreshBoburFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Bobur ning faol reysini topish
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

    // Flight ni qayta hisoblash uchun save qilish
    await flight.save();

    // Qayta o'qish
    const updatedFlight = await Flight.findById('695b5e61340abbda0b0c941d');

    console.log('\n📊 REYS MA\'LUMOTLARI (keyin):');
    console.log('Status:', updatedFlight.status);
    console.log('Sof foyda:', (updatedFlight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('Biznesmen foydasi:', (updatedFlight.businessProfit || 0).toLocaleString(), 'so\'m');
    console.log('Haydovchi berishi kerak:', (updatedFlight.driverOwes || 0).toLocaleString(), 'so\'m');

    // YANGI TIZIM bo'yicha kutilayotgan qiymat
    const expectedDriverOwes = (updatedFlight.netProfit || 0) * 2;
    console.log('\n🎯 KUTILAYOTGAN QIYMAT:');
    console.log('Sof foyda x 2:', expectedDriverOwes.toLocaleString(), 'so\'m');
    
    if (updatedFlight.driverOwes === expectedDriverOwes) {
      console.log('✅ To\'g\'ri hisoblandi');
    } else {
      console.log('⚠️  Hali ham noto\'g\'ri');
      
      // Manual yangilash
      updatedFlight.driverOwes = expectedDriverOwes;
      await updatedFlight.save();
      console.log('🔧 Manual yangilandi');
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

refreshBoburFlight();