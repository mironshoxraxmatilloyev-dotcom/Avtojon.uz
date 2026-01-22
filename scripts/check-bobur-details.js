const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function checkBoburDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Bobur haydovchini topish
    const bobur = await Driver.findOne({ fullName: /bobur/i });
    if (!bobur) {
      console.log('❌ Bobur topilmadi');
      return;
    }

    console.log('\n👤 BOBUR MA\'LUMOTLARI:');
    console.log('ID:', bobur._id);
    console.log('Ism:', bobur.fullName);
    console.log('Avvalgi qarz (DB):', (bobur.previousDebt || 0).toLocaleString(), 'so\'m');
    console.log('Qo\'lidagi pul:', (bobur.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('Oylik foizi:', bobur.driverProfitPercent || 'Belgilanmagan');

    // Bobur ning barcha reyslarini topish
    const boburFlights = await Flight.find({ 
      driver: bobur._id 
    }).sort({ createdAt: -1 });

    console.log(`\n📊 BOBUR REYSLARI (${boburFlights.length} ta):`);

    let totalOwes = 0;
    let totalPaid = 0;
    let activeFlights = 0;
    let completedFlights = 0;

    boburFlights.forEach((flight, index) => {
      console.log(`\n${index + 1}. REYS ID: ${flight._id}`);
      console.log(`   Status: ${flight.status}`);
      console.log(`   Yo'nalish: ${flight.fromCity || 'N/A'} → ${flight.toCity || 'N/A'}`);
      console.log(`   Sana: ${flight.createdAt?.toLocaleDateString() || 'N/A'}`);
      console.log(`   Sof foyda: ${(flight.netProfit || 0).toLocaleString()} so'm`);
      console.log(`   Biznesmen foydasi: ${(flight.businessProfit || 0).toLocaleString()} so'm`);
      console.log(`   Haydovchi ulushi: ${(flight.driverProfitAmount || 0).toLocaleString()} so'm`);
      console.log(`   Haydovchi berishi kerak: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
      console.log(`   To'langan: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
      console.log(`   Qolgan qarz: ${(flight.driverRemainingDebt || 0).toLocaleString()} so'm`);
      console.log(`   To'lov statusi: ${flight.driverPaymentStatus || 'pending'}`);

      if (flight.status === 'active') {
        activeFlights++;
      } else if (flight.status === 'completed') {
        completedFlights++;
        totalOwes += flight.driverOwes || 0;
        totalPaid += flight.driverPaidAmount || 0;
      }
    });

    console.log('\n📈 JAMI STATISTIKA:');
    console.log(`Faol reyslar: ${activeFlights} ta`);
    console.log(`Yopilgan reyslar: ${completedFlights} ta`);
    console.log(`Jami berishi kerak: ${totalOwes.toLocaleString()} so'm`);
    console.log(`Jami to'lagan: ${totalPaid.toLocaleString()} so'm`);
    console.log(`Qolgan qarz: ${(totalOwes - totalPaid).toLocaleString()} so'm`);

    // YANGI TIZIM bo'yicha hisoblash
    console.log('\n🧮 YANGI TIZIM BO\'YICHA HISOBLASH:');
    let newTotalOwes = 0;
    
    boburFlights.forEach(flight => {
      if (flight.status === 'completed') {
        const netProfit = flight.netProfit || 0;
        const businessProfit = flight.businessProfit || 0;
        const driverProfitAmount = flight.driverProfitAmount || 0;
        
        // Agar businessProfit yo'q bo'lsa, uni hisoblash
        let calculatedBusinessProfit = businessProfit;
        if (!businessProfit && netProfit > 0) {
          calculatedBusinessProfit = Math.max(0, netProfit - driverProfitAmount);
        }
        
        // Yangi tizim: sof foyda + biznesmen foydasi
        const newDriverOwes = netProfit + calculatedBusinessProfit;
        newTotalOwes += newDriverOwes;
      }
    });

    console.log(`Hozirgi tizim: ${totalOwes.toLocaleString()} so'm`);
    console.log(`Yangi tizim: ${newTotalOwes.toLocaleString()} so'm`);
    console.log(`Farq: ${(newTotalOwes - totalOwes).toLocaleString()} so'm`);

    // Siz aytgan raqamlar bilan solishtirish
    console.log('\n🎯 SIZ AYTGAN RAQAMLAR BILAN SOLISHTIRISH:');
    console.log('Siz aytdingiz: 16,865,000 + 15,453,000 = 32,318,000 so\'m');
    console.log(`Bizda hozir: ${newTotalOwes.toLocaleString()} so'm`);
    
    if (Math.abs(newTotalOwes - 32318000) < 1000000) {
      console.log('✅ Raqamlar yaqin');
    } else {
      console.log('⚠️  Raqamlar farq qiladi');
    }

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkBoburDetails();