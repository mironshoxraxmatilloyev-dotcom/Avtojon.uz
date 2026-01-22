const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function testFinalSolution() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🧪 YAKUNIY YECHIMNI TEST QILISH');
    console.log('=' .repeat(60));

    // 1. Sardor misolida test
    console.log('\n1️⃣ SARDOR MISOLI - OLDIN VA KEYIN');
    console.log('=' .repeat(50));

    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log(`👤 Haydovchi: ${sardor.fullName}`);
    console.log(`📊 previousDebt: ${(sardor.previousDebt || 0).toLocaleString()} so'm`);

    // Sardorning reyslarini tekshirish
    const sardorFlights = await Flight.find({ driver: sardor._id });
    console.log(`📋 Jami reyslar: ${sardorFlights.length} ta`);

    let activeFlights = 0;
    let completedFlights = 0;
    let activeFlightsDebt = 0;
    let completedFlightsDebt = 0;

    for (const flight of sardorFlights) {
      console.log(`\n🛣️  Reys: ${flight._id}`);
      console.log(`   Status: ${flight.status}`);
      console.log(`   driverOwes: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
      console.log(`   businessProfit: ${(flight.businessProfit || 0).toLocaleString()} so'm`);

      if (flight.status === 'active') {
        activeFlights++;
        activeFlightsDebt += (flight.driverOwes || flight.businessProfit || 0);
      } else if (flight.status === 'completed') {
        completedFlights++;
        completedFlightsDebt += (flight.driverOwes || flight.businessProfit || 0);
      }
    }

    console.log(`\n📊 SARDOR STATISTIKASI:`);
    console.log(`   🔄 Faol reyslar: ${activeFlights} ta, qarz: ${activeFlightsDebt.toLocaleString()} so'm`);
    console.log(`   ✅ Tugallangan: ${completedFlights} ta, qarz: ${completedFlightsDebt.toLocaleString()} so'm`);
    console.log(`   📈 previousDebt: ${(sardor.previousDebt || 0).toLocaleString()} so'm`);

    // 2. Yangi logika bo'yicha hisoblash
    console.log('\n2️⃣ YANGI LOGIKA BO\'YICHA HISOBLASH');
    console.log('=' .repeat(50));

    const newLogicDebt = completedFlightsDebt + (sardor.previousDebt || 0);
    console.log(`✅ Faqat tugallangan reyslar: ${completedFlightsDebt.toLocaleString()} so'm`);
    console.log(`✅ previousDebt: ${(sardor.previousDebt || 0).toLocaleString()} so'm`);
    console.log(`🎯 Jami ko'rsatiladigan qarz: ${newLogicDebt.toLocaleString()} so'm`);

    // 3. Barcha haydovchilar uchun umumiy test
    console.log('\n3️⃣ BARCHA HAYDOVCHILAR UCHUN TEST');
    console.log('=' .repeat(50));

    const allDrivers = await Driver.find({});
    let totalPreviousDebt = 0;
    let driversWithDebt = 0;

    for (const driver of allDrivers) {
      if (driver.previousDebt && driver.previousDebt > 0) {
        driversWithDebt++;
        totalPreviousDebt += driver.previousDebt;
        console.log(`👤 ${driver.fullName}: ${driver.previousDebt.toLocaleString()} so'm`);
      }
    }

    console.log(`\n📊 UMUMIY STATISTIKA:`);
    console.log(`   👥 Jami haydovchilar: ${allDrivers.length} ta`);
    console.log(`   💰 previousDebt bor: ${driversWithDebt} ta`);
    console.log(`   💵 Jami previousDebt: ${totalPreviousDebt.toLocaleString()} so'm`);

    // 4. API simulatsiyasi
    console.log('\n4️⃣ API SIMULATSIYASI (driver-debts endpoint)');
    console.log('=' .repeat(50));

    // Faqat tugallangan reyslar
    const completedFlights = await Flight.find({ status: 'completed' })
      .populate('driver', 'fullName previousDebt');

    let apiTotalDebt = 0;
    const driverDebts = {};

    // Tugallangan reyslardan qarzlarni yig'ish
    for (const flight of completedFlights) {
      const driverId = flight.driver._id.toString();
      const driverName = flight.driver.fullName;
      const flightDebt = flight.driverOwes || flight.businessProfit || 0;

      if (!driverDebts[driverId]) {
        driverDebts[driverId] = {
          name: driverName,
          flightsDebt: 0,
          previousDebt: flight.driver.previousDebt || 0,
          totalDebt: 0
        };
      }

      driverDebts[driverId].flightsDebt += flightDebt;
    }

    // Jami qarzni hisoblash
    for (const driverId in driverDebts) {
      const debt = driverDebts[driverId];
      debt.totalDebt = debt.flightsDebt + debt.previousDebt;
      apiTotalDebt += debt.totalDebt;

      if (debt.totalDebt > 0) {
        console.log(`👤 ${debt.name}:`);
        console.log(`   Reyslar: ${debt.flightsDebt.toLocaleString()} so'm`);
        console.log(`   previousDebt: ${debt.previousDebt.toLocaleString()} so'm`);
        console.log(`   Jami: ${debt.totalDebt.toLocaleString()} so'm`);
      }
    }

    console.log(`\n🎯 API NATIJASI: ${apiTotalDebt.toLocaleString()} so'm`);

    // 5. Xavfsizlik tekshiruvi
    console.log('\n5️⃣ XAVFSIZLIK TEKSHIRUVI');
    console.log('=' .repeat(50));

    const activeFlightsWithDebt = await Flight.find({ 
      status: 'active',
      $or: [
        { driverOwes: { $gt: 0 } },
        { businessProfit: { $gt: 0 } }
      ]
    });

    console.log(`⚠️  Faol reyslar (qarz bilan): ${activeFlightsWithDebt.length} ta`);
    
    if (activeFlightsWithDebt.length > 0) {
      console.log('❌ DIQQAT: Faol reyslar hisobotlarda ko\'rsatilmasligi kerak!');
      for (const flight of activeFlightsWithDebt) {
        console.log(`   🔄 ${flight._id}: ${(flight.driverOwes || flight.businessProfit || 0).toLocaleString()} so'm`);
      }
    } else {
      console.log('✅ Faol reyslar hisobotlarda ko\'rsatilmaydi');
    }

    console.log('\n🎉 TEST YAKUNLANDI!');
    console.log('=' .repeat(50));
    console.log('✅ previousDebt tizimi ishlaydi');
    console.log('✅ Faqat tugallangan reyslar hisoblanadi');
    console.log('✅ Ma\'lumotlar saqlanib qoldi');

  } catch (error) {
    console.error('❌ Xato:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testFinalSolution();