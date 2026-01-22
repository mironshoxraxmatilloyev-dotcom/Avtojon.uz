require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Driver = require('../apps/api/src/models/Driver');
const Flight = require('../apps/api/src/models/Flight');

async function checkBaxtiyorBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Baxtiyor haydovchisini topish
    const driver = await Driver.findOne({ fullName: /Baxtiyor/i });
    
    if (!driver) {
      console.log('❌ Baxtiyor haydovchisi topilmadi');
      return;
    }

    console.log('👤 Haydovchi:', driver.fullName);
    console.log('💰 Hozirgi balans:', (driver.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('💸 Kutilayotgan daromad:', (driver.pendingEarnings || 0).toLocaleString(), 'so\'m\n');

    // Baxtiyor ning barcha reyslarini topish
    const flights = await Flight.find({ 
      driver: driver._id
    }).sort({ createdAt: -1 });

    console.log('📊 Jami reyslar:', flights.length, 'ta');
    
    const activeFlights = flights.filter(f => f.status === 'active');
    const completedFlights = flights.filter(f => f.status === 'completed');
    
    console.log('🔄 Faol reyslar:', activeFlights.length, 'ta');
    console.log('✅ Yopilgan reyslar:', completedFlights.length, 'ta\n');

    // Faol reyslarni ko'rsatish
    if (activeFlights.length > 0) {
      console.log('🔄 FAOL REYSLAR:');
      activeFlights.forEach((flight, index) => {
        console.log(`\n${index + 1}. ${flight.name || 'Noma\'lum reys'}`);
        console.log('   Status:', flight.status);
        console.log('   Jami kirim:', (flight.totalIncome || 0).toLocaleString(), 'so\'m');
        console.log('   Jami xarajat:', (flight.totalExpenses || 0).toLocaleString(), 'so\'m');
        console.log('   Sof foyda:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
        console.log('   Haydovchi ulushi %:', flight.driverProfitPercent || 0);
        console.log('   Haydovchi ulushi summa:', (flight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
        console.log('   Haydovchi berishi kerak:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
        
        // Xarajatlarni kategoriya bo'yicha ko'rsatish
        const lightExpenses = flight.expenses?.filter(exp => 
          ['fuel_diesel', 'fuel_gas', 'fuel_petrol', 'food', 'toll', 'wash', 'fine', 'repair_small', 'border', 'platon'].includes(exp.type)
        ) || [];
        
        const heavyExpenses = flight.expenses?.filter(exp => 
          ['repair_major', 'tire', 'accident', 'insurance', 'oil', 'filters'].includes(exp.type)
        ) || [];
        
        const lightTotal = lightExpenses.reduce((sum, exp) => sum + (exp.amountInUZS || 0), 0);
        const heavyTotal = heavyExpenses.reduce((sum, exp) => sum + (exp.amountInUZS || 0), 0);
        
        console.log('   Yengil xarajatlar:', lightTotal.toLocaleString(), 'so\'m');
        console.log('   Og\'ir xarajatlar:', heavyTotal.toLocaleString(), 'so\'m');
        
        // Hisobotlar qismidagi pul (4,865,000) ni tekshirish
        const reportAmount = 4865000; // Sizning aytgan summangiz
        console.log('   Hisobotlar qismidagi pul:', reportAmount.toLocaleString(), 'so\'m');
        console.log('   Haydovchi berishi kerak + hisobotlar:', ((flight.driverOwes || 0) + reportAmount).toLocaleString(), 'so\'m');
      });
    }

    // Yopilgan reyslarni ko'rsatish (oxirgi 5 ta)
    if (completedFlights.length > 0) {
      console.log('\n✅ OXIRGI YOPILGAN REYSLAR (5 ta):');
      completedFlights.slice(0, 5).forEach((flight, index) => {
        console.log(`\n${index + 1}. ${flight.name || 'Noma\'lum reys'}`);
        console.log('   Yopilgan sana:', flight.completedAt ? new Date(flight.completedAt).toLocaleDateString() : 'Noma\'lum');
        console.log('   Jami kirim:', (flight.totalIncome || 0).toLocaleString(), 'so\'m');
        console.log('   Sof foyda:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
        console.log('   Haydovchi ulushi:', (flight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
        console.log('   Haydovchi berishi kerak:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
        console.log('   Haydovchi bergan:', (flight.driverPaidAmount || 0).toLocaleString(), 'so\'m');
        console.log('   Qarz holati:', flight.driverPaymentStatus || 'pending');
      });
    }

    // Jami qarzni hisoblash
    const totalDebt = completedFlights.reduce((sum, flight) => {
      if (flight.driverPaymentStatus === 'paid') return sum;
      const remaining = (flight.driverOwes || 0) - (flight.driverPaidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 BAXTIYOR UCHUN XULOSA:');
    console.log('   Hozirgi balans:', (driver.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('   Jami qarz (yopilgan reyslardan):', totalDebt.toLocaleString(), 'so\'m');
    console.log('   Kutilayotgan daromad:', (driver.pendingEarnings || 0).toLocaleString(), 'so\'m');
    console.log('   Hisobotlar qismidagi pul:', '4,865,000 so\'m');
    console.log('   MUAMMO: Hisobotlar puli qo\'shilmayapti!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkBaxtiyorBalance();