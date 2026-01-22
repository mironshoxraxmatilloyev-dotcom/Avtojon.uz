const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function fullDebtAnalysis() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Barcha haydovchilarni topish
    const allDrivers = await Driver.find({}).sort({ fullName: 1 });
    console.log(`\n📊 JAMI ${allDrivers.length} TA HAYDOVCHI TOPILDI\n`);

    let totalSystemDebt = 0;
    let driversWithDebt = 0;

    for (let i = 0; i < allDrivers.length; i++) {
      const driver = allDrivers[i];
      
      // Haydovchining barcha reyslarini topish
      const allFlights = await Flight.find({ 
        driver: driver._id 
      }).sort({ createdAt: -1 });

      const activeFlights = allFlights.filter(f => f.status === 'active');
      const completedFlights = allFlights.filter(f => f.status === 'completed');

      // Yopilgan reyslardan jami qarz
      let totalOwes = 0;
      let totalPaid = 0;
      
      completedFlights.forEach(flight => {
        totalOwes += flight.driverOwes || 0;
        totalPaid += flight.driverPaidAmount || 0;
      });

      const remainingDebt = totalOwes - totalPaid;
      const previousDebt = driver.previousDebt || 0;
      const currentBalance = driver.currentBalance || 0;

      // Faqat qarz bor yoki faol reys bor haydovchilarni ko'rsatish
      if (remainingDebt > 0 || previousDebt > 0 || activeFlights.length > 0 || Math.abs(currentBalance) > 1000) {
        console.log(`${i + 1}. 👤 ${driver.fullName}`);
        console.log(`   📱 ID: ${driver._id}`);
        console.log(`   📊 Reyslar: ${completedFlights.length} yopilgan, ${activeFlights.length} faol`);
        console.log(`   💰 Jami berishi kerak: ${totalOwes.toLocaleString()} so'm`);
        console.log(`   ✅ To'lagan: ${totalPaid.toLocaleString()} so'm`);
        console.log(`   ⚠️  Qolgan qarz: ${remainingDebt.toLocaleString()} so'm`);
        console.log(`   🏦 Avvalgi qarz (DB): ${previousDebt.toLocaleString()} so'm`);
        console.log(`   💵 Qo'lidagi pul: ${currentBalance.toLocaleString()} so'm`);
        
        // Faol reyslar haqida ma'lumot
        if (activeFlights.length > 0) {
          console.log(`   🚀 FAOL REYSLAR:`);
          activeFlights.forEach((flight, idx) => {
            console.log(`      ${idx + 1}. Sof foyda: ${(flight.netProfit || 0).toLocaleString()} so'm`);
            console.log(`         Biznesmen foydasi: ${(flight.businessProfit || 0).toLocaleString()} so'm`);
            console.log(`         Haydovchi berishi kerak: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
          });
        }

        console.log('');
        
        if (remainingDebt > 0 || previousDebt > 0) {
          totalSystemDebt += remainingDebt + previousDebt;
          driversWithDebt++;
        }
      }
    }

    console.log('\n📈 JAMI STATISTIKA:');
    console.log(`💰 Tizimda jami qarz: ${totalSystemDebt.toLocaleString()} so'm`);
    console.log(`👥 Qarzi bor haydovchilar: ${driversWithDebt} ta`);
    console.log(`📊 Jami haydovchilar: ${allDrivers.length} ta`);

    // Eng ko'p qarzi bor haydovchilar
    console.log('\n🔝 ENG KO\'P QARZI BOR HAYDOVCHILAR:');
    
    const driversWithHighDebt = [];
    for (const driver of allDrivers) {
      const flights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed' 
      });
      
      let totalOwes = 0;
      let totalPaid = 0;
      
      flights.forEach(flight => {
        totalOwes += flight.driverOwes || 0;
        totalPaid += flight.driverPaidAmount || 0;
      });

      const debt = (totalOwes - totalPaid) + (driver.previousDebt || 0);
      if (debt > 0) {
        driversWithHighDebt.push({
          name: driver.fullName,
          debt: debt
        });
      }
    }

    driversWithHighDebt
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5)
      .forEach((driver, idx) => {
        console.log(`${idx + 1}. ${driver.name}: ${driver.debt.toLocaleString()} so'm`);
      });

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fullDebtAnalysis();