const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function checkSpecificDriversFlights() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 MAXSUS HAYDOVCHILAR REYSLARINI TEKSHIRISH');
    console.log('=' .repeat(60));

    const driverNames = ['Baxtiyor', 'Bobur', 'Shuhrat', 'Rasul', 'Feruz', 'Nosir', 'Sardor'];
    
    for (const driverName of driverNames) {
      console.log(`\n👤 ${driverName.toUpperCase()} TAHLILI:`);
      console.log('-'.repeat(40));

      // Haydovchini topish (case-insensitive)
      const driver = await Driver.findOne({ 
        fullName: new RegExp(driverName, 'i') 
      });

      if (!driver) {
        console.log(`❌ ${driverName} topilmadi`);
        continue;
      }

      console.log(`✅ Topildi: ${driver.fullName} (ID: ${driver._id})`);
      console.log(`   previousDebt: ${(driver.previousDebt || 0).toLocaleString()} so'm`);
      console.log(`   currentBalance: ${(driver.currentBalance || 0).toLocaleString()} so'm`);

      // Haydovchining barcha reyslarini olish
      const flights = await Flight.find({ driver: driver._id }).sort({ createdAt: -1 });
      
      console.log(`\n📊 REYSLAR SONI: ${flights.length} ta`);

      if (flights.length === 0) {
        console.log('   ❌ Hech qanday reys topilmadi');
        continue;
      }

      let completedFlights = 0;
      let activeFlights = 0;
      let totalOwes = 0;
      let totalPaid = 0;

      flights.forEach((flight, index) => {
        const driverOwes = flight.driverOwes || 0;
        const driverPaid = flight.driverPaidAmount || 0;
        const remaining = driverOwes - driverPaid;

        console.log(`\n   ${index + 1}. REYS:`);
        console.log(`      ID: ${flight._id}`);
        console.log(`      Status: ${flight.status}`);
        console.log(`      Sana: ${flight.createdAt?.toLocaleDateString() || 'N/A'}`);
        console.log(`      Sof foyda: ${(flight.netProfit || 0).toLocaleString()} so'm`);
        console.log(`      Biznesmen foydasi: ${(flight.businessProfit || 0).toLocaleString()} so'm`);
        console.log(`      Haydovchi ulushi: ${(flight.driverProfitAmount || 0).toLocaleString()} so'm`);
        console.log(`      Haydovchi berishi kerak: ${driverOwes.toLocaleString()} so'm`);
        console.log(`      To'langan: ${driverPaid.toLocaleString()} so'm`);
        console.log(`      Qolgan qarz: ${remaining.toLocaleString()} so'm`);
        console.log(`      To'lov statusi: ${flight.driverPaymentStatus || 'pending'}`);

        if (flight.status === 'completed') {
          completedFlights++;
          totalOwes += driverOwes;
          totalPaid += driverPaid;
        } else if (flight.status === 'active') {
          activeFlights++;
        }
      });

      const remainingDebt = totalOwes - totalPaid;

      console.log(`\n📈 JAMI STATISTIKA:`);
      console.log(`   ✅ Tugallangan reyslar: ${completedFlights} ta`);
      console.log(`   🔄 Faol reyslar: ${activeFlights} ta`);
      console.log(`   💰 Jami berishi kerak (tugallangan): ${totalOwes.toLocaleString()} so'm`);
      console.log(`   💳 Jami to'langan: ${totalPaid.toLocaleString()} so'm`);
      console.log(`   🎯 Qolgan qarz: ${remainingDebt.toLocaleString()} so'm`);

      // MUHIM: Hisobotlar qismida ko'rsatilishi kerak bo'lgan jami
      const totalForReports = remainingDebt + (driver.previousDebt || 0);
      console.log(`   📊 HISOBOTLAR QISMIDA: ${totalForReports.toLocaleString()} so'm`);

      // Agar tugallangan reyslar bo'lsa
      if (completedFlights > 0) {
        console.log(`\n🎯 ${driverName.toUpperCase()} UCHUN XULOSA:`);
        if (remainingDebt > 0) {
          console.log(`   ✅ ${remainingDebt.toLocaleString()} so'm qarz bor (tugallangan reyslardan)`);
          console.log(`   🔧 previousDebt ni ${remainingDebt.toLocaleString()} so'm qilish kerak`);
        } else {
          console.log(`   ✅ Tugallangan reyslardan qarz yo'q`);
        }
      } else {
        console.log(`\n🎯 ${driverName.toUpperCase()} UCHUN XULOSA:`);
        console.log(`   ❌ Tugallangan reyslar yo'q, faqat faol reyslar bor`);
        console.log(`   ℹ️  Qarz hisobotlar qismida ko'rsatilmasligi kerak`);
      }
    }

    console.log('\n🎯 UMUMIY XULOSA:');
    console.log('=' .repeat(50));
    console.log('✅ Tugallangan reyslari bor haydovchilar uchun previousDebt to\'g\'rilash kerak');
    console.log('❌ Faqat faol reyslari bor haydovchilar uchun previousDebt = 0 bo\'lishi kerak');
    console.log('🔧 Hisobotlar qismi faqat haqiqiy qarzlarni ko\'rsatishi kerak');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkSpecificDriversFlights();