const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function analyzeReportsMoneyFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 HISOBOTLAR QISMIDAGI PUL OQIMLARINI TAHLIL QILISH');
    console.log('=' .repeat(70));

    // Hisobotlarda ko'rsatilgan haydovchilar (rasmdan)
    const reportedDrivers = [
      { name: 'Shuhrat', debt: 34318000, paid: 0 },
      { name: 'Feruz', debt: 2679000, paid: 14000000 },
      { name: 'Nosir', debt: 13560000, paid: 280000 },
      { name: 'Sardor', debt: 7090000, paid: 14000000 },
      { name: 'Rasul', debt: 4856000, paid: 6000000 },
      { name: 'Bobur', debt: 15453000, paid: 0 },
      { name: 'Baxtiyor', debt: 4865000, paid: 12000000 }
    ];

    console.log('📊 HISOBOTLAR QISMIDAGI UMUMIY STATISTIKA:');
    console.log('-'.repeat(50));
    
    const totalDebt = reportedDrivers.reduce((sum, d) => sum + d.debt, 0);
    const totalPaid = reportedDrivers.reduce((sum, d) => sum + d.paid, 0);
    
    console.log(`💰 Jami qarzdorlik: ${totalDebt.toLocaleString()} so'm`);
    console.log(`💳 Jami to'langan: ${totalPaid.toLocaleString()} so'm`);
    console.log(`📈 Qolgan qarz: ${(totalDebt - totalPaid).toLocaleString()} so'm`);

    console.log('\n🔍 HAR BIR HAYDOVCHI UCHUN BATAFSIL TAHLIL:');
    console.log('=' .repeat(70));

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
      console.log(`📊 Hisobotlarda:`);
      console.log(`   Qarzdorlik: ${reportedDriver.debt.toLocaleString()} so'm`);
      console.log(`   To'langan: ${reportedDriver.paid.toLocaleString()} so'm`);

      // Haydovchining reyslarini olish
      const flights = await Flight.find({ driver: driver._id }).sort({ createdAt: -1 });
      
      console.log(`\n📋 REYS MA'LUMOTLARI:`);
      console.log(`   Jami reyslar: ${flights.length} ta`);

      let totalFromDB = 0;
      let totalPaidFromDB = 0;

      flights.forEach((flight, index) => {
        const driverOwes = flight.driverOwes || 0;
        const businessProfit = flight.businessProfit || 0;
        const driverPaid = flight.driverPaidAmount || 0;
        const netProfit = flight.netProfit || 0;

        console.log(`\n   ${index + 1}. REYS (${flight.status}):`);
        console.log(`      ID: ${flight._id.toString().slice(-8)}`);
        console.log(`      Sana: ${flight.createdAt?.toLocaleDateString()}`);
        console.log(`      Sof foyda: ${netProfit.toLocaleString()} so'm`);
        console.log(`      Biznesmen foydasi: ${businessProfit.toLocaleString()} so'm`);
        console.log(`      driverOwes (DB): ${driverOwes.toLocaleString()} so'm`);
        console.log(`      To'langan (DB): ${driverPaid.toLocaleString()} so'm`);

        // To'lov tarixi
        if (flight.driverPayments && flight.driverPayments.length > 0) {
          console.log(`      💳 To'lov tarixi:`);
          flight.driverPayments.forEach((payment, pIndex) => {
            console.log(`         ${pIndex + 1}. ${payment.amount.toLocaleString()} so'm - ${payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'} - ${payment.note || 'Izohsiz'}`);
          });
        }

        // API logikasi bo'yicha hisoblash
        const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0);
        const calculatedNetProfit = totalIncome - (flight.totalExpenses || 0);
        let calculatedDriverOwes = driverOwes || businessProfit || 0;
        
        if (calculatedDriverOwes === 0 && calculatedNetProfit > 0) {
          calculatedDriverOwes = calculatedNetProfit - (flight.driverProfitAmount || 0);
        }

        console.log(`      🧮 API hisoblagan driverOwes: ${calculatedDriverOwes.toLocaleString()} so'm`);

        if (flight.status === 'completed') {
          totalFromDB += calculatedDriverOwes;
          totalPaidFromDB += driverPaid;
        } else if (flight.status === 'active' && calculatedDriverOwes > 0) {
          // Faol reyslar ham hisobga olinmoqda!
          totalFromDB += calculatedDriverOwes;
          totalPaidFromDB += driverPaid;
          console.log(`      ⚠️  FAOL REYS, lekin API hisoblamoqda!`);
        }
      });

      const remainingFromDB = totalFromDB - totalPaidFromDB;

      console.log(`\n📊 DB DAN HISOBLANGAN:`);
      console.log(`   Jami driverOwes: ${totalFromDB.toLocaleString()} so'm`);
      console.log(`   Jami to'langan: ${totalPaidFromDB.toLocaleString()} so'm`);
      console.log(`   Qolgan qarz: ${remainingFromDB.toLocaleString()} so'm`);

      console.log(`\n🔍 HISOBOTLAR BILAN SOLISHTIRISH:`);
      console.log(`   Hisobotlarda qarzdorlik: ${reportedDriver.debt.toLocaleString()} so'm`);
      console.log(`   DB dan hisoblangan: ${remainingFromDB.toLocaleString()} so'm`);
      console.log(`   Hisobotlarda to'langan: ${reportedDriver.paid.toLocaleString()} so'm`);
      console.log(`   DB da to'langan: ${totalPaidFromDB.toLocaleString()} so'm`);

      const debtDifference = Math.abs(reportedDriver.debt - remainingFromDB);
      const paidDifference = Math.abs(reportedDriver.paid - totalPaidFromDB);

      if (debtDifference < 1000 && paidDifference < 1000) {
        console.log(`   ✅ MOS KELADI`);
      } else {
        console.log(`   ❌ MOS KELMAYDI`);
        console.log(`   Qarz farqi: ${debtDifference.toLocaleString()} so'm`);
        console.log(`   To'lov farqi: ${paidDifference.toLocaleString()} so'm`);
      }

      // PUL OQIMI TAHLILI
      console.log(`\n💰 PUL OQIMI TAHLILI:`);
      if (reportedDriver.paid > 0) {
        console.log(`   📥 KELGAN PUL: ${reportedDriver.paid.toLocaleString()} so'm`);
        console.log(`   📤 BERILGAN PUL: 0 so'm (hisobotlarda ko'rsatilmagan)`);
        console.log(`   💡 Bu pul qayerdan kelgan?`);
        
        // Driver currentBalance tekshirish
        console.log(`   🏦 Driver currentBalance: ${(driver.currentBalance || 0).toLocaleString()} so'm`);
        
        if (driver.currentBalance < 0) {
          console.log(`   💡 Manfiy balans - haydovchi pul bergan`);
        } else if (driver.currentBalance > 0) {
          console.log(`   💡 Musbat balans - haydovchida pul qolgan`);
        }
      } else {
        console.log(`   📥 KELGAN PUL: 0 so'm`);
        console.log(`   📤 BERILGAN PUL: 0 so'm`);
        console.log(`   💡 Hech qanday pul harakati yo'q`);
      }
    }

    console.log(`\n🎯 UMUMIY XULOSA:`);
    console.log('=' .repeat(60));
    console.log('1. Hisobotlardagi qarzlar asosan FAOL reyslardan kelmoqda');
    console.log('2. To\'langan pullar driverPayments massivida saqlanmoqda');
    console.log('3. Driver currentBalance manfiy bo\'lsa - pul bergan');
    console.log('4. Faol reyslardan qarz hisoblanishi mantiqiy xato');
    console.log('5. Pul oqimi: reys → driverPayments → currentBalance');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeReportsMoneyFlow();