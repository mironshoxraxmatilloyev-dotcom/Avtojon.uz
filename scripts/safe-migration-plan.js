const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function safeMigrationPlan() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🛡️  XAVFSIZ MIGRATSIYA REJASI');
    console.log('=' .repeat(60));

    console.log('📋 BOSQICHLAR:');
    console.log('1. Hozirgi hisobotlardagi qarzlarni previousDebt ga saqlash');
    console.log('2. API logikasini to\'g\'rilash (faol reyslarni hisoblamaslik)');
    console.log('3. Natijani tekshirish');

    // Hozirgi hisobotlardagi ma'lumotlar
    const reportedDrivers = [
      { name: 'Shuhrat', debt: 34318000 },
      { name: 'Feruz', debt: 2679000 },
      { name: 'Nosir', debt: 13560000 },
      { name: 'Sardor', debt: 7090000 },
      { name: 'Rasul', debt: 4856000 },
      { name: 'Bobur', debt: 15453000 },
      { name: 'Baxtiyor', debt: 4865000 }
    ];

    console.log('\n📊 1-BOSQICH: HOZIRGI QARZLARNI SAQLASH');
    console.log('-'.repeat(50));

    for (const reportedDriver of reportedDrivers) {
      const driver = await Driver.findOne({ 
        fullName: new RegExp(reportedDriver.name, 'i') 
      });

      if (driver) {
        console.log(`👤 ${reportedDriver.name}:`);
        console.log(`   Hozirgi previousDebt: ${(driver.previousDebt || 0).toLocaleString()} so'm`);
        console.log(`   Hisobotlardagi qarz: ${reportedDriver.debt.toLocaleString()} so'm`);
        console.log(`   ✅ previousDebt = ${reportedDriver.debt.toLocaleString()} so'm qilish kerak`);
      }
    }

    console.log('\n🔧 2-BOSQICH: API LOGIKASINI TO\'G\'RILASH');
    console.log('-'.repeat(50));
    console.log('API endpoint: /flights/driver-debts');
    console.log('O\'zgartirish: status = "completed" (faqat tugallangan reyslar)');
    console.log('Olib tashlash: status = "active" (faol reyslar hisoblanmasin)');

    console.log('\n📈 3-BOSQICH: NATIJA');
    console.log('-'.repeat(50));
    console.log('✅ Hisobotlarda hozirgi qarzlar saqlanadi');
    console.log('✅ Yangi tugallangan reyslar qo\'shiladi');
    console.log('✅ Faol reyslardan qarz hisoblanmaydi');
    console.log('✅ Ma\'lumotlar yo\'qolmaydi');

    console.log('\n🎯 XULOSA:');
    console.log('=' .repeat(40));
    console.log('Bu yondashuv 100% xavfsiz:');
    console.log('- Hech qanday ma\'lumot yo\'qolmaydi');
    console.log('- Hisobotlar to\'g\'ri ishlaydi');
    console.log('- Kelajakda mantiqiy bo\'ladi');

    console.log('\n❓ SIZNING TASDIG\'INGIZ KERAK:');
    console.log('Bu rejani amalga oshirishni xohlaysizmi?');
    console.log('1. Ha - boshlang');
    console.log('2. Yo\'q - boshqa yechim');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

safeMigrationPlan();