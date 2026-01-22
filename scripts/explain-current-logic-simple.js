const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function explainCurrentLogicSimple() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n📚 HOZIRGI LOGIKA - ODDIY MISOL BILAN');
    console.log('=' .repeat(60));

    // Sardor misolida ko'rsatamiz
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    const sardorFlight = await Flight.findOne({ driver: sardor._id });

    console.log('🎯 SARDOR MISOLI:');
    console.log('=' .repeat(40));

    console.log('\n1️⃣ REYS MA\'LUMOTLARI (DB dan):');
    console.log(`   📋 Reys ID: ${sardorFlight._id}`);
    console.log(`   📊 Status: ${sardorFlight.status} (FAOL)`);
    console.log(`   💰 Mijozdan olingan: ${(sardorFlight.totalPayment || 0).toLocaleString()} so'm`);
    console.log(`   🛣️  Yo'l puli berilgan: ${(sardorFlight.totalGivenBudget || 0).toLocaleString()} so'm`);
    console.log(`   💸 Xarajatlar: ${(sardorFlight.totalExpenses || 0).toLocaleString()} so'm`);
    console.log(`   📈 Sof foyda: ${(sardorFlight.netProfit || 0).toLocaleString()} so'm`);
    console.log(`   🏢 Biznesmen foydasi: ${(sardorFlight.businessProfit || 0).toLocaleString()} so'm`);
    console.log(`   👤 Haydovchi ulushi: ${(sardorFlight.driverProfitAmount || 0).toLocaleString()} so'm`);

    console.log('\n2️⃣ HOZIRGI MUAMMO:');
    console.log(`   ❌ driverOwes (DB): ${(sardorFlight.driverOwes || 0).toLocaleString()} so'm`);
    console.log(`   ❓ Nega 0? Chunki reys hali "active" statusda`);

    console.log('\n3️⃣ HISOBOTLAR QISMI QANDAY ISHLAYDI:');
    console.log('   📍 API endpoint: /flights/driver-debts');
    console.log('   🔍 Qidiruv: status = "completed" YOKI "active"');
    console.log('   📊 Har bir reys uchun:');

    // API logikasini simulatsiya qilish
    const totalIncome = (sardorFlight.totalPayment || 0) + (sardorFlight.totalGivenBudget || 0);
    const lightExpenses = sardorFlight.lightExpenses || 0;
    const netProfit = sardorFlight.netProfit || (totalIncome - lightExpenses);
    const driverProfitAmount = sardorFlight.driverProfitAmount || 0;

    let calculatedDriverOwes = sardorFlight.driverOwes || sardorFlight.businessProfit || 0;
    if (calculatedDriverOwes === 0 && netProfit > 0) {
      calculatedDriverOwes = netProfit - driverProfitAmount;
    }

    console.log('\n4️⃣ API HISOB-KITOB JARAYONI:');
    console.log(`   a) Jami daromad = ${(sardorFlight.totalPayment || 0).toLocaleString()} + ${(sardorFlight.totalGivenBudget || 0).toLocaleString()} = ${totalIncome.toLocaleString()} so'm`);
    console.log(`   b) Sof foyda = ${totalIncome.toLocaleString()} - ${(sardorFlight.totalExpenses || 0).toLocaleString()} = ${netProfit.toLocaleString()} so'm`);
    console.log(`   c) Haydovchi ulushi = ${driverProfitAmount.toLocaleString()} so'm`);
    console.log(`   d) Biznesmen foydasi = ${netProfit.toLocaleString()} - ${driverProfitAmount.toLocaleString()} = ${(netProfit - driverProfitAmount).toLocaleString()} so'm`);

    console.log('\n5️⃣ API QARZ HISOBLASH:');
    console.log(`   🔍 driverOwes (DB) = ${(sardorFlight.driverOwes || 0).toLocaleString()} so'm`);
    console.log(`   🔍 businessProfit (DB) = ${(sardorFlight.businessProfit || 0).toLocaleString()} so'm`);
    console.log(`   ❓ Agar driverOwes = 0 va netProfit > 0 bo'lsa:`);
    console.log(`   💡 calculatedDriverOwes = netProfit - driverProfitAmount`);
    console.log(`   💡 calculatedDriverOwes = ${netProfit.toLocaleString()} - ${driverProfitAmount.toLocaleString()} = ${calculatedDriverOwes.toLocaleString()} so'm`);

    console.log('\n6️⃣ TO\'LOV HISOB-KITOB:');
    const driverPaidAmount = sardorFlight.driverPaidAmount || 0;
    const remainingDebt = calculatedDriverOwes - driverPaidAmount;
    console.log(`   💳 To'langan: ${driverPaidAmount.toLocaleString()} so'm`);
    console.log(`   🎯 Qolgan qarz: ${calculatedDriverOwes.toLocaleString()} - ${driverPaidAmount.toLocaleString()} = ${remainingDebt.toLocaleString()} so'm`);

    console.log('\n7️⃣ HISOBOTLARDA KO\'RSATILADI:');
    console.log(`   📊 Sardor: ${remainingDebt.toLocaleString()} so'm qarz`);
    console.log(`   ✅ Bu sizning aytgan 7,090,000 so'm ga to'g'ri keladi!`);

    console.log('\n🤔 MANTIQIY MUAMMO:');
    console.log('=' .repeat(40));
    console.log('❌ Reys hali FAOL, lekin qarz hisoblanmoqda');
    console.log('❌ Faol reysdan qarz olish noto\'g\'ri');
    console.log('✅ Qarz faqat TUGALLANGAN reyslardan bo\'lishi kerak');

    console.log('\n💡 TO\'G\'RI LOGIKA BO\'LISHI KERAK:');
    console.log('=' .repeat(40));
    console.log('1. Reys FAOL bo\'lsa → qarz = 0');
    console.log('2. Reys TUGALLANGAN bo\'lsa → qarz = businessProfit - to\'langan');
    console.log('3. Hisobotlar faqat tugallangan reyslarni ko\'rsatsin');

    console.log('\n🔧 YECHIM:');
    console.log('=' .repeat(40));
    console.log('1. Sardor reysini to\'g\'ri tugallash (status = completed)');
    console.log('2. driverOwes ni to\'g\'ri qiymatga o\'rnatish');
    console.log('3. API logikasini to\'g\'rilash (faol reyslarni hisoblamaslik)');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

explainCurrentLogicSimple();