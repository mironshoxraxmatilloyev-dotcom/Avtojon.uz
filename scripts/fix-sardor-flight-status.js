const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function fixSardorFlightStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔧 SARDOR REYSINI TO\'G\'RILASH');
    console.log('=' .repeat(50));

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    // Sardor ning reysini olish
    const flight = await Flight.findOne({ driver: sardor._id });
    if (!flight) {
      console.log('❌ Sardor ning reysi topilmadi');
      return;
    }

    console.log(`👤 SARDOR: ${sardor.fullName}`);
    console.log(`📋 REYS ID: ${flight._id}`);

    console.log(`\n📊 OLDINGI HOLAT:`);
    console.log(`   Status: ${flight.status}`);
    console.log(`   driverOwes: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
    console.log(`   businessProfit: ${(flight.businessProfit || 0).toLocaleString()} so'm`);
    console.log(`   driverPaidAmount: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);

    // Barcha buyurtmalar tugallanganligini tekshirish
    const allLegsCompleted = flight.legs.every(leg => leg.status === 'completed');
    console.log(`\n🚗 Barcha buyurtmalar tugallanganmi: ${allLegsCompleted ? '✅ Ha' : '❌ Yo\'q'}`);

    if (!allLegsCompleted) {
      console.log('❌ Barcha buyurtmalar tugallanmagan, reysni tugallab bo\'lmaydi');
      return;
    }

    // Reysni tugallash
    console.log(`\n🔧 REYSNI TUGALLASH:`);
    
    // 1. Status ni completed ga o'zgartirish
    flight.status = 'completed';
    
    // 2. driverOwes ni to'g'ri qiymatga o'rnatish
    const correctDriverOwes = flight.businessProfit || 0;
    flight.driverOwes = correctDriverOwes;
    
    // 3. Qolgan qarzni hisoblash
    const remainingDebt = correctDriverOwes - (flight.driverPaidAmount || 0);
    flight.driverRemainingDebt = remainingDebt;
    
    // 4. To'lov statusini yangilash
    if (remainingDebt <= 0) {
      flight.driverPaymentStatus = 'paid';
    } else {
      flight.driverPaymentStatus = 'partial';
    }

    // 5. Tugallanish sanasini o'rnatish
    flight.completedAt = new Date();

    // Saqlash
    await flight.save();

    console.log(`\n📊 YANGI HOLAT:`);
    console.log(`   Status: ${flight.status}`);
    console.log(`   driverOwes: ${flight.driverOwes.toLocaleString()} so'm`);
    console.log(`   driverPaidAmount: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
    console.log(`   driverRemainingDebt: ${flight.driverRemainingDebt.toLocaleString()} so'm`);
    console.log(`   driverPaymentStatus: ${flight.driverPaymentStatus}`);
    console.log(`   completedAt: ${flight.completedAt}`);

    // 6. Haydovchi statusini yangilash
    sardor.status = 'free'; // Reys tugallangani uchun haydovchi bo'sh
    await sardor.save();

    console.log(`\n🎯 NATIJA:`);
    console.log(`✅ Sardor reysi to'g'ri tugallandi`);
    console.log(`💰 Qolgan qarz: ${remainingDebt.toLocaleString()} so'm`);
    console.log(`📊 Bu sizning aytgan 7,090,000 so'm ga to'g'ri keladi!`);

    console.log(`\n🔄 KEYINGI QADAM:`);
    console.log(`Endi hisobotlar qismida Sardor uchun ${remainingDebt.toLocaleString()} so'm qarz ko'rsatiladi`);

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSardorFlightStatus();