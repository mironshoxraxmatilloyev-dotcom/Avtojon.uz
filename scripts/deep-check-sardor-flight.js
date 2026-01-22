const mongoose = require('mongoose');
require('dotenv').config();

const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function deepCheckSardorFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔍 SARDOR REYSINI BATAFSIL TEKSHIRISH');
    console.log('=' .repeat(60));

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log(`👤 SARDOR: ${sardor.fullName} (ID: ${sardor._id})`);

    // Sardor ning reysini olish
    const flight = await Flight.findOne({ driver: sardor._id });
    if (!flight) {
      console.log('❌ Sardor ning reysi topilmadi');
      return;
    }

    console.log(`\n📋 REYS BATAFSIL MA'LUMOTLARI:`);
    console.log(`   ID: ${flight._id}`);
    console.log(`   Status: ${flight.status}`);
    console.log(`   Yaratilgan: ${flight.createdAt}`);
    console.log(`   Yangilangan: ${flight.updatedAt}`);

    console.log(`\n💰 MOLIYAVIY MA'LUMOTLAR:`);
    console.log(`   totalPayment: ${(flight.totalPayment || 0).toLocaleString()} so'm`);
    console.log(`   totalGivenBudget: ${(flight.totalGivenBudget || 0).toLocaleString()} so'm`);
    console.log(`   totalExpenses: ${(flight.totalExpenses || 0).toLocaleString()} so'm`);
    console.log(`   netProfit: ${(flight.netProfit || 0).toLocaleString()} so'm`);
    console.log(`   businessProfit: ${(flight.businessProfit || 0).toLocaleString()} so'm`);
    console.log(`   driverProfitAmount: ${(flight.driverProfitAmount || 0).toLocaleString()} so'm`);
    console.log(`   driverOwes: ${(flight.driverOwes || 0).toLocaleString()} so'm`);

    console.log(`\n💳 TO'LOV MA'LUMOTLARI:`);
    console.log(`   driverPaidAmount: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
    console.log(`   driverPaymentStatus: ${flight.driverPaymentStatus || 'pending'}`);
    console.log(`   driverRemainingDebt: ${(flight.driverRemainingDebt || 0).toLocaleString()} so'm`);

    if (flight.driverPayments && flight.driverPayments.length > 0) {
      console.log(`\n💸 TO'LOV TARIXI (${flight.driverPayments.length} ta):`);
      flight.driverPayments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.amount.toLocaleString()} so'm - ${payment.date} - ${payment.note || 'Izohsiz'}`);
      });
    }

    console.log(`\n🚗 BUYURTMALAR (LEGS):`);
    if (flight.legs && flight.legs.length > 0) {
      flight.legs.forEach((leg, index) => {
        console.log(`   ${index + 1}. ${leg.fromCity || 'N/A'} → ${leg.toCity || 'N/A'}`);
        console.log(`      To'lov: ${(leg.payment || 0).toLocaleString()} so'm`);
        console.log(`      Yo'l puli: ${(leg.givenBudget || 0).toLocaleString()} so'm`);
        console.log(`      Status: ${leg.status || 'N/A'}`);
      });
    } else {
      console.log('   ❌ Buyurtmalar yo\'q');
    }

    console.log(`\n💸 XARAJATLAR:`);
    if (flight.expenses && flight.expenses.length > 0) {
      console.log(`   Jami xarajatlar: ${flight.expenses.length} ta`);
      let totalExpenseAmount = 0;
      flight.expenses.forEach((expense, index) => {
        totalExpenseAmount += expense.amount || 0;
        console.log(`   ${index + 1}. ${expense.type}: ${(expense.amount || 0).toLocaleString()} so'm - ${expense.description || 'Izohsiz'}`);
      });
      console.log(`   Jami summa: ${totalExpenseAmount.toLocaleString()} so'm`);
    } else {
      console.log('   ❌ Xarajatlar yo\'q');
    }

    // HISOB-KITOB TEKSHIRISH
    console.log(`\n🧮 HISOB-KITOB TEKSHIRISH:`);
    const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0);
    const calculatedNetProfit = totalIncome - (flight.totalExpenses || 0);
    const calculatedBusinessProfit = calculatedNetProfit - (flight.driverProfitAmount || 0);

    console.log(`   Jami daromad: ${totalIncome.toLocaleString()} so'm`);
    console.log(`   Jami xarajat: ${(flight.totalExpenses || 0).toLocaleString()} so'm`);
    console.log(`   Hisoblangan sof foyda: ${calculatedNetProfit.toLocaleString()} so'm`);
    console.log(`   DB dagi sof foyda: ${(flight.netProfit || 0).toLocaleString()} so'm`);
    console.log(`   Hisoblangan biznesmen foydasi: ${calculatedBusinessProfit.toLocaleString()} so'm`);
    console.log(`   DB dagi biznesmen foydasi: ${(flight.businessProfit || 0).toLocaleString()} so'm`);

    // SIZ AYTGAN QARZ BILAN SOLISHTIRISH
    console.log(`\n🎯 SIZ AYTGAN 7,090,000 SO'M QARZ TAHLILI:`);
    
    if (flight.status === 'active') {
      console.log(`   ❓ Reys hali faol, lekin 7,090,000 so'm qarz qayerdan?`);
      console.log(`   💡 Ehtimollar:`);
      console.log(`      1. Reys aslida tugallangan, lekin status yangilanmagan`);
      console.log(`      2. Manual qarz qo'shilgan`);
      console.log(`      3. Oldingi reysdan qolgan qarz`);
      
      // Agar reys tugallangan bo'lsa, qancha qarz bo'lishi kerak?
      if (calculatedBusinessProfit > 0) {
        console.log(`   🔢 Agar reys tugallansa: ${calculatedBusinessProfit.toLocaleString()} so'm qarz bo'ladi`);
        
        if (Math.abs(calculatedBusinessProfit - 7090000) < 1000) {
          console.log(`   ✅ Bu sizning aytgan qarzga yaqin!`);
          console.log(`   💡 Ehtimol reys tugallangan, lekin status yangilanmagan`);
        }
      }
    }

    console.log(`\n🔧 TAVSIYA:`);
    if (flight.status === 'active' && calculatedBusinessProfit > 0) {
      console.log(`   1. Reysni 'completed' statusga o'tkazish`);
      console.log(`   2. driverOwes ni ${calculatedBusinessProfit.toLocaleString()} so'm qilish`);
      console.log(`   3. Keyin previousDebt tizimini ishlatish`);
    } else {
      console.log(`   1. Ma'lumotlarni qo'lda tekshirish`);
      console.log(`   2. Qarz manbai aniqlanishi kerak`);
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

deepCheckSardorFlight();