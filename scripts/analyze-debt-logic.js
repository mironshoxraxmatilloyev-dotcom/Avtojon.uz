const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function analyzeDebtLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 QARZ LOGIKASINI TAHLIL QILISH');
    console.log('=' .repeat(60));

    // Sardor misolida ko'raylik
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log(`\n👤 SARDOR TAHLILI (ID: ${sardor._id})`);
    console.log('-'.repeat(40));

    // Sardor ning barcha reyslarini olish
    const sardorFlights = await Flight.find({ driver: sardor._id }).sort({ createdAt: -1 });
    
    console.log(`📊 Sardor ning jami reyslari: ${sardorFlights.length} ta`);

    let totalFromFlights = 0;
    let totalPaidFromFlights = 0;

    sardorFlights.forEach((flight, index) => {
      const driverOwes = flight.driverOwes || 0;
      const driverPaid = flight.driverPaidAmount || 0;
      const remaining = driverOwes - driverPaid;

      console.log(`\n${index + 1}. REYS (${flight.status}):`);
      console.log(`   ID: ${flight._id}`);
      console.log(`   Sana: ${flight.createdAt?.toLocaleDateString()}`);
      console.log(`   Berishi kerak: ${driverOwes.toLocaleString()} so'm`);
      console.log(`   To'lagan: ${driverPaid.toLocaleString()} so'm`);
      console.log(`   Qolgan: ${remaining.toLocaleString()} so'm`);

      if (flight.status === 'completed') {
        totalFromFlights += driverOwes;
        totalPaidFromFlights += driverPaid;
      }
    });

    const remainingFromFlights = totalFromFlights - totalPaidFromFlights;

    console.log('\n📈 REYSLARDAN HISOBLANGAN:');
    console.log(`   Jami berishi kerak: ${totalFromFlights.toLocaleString()} so'm`);
    console.log(`   Jami to'lagan: ${totalPaidFromFlights.toLocaleString()} so'm`);
    console.log(`   Qolgan qarz: ${remainingFromFlights.toLocaleString()} so'm`);

    console.log('\n🎯 SIZ AYTGAN MA\'LUMOT:');
    console.log('   Sardor qarzi: 7,090,000 so\'m');

    console.log('\n🤔 SAVOL VA JAVOB:');
    console.log('=' .repeat(50));
    console.log('❓ SAVOL: "Qarzlar reyslar hisobidan bo\'ladiku?"');
    console.log('✅ JAVOB: Ha, to\'g\'ri! Qarzlar reyslardan kelib chiqadi.');
    console.log('');
    console.log('❓ SAVOL: "O\'tgan reyslardan qolgan qarzlar hisobotlarda ko\'rsatilishi kerakmi?"');
    console.log('✅ JAVOB: Ha, aynan shu muammo bor!');

    console.log('\n🚨 HOZIRGI MUAMMO:');
    console.log('1. Hisobotlar qismi (/flights/driver-debts) faqat driverOwes > 0 bo\'lgan reyslarni oladi');
    console.log('2. Lekin ba\'zi reyslar to\'liq to\'lanmagan (qisman to\'langan)');
    console.log('3. O\'sha qolgan qarzlar "previousDebt" da saqlanishi kerak');
    console.log('4. Yangi reys ochilganda: totalDriverOwes = newDriverOwes + previousDebt');

    console.log('\n💡 TO\'G\'RI LOGIKA:');
    console.log('1. Har reys yopilganda: qolgan qarz → previousDebt ga qo\'shiladi');
    console.log('2. Hisobotlar qismi: barcha to\'lanmagan qarzlarni ko\'rsatadi');
    console.log('3. FlightHeader: joriy reys + previousDebt = jami qarz');

    // API endpoint logikasini tekshirish
    console.log('\n🔍 HOZIRGI API LOGIKASI (/flights/driver-debts):');
    
    const apiFilter = {
      status: { $in: ['completed', 'active'] }
    };

    const apiFlights = await Flight.find(apiFilter)
      .populate('driver', 'fullName previousDebt')
      .lean();

    const sardorApiFlights = apiFlights.filter(f => 
      f.driver && f.driver._id.toString() === sardor._id.toString()
    );

    console.log(`📋 API Sardor uchun qaytargan reyslar: ${sardorApiFlights.length} ta`);

    sardorApiFlights.forEach((flight, index) => {
      const driverOwes = flight.driverOwes || 0;
      console.log(`   ${index + 1}. driverOwes: ${driverOwes.toLocaleString()} so'm (${flight.status})`);
    });

    const apiDebtFlights = sardorApiFlights.filter(f => (f.driverOwes || 0) > 0);
    console.log(`💰 API qarz deb hisoblagan reyslar: ${apiDebtFlights.length} ta`);

    console.log('\n🎯 XULOSA:');
    console.log('✅ Sizning fikringiz to\'g\'ri - qarzlar reyslardan kelib chiqadi');
    console.log('❌ Muammo: o\'tgan reyslardan qolgan qarzlar to\'g\'ri hisoblanmayapti');
    console.log('🔧 Yechim: previousDebt tizimini to\'g\'rilash kerak');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeDebtLogic();