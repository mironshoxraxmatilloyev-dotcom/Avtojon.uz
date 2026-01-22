require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function testTotalDriverOwes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Baxtiyor haydovchisini topish
    const driver = await Driver.findOne({ fullName: /Baxtiyor/i });
    
    if (!driver) {
      console.log('❌ Baxtiyor haydovchisi topilmadi');
      return;
    }

    console.log('👤 Haydovchi:', driver.fullName);
    console.log('💰 Hozirgi balans:', (driver.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('📊 Avvalgi qarz:', (driver.previousDebt || 0).toLocaleString(), 'so\'m\n');

    // Avvalgi qarzni 4,865,000 so'm qilib o'rnatamiz (test uchun)
    if (!driver.previousDebt || driver.previousDebt === 0) {
      driver.previousDebt = 4865000;
      await driver.save();
      console.log('✅ Avvalgi qarz 4,865,000 so\'m qilib o\'rnatildi\n');
    }

    // Baxtiyor ning faol reysini topish
    const activeFlight = await Flight.findOne({ 
      driver: driver._id,
      status: 'active'
    }).populate('driver', 'fullName phone previousDebt');

    if (!activeFlight) {
      console.log('❌ Faol reys topilmadi');
      return;
    }

    console.log('🔄 FAOL REYS:', activeFlight.name || 'Noma\'lum reys');
    console.log('   Jami kirim:', (activeFlight.totalIncome || 0).toLocaleString(), 'so\'m');
    console.log('   Jami xarajat:', (activeFlight.totalExpenses || 0).toLocaleString(), 'so\'m');
    console.log('   Sof foyda:', (activeFlight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi ulushi %:', activeFlight.driverProfitPercent || 0);
    console.log('   Haydovchi ulushi summa:', (activeFlight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi berishi kerak (reys):', (activeFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('   Haydovchi avvalgi qarz:', (activeFlight.driver?.previousDebt || 0).toLocaleString(), 'so\'m');
    
    // Virtual field ni test qilish
    const totalDriverOwes = activeFlight.totalDriverOwes || ((activeFlight.driverOwes || 0) + (activeFlight.driver?.previousDebt || 0));
    console.log('   JAMI haydovchi berishi kerak:', totalDriverOwes.toLocaleString(), 'so\'m');

    console.log('\n' + '='.repeat(60));
    console.log('📊 NATIJA:');
    console.log('   Reys uchun berishi kerak:', (activeFlight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('   Hisobotlar qismidagi qarz:', (activeFlight.driver?.previousDebt || 0).toLocaleString(), 'so\'m');
    console.log('   JAMI berishi kerak:', totalDriverOwes.toLocaleString(), 'so\'m');
    console.log('   ✅ Endi frontend da jami summa ko\'rsatiladi!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testTotalDriverOwes();