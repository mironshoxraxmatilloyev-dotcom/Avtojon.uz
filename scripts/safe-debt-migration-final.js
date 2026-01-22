const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function safeDebtMigrationFinal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔧 XAVFSIZ QARZ MIGRATSIYASI - YAKUNIY YECHIM');
    console.log('=' .repeat(60));

    // 1-BOSQICH: Hozirgi hisobotlarni saqlash
    console.log('\n1️⃣ BOSQICH: Hozirgi qarzlarni saqlash');
    console.log('=' .repeat(50));

    // Barcha haydovchilarni olish
    const drivers = await Driver.find({});
    console.log(`📋 Jami haydovchilar: ${drivers.length} ta`);

    const migrationData = [];

    for (const driver of drivers) {
      // Har bir haydovchi uchun joriy qarzni hisoblash (API logikasi)
      const flights = await Flight.find({ driver: driver._id });
      
      let totalDebt = 0;
      let activeFlightsDebt = 0;
      let completedFlightsDebt = 0;

      for (const flight of flights) {
        // API logikasini takrorlash
        const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0);
        const lightExpenses = flight.lightExpenses || 0;
        const netProfit = flight.netProfit || (totalIncome - lightExpenses);
        const driverProfitAmount = flight.driverProfitAmount || 0;

        let calculatedDriverOwes = flight.driverOwes || flight.businessProfit || 0;
        if (calculatedDriverOwes === 0 && netProfit > 0) {
          calculatedDriverOwes = netProfit - driverProfitAmount;
        }

        const driverPaidAmount = flight.driverPaidAmount || 0;
        const remainingDebt = Math.max(0, calculatedDriverOwes - driverPaidAmount);

        totalDebt += remainingDebt;

        if (flight.status === 'active') {
          activeFlightsDebt += remainingDebt;
        } else if (flight.status === 'completed') {
          completedFlightsDebt += remainingDebt;
        }
      }

      if (totalDebt > 0) {
        migrationData.push({
          driverId: driver._id,
          fullName: driver.fullName,
          currentTotalDebt: totalDebt,
          activeFlightsDebt: activeFlightsDebt,
          completedFlightsDebt: completedFlightsDebt,
          currentPreviousDebt: driver.previousDebt || 0
        });

        console.log(`👤 ${driver.fullName}:`);
        console.log(`   💰 Jami qarz: ${totalDebt.toLocaleString()} so'm`);
        console.log(`   🔄 Faol reyslar: ${activeFlightsDebt.toLocaleString()} so'm`);
        console.log(`   ✅ Tugallangan: ${completedFlightsDebt.toLocaleString()} so'm`);
        console.log(`   📊 Hozirgi previousDebt: ${(driver.previousDebt || 0).toLocaleString()} so'm`);
      }
    }

    console.log(`\n📊 Migratsiya kerak bo'lgan haydovchilar: ${migrationData.length} ta`);

    // 2-BOSQICH: Tasdiqlash
    console.log('\n2️⃣ BOSQICH: Migratsiya rejasi');
    console.log('=' .repeat(50));

    let totalMigrationAmount = 0;
    for (const data of migrationData) {
      const newPreviousDebt = data.currentTotalDebt + data.currentPreviousDebt;
      totalMigrationAmount += data.currentTotalDebt;
      
      console.log(`\n🔄 ${data.fullName}:`);
      console.log(`   Hozirgi previousDebt: ${data.currentPreviousDebt.toLocaleString()} so'm`);
      console.log(`   Joriy qarz: ${data.currentTotalDebt.toLocaleString()} so'm`);
      console.log(`   ➡️  Yangi previousDebt: ${newPreviousDebt.toLocaleString()} so'm`);
    }

    console.log(`\n💰 Jami migratsiya summasi: ${totalMigrationAmount.toLocaleString()} so'm`);

    // 3-BOSQICH: Migratsiyani amalga oshirish
    console.log('\n3️⃣ BOSQICH: Migratsiyani amalga oshirish');
    console.log('=' .repeat(50));

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('❓ Migratsiyani davom ettirasizmi? (ha/yo\'q): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'ha' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Migratsiya bekor qilindi');
      return;
    }

    // Migratsiyani amalga oshirish
    console.log('\n🚀 Migratsiya boshlanmoqda...');
    
    for (const data of migrationData) {
      const newPreviousDebt = data.currentTotalDebt + data.currentPreviousDebt;
      
      await Driver.findByIdAndUpdate(data.driverId, {
        previousDebt: newPreviousDebt
      });

      console.log(`✅ ${data.fullName}: previousDebt = ${newPreviousDebt.toLocaleString()} so'm`);
    }

    // 4-BOSQICH: Natijani tekshirish
    console.log('\n4️⃣ BOSQICH: Natijani tekshirish');
    console.log('=' .repeat(50));

    for (const data of migrationData) {
      const updatedDriver = await Driver.findById(data.driverId);
      console.log(`✅ ${data.fullName}: previousDebt = ${(updatedDriver.previousDebt || 0).toLocaleString()} so'm`);
    }

    console.log('\n🎉 MIGRATSIYA MUVAFFAQIYATLI YAKUNLANDI!');
    console.log('=' .repeat(50));
    console.log('✅ Barcha joriy qarzlar previousDebt ga ko\'chirildi');
    console.log('✅ Hisobotlar saqlanib qoldi');
    console.log('✅ Endi API logikasini to\'g\'rilash mumkin');

    console.log('\n📋 KEYINGI QADAMLAR:');
    console.log('1. API da faol reyslarni qarz hisobiga kiritmaslik');
    console.log('2. Faqat tugallangan reyslar + previousDebt ko\'rsatish');
    console.log('3. Test qilish va deploy qilish');

  } catch (error) {
    console.error('❌ Xato:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

safeDebtMigrationFinal();