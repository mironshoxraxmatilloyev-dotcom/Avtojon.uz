const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function investigateReportsDebtSource() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 HISOBOTLAR QISMIDAGI QARZ MANBALARINI TEKSHIRISH');
    console.log('=' .repeat(70));

    // Hisobotlarda ko'rsatilgan haydovchilar
    const reportedDrivers = [
      { name: 'Shuhrat', debt: 34318000 },
      { name: 'Feruz', debt: 2679000 },
      { name: 'Nosir', debt: 13560000 },
      { name: 'Sardor', debt: 7090000 },
      { name: 'Rasul', debt: 4856000 },
      { name: 'Bobur', debt: 15453000 },
      { name: 'Baxtiyor', debt: 4865000 }
    ];

    for (const reportedDriver of reportedDrivers) {
      console.log(`\n👤 ${reportedDriver.name.toUpperCase()} TAHLILI:`);
      console.log('-'.repeat(50));

      // Haydovchini topish
      const driver = await Driver.findOne({ 
        fullName: new RegExp(reportedDriver.name, 'i') 
      });

      if (!driver) {
        console.log(`❌ ${reportedDriver.name} topilmadi`);
        continue;
      }

      console.log(`✅ Topildi: ${driver.fullName} (ID: ${driver._id})`);
      console.log(`📊 Hisobotlarda ko'rsatilgan qarz: ${reportedDriver.debt.toLocaleString()} so'm`);

      // Haydovchining barcha reyslarini olish
      const flights = await Flight.find({ driver: driver._id }).sort({ createdAt: -1 });
      
      console.log(`\n📋 REYSLAR TAHLILI:`);
      console.log(`   Jami reyslar: ${flights.length} ta`);

      let totalDriverOwes = 0;
      let totalPaid = 0;
      let completedFlights = 0;
      let activeFlights = 0;

      flights.forEach((flight, index) => {
        const driverOwes = flight.driverOwes || 0;
        const driverPaid = flight.driverPaidAmount || 0;
        const businessProfit = flight.businessProfit || 0;
        const netProfit = flight.netProfit || 0;

        console.log(`\n   ${index + 1}. REYS (${flight.status}):`);
        console.log(`      ID: ${flight._id}`);
        console.log(`      Sana: ${flight.createdAt?.toLocaleDateString()}`);
        console.log(`      Sof foyda: ${netProfit.toLocaleString()} so'm`);
        console.log(`      Biznesmen foydasi: ${businessProfit.toLocaleString()} so'm`);
        console.log(`      driverOwes (DB): ${driverOwes.toLocaleString()} so'm`);
        console.log(`      To'langan: ${driverPaid.toLocaleString()} so'm`);
        console.log(`      Qolgan: ${(driverOwes - driverPaid).toLocaleString()} so'm`);

        if (flight.status === 'completed') {
          completedFlights++;
          totalDriverOwes += driverOwes;
          totalPaid += driverPaid;
        } else if (flight.status === 'active') {
          activeFlights++;
          // MUHIM: Faol reyslar uchun ham hisoblaymiz
          if (businessProfit > 0) {
            console.log(`      ⚠️  FAOL REYS, lekin biznesmen foydasi bor!`);
            console.log(`      💡 Agar tugallansa: ${businessProfit.toLocaleString()} so'm qarz bo'ladi`);
          }
        }
      });

      const remainingFromCompleted = totalDriverOwes - totalPaid;

      console.log(`\n📊 JAMI STATISTIKA:`);
      console.log(`   Tugallangan reyslar: ${completedFlights} ta`);
      console.log(`   Faol reyslar: ${activeFlights} ta`);
      console.log(`   Tugallangan reyslardan qarz: ${remainingFromCompleted.toLocaleString()} so'm`);
      console.log(`   previousDebt (DB): ${(driver.previousDebt || 0).toLocaleString()} so'm`);
      console.log(`   currentBalance: ${(driver.currentBalance || 0).toLocaleString()} so'm`);

      // API endpoint logikasini simulatsiya qilish
      console.log(`\n🔍 API ENDPOINT LOGIKASI (/flights/driver-debts):`);
      
      const apiFlights = flights.filter(f => f.status === 'completed' || f.status === 'active');
      const processedFlights = apiFlights.map(f => {
        const totalIncome = (f.totalPayment || 0) + (f.totalGivenBudget || 0);
        const lightExpenses = f.lightExpenses || 0;
        const netProfit = f.netProfit || (totalIncome - lightExpenses);
        const driverProfitAmount = f.driverProfitAmount || 0;

        let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
        if (calculatedDriverOwes === 0 && netProfit > 0) {
          calculatedDriverOwes = netProfit - driverProfitAmount;
        }

        return {
          _id: f._id,
          status: f.status,
          driverOwes: calculatedDriverOwes,
          driverPaidAmount: f.driverPaidAmount || 0
        };
      });

      const debtFlights = processedFlights.filter(f => f.driverOwes > 0);
      const apiTotalOwes = debtFlights.reduce((sum, f) => sum + f.driverOwes, 0);
      const apiTotalPaid = debtFlights.reduce((sum, f) => sum + f.driverPaidAmount, 0);
      const apiRemainingDebt = apiTotalOwes - apiTotalPaid;

      console.log(`   API qarz deb hisoblagan reyslar: ${debtFlights.length} ta`);
      console.log(`   API jami driverOwes: ${apiTotalOwes.toLocaleString()} so'm`);
      console.log(`   API jami to'langan: ${apiTotalPaid.toLocaleString()} so'm`);
      console.log(`   API qolgan qarz: ${apiRemainingDebt.toLocaleString()} so'm`);

      // HISOBOTLAR BILAN SOLISHTIRISH
      console.log(`\n🎯 HISOBOTLAR BILAN SOLISHTIRISH:`);
      console.log(`   Hisobotlarda: ${reportedDriver.debt.toLocaleString()} so'm`);
      console.log(`   API hisoblagan: ${apiRemainingDebt.toLocaleString()} so'm`);
      
      const difference = Math.abs(reportedDriver.debt - apiRemainingDebt);
      if (difference < 1000) {
        console.log(`   ✅ MOS KELADI (farq: ${difference.toLocaleString()} so'm)`);
      } else {
        console.log(`   ❌ MOS KELMAYDI (farq: ${difference.toLocaleString()} so'm)`);
        
        // QARZ MANBAI TAHLILI
        console.log(`\n🔍 QARZ MANBAI TAHLILI:`);
        
        // Faol reyslardan potentsial qarz
        const activeFlightsPotentialDebt = flights
          .filter(f => f.status === 'active')
          .reduce((sum, f) => {
            const businessProfit = f.businessProfit || 0;
            const paid = f.driverPaidAmount || 0;
            return sum + Math.max(0, businessProfit - paid);
          }, 0);

        console.log(`   Faol reyslardan potentsial qarz: ${activeFlightsPotentialDebt.toLocaleString()} so'm`);
        
        if (Math.abs(reportedDriver.debt - activeFlightsPotentialDebt) < 1000) {
          console.log(`   💡 EHTIMOL: Faol reyslar tugallangan deb hisoblanmoqda!`);
        }
      }
    }

    console.log(`\n🎯 UMUMIY XULOSA:`);
    console.log('=' .repeat(60));
    console.log('1. Hisobotlar qismidagi qarzlar asosan FAOL reyslardan kelmoqda');
    console.log('2. Faol reyslar tugallangan deb hisoblanmoqda (businessProfit > 0)');
    console.log('3. Lekin reys statuslari hali "active" ko\'rsatilmoqda');
    console.log('4. Bu mantiqiy xato - faol reyslardan qarz hisoblanmasligi kerak');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

investigateReportsDebtSource();