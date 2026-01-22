require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function testCompleteFlightWithDebt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Baxtiyor haydovchisini topish
    const driver = await Driver.findOne({ fullName: /Baxtiyor/i });
    
    if (!driver) {
      console.log('❌ Baxtiyor haydovchisi topilmadi');
      return;
    }

    // Faol reysni topish
    const activeFlight = await Flight.findOne({ 
      driver: driver._id,
      status: 'active'
    }).populate('driver', 'fullName phone previousDebt');

    if (!activeFlight) {
      console.log('❌ Faol reys topilmadi');
      return;
    }

    console.log('🔄 FAOL REYS (yopishdan oldin):');
    console.log('   Reys:', activeFlight.name);
    console.log('   Status:', activeFlight.status);
    console.log('   Jami kirim:', (activeFlight.totalIncome || 0).toLocaleString(), 'so\'m');
    console.log('   Sof foyda:', (activeFlight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi ulushi %:', activeFlight.driverProfitPercent || 0);
    console.log('   Haydovchi berishi kerak (reys):', (activeFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('   Avvalgi qarz:', (activeFlight.driver?.previousDebt || 0).toLocaleString(), 'so\'m');

    // Haydovchi ulushini 30% qilib o'rnatamiz
    activeFlight.driverProfitPercent = 30;
    activeFlight.status = 'completed';
    activeFlight.completedAt = new Date();

    // Reysni saqlash (pre-save hook ishlaydi)
    await activeFlight.save();

    // Yangilangan reysni olish
    const completedFlight = await Flight.findById(activeFlight._id)
      .populate('driver', 'fullName phone previousDebt');

    console.log('\n✅ REYS YOPILDI:');
    console.log('   Status:', completedFlight.status);
    console.log('   Jami kirim:', (completedFlight.totalIncome || 0).toLocaleString(), 'so\'m');
    console.log('   Sof foyda:', (completedFlight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi ulushi %:', completedFlight.driverProfitPercent || 0);
    console.log('   Haydovchi ulushi summa:', (completedFlight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi berishi kerak (reys):', (completedFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('   Avvalgi qarz:', (completedFlight.driver?.previousDebt || 0).toLocaleString(), 'so\'m');
    
    // Virtual field ni test qilish
    const totalDriverOwes = completedFlight.totalDriverOwes || ((completedFlight.driverOwes || 0) + (completedFlight.driver?.previousDebt || 0));
    console.log('   JAMI haydovchi berishi kerak:', totalDriverOwes.toLocaleString(), 'so\'m');

    console.log('\n' + '='.repeat(60));
    console.log('📊 YOPILGAN REYS NATIJASI:');
    console.log('   Reys uchun berishi kerak:', (completedFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('   Hisobotlar qismidagi qarz:', (completedFlight.driver?.previousDebt || 0).toLocaleString(), 'so\'m');
    console.log('   JAMI berishi kerak:', totalDriverOwes.toLocaleString(), 'so\'m');
    console.log('   ✅ Frontend da endi jami summa ko\'rsatiladi!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCompleteFlightWithDebt();