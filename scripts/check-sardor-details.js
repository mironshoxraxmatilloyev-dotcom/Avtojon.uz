const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function checkSardorDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log('\n👤 SARDOR MA\'LUMOTLARI:');
    console.log('ID:', sardor._id);
    console.log('Ism:', sardor.fullName);
    console.log('Avvalgi qarz (previousDebt):', (sardor.previousDebt || 0).toLocaleString(), 'so\'m');
    console.log('Qo\'lidagi pul (currentBalance):', (sardor.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('Oylik foizi:', sardor.driverProfitPercent || 'Belgilanmagan');

    // Sardor ning barcha reyslarini topish
    const sardorFlights = await Flight.find({ 
      driver: sardor._id 
    }).sort({ createdAt: -1 });

    console.log(`\n📊 SARDOR REYSLARI (${sardorFlights.length} ta):`);

    let totalOwes = 0;
    let totalPaid = 0;
    let activeFlights = 0;
    let completedFlights = 0;

    sardorFlights.forEach((flight, index) => {
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

    // SIZ AYTGAN QARZ BILAN SOLISHTIRISH
    console.log('\n🎯 SIZ AYTGAN MA\'LUMOT BILAN SOLISHTIRISH:');
    console.log('Siz aytdingiz: 7,090,000 so\'m qarz bor');
    console.log(`Bizda hozir: ${(totalOwes - totalPaid).toLocaleString()} so'm`);
    console.log(`previousDebt da: ${(sardor.previousDebt || 0).toLocaleString()} so'm`);
    
    const expectedTotal = (totalOwes - totalPaid) + (sardor.previousDebt || 0);
    console.log(`Jami kutilayotgan: ${expectedTotal.toLocaleString()} so'm`);

    // AGAR 7,090,000 TO'G'RI BO'LSA
    if (expectedTotal !== 7090000) {
      console.log('\n⚠️  FARQ BOR!');
      console.log('Ehtimol:');
      console.log('1. previousDebt maydonida saqlanmagan');
      console.log('2. Boshqa joyda saqlanmoqda');
      console.log('3. Manual hisoblash kerak');
      
      // previousDebt ni to'g'rilash taklifi
      const missingDebt = 7090000 - expectedTotal;
      if (missingDebt > 0) {
        console.log(`\n💡 TAKLIF: previousDebt ga ${missingDebt.toLocaleString()} so'm qo'shish kerak`);
      }
    } else {
      console.log('✅ Raqamlar to\'g\'ri');
    }

    // YANGI TIZIM BO'YICHA HEADER DA KO'RSATILISHI KERAK
    console.log('\n🖥️  WEB HEADER DA KO\'RSATILISHI KERAK:');
    const currentFlightOwes = sardorFlights.find(f => f.status === 'active')?.driverOwes || 0;
    const totalForHeader = currentFlightOwes + (sardor.previousDebt || 0) + (totalOwes - totalPaid);
    console.log(`totalDriverOwes = ${currentFlightOwes} + ${(sardor.previousDebt || 0)} + ${(totalOwes - totalPaid)} = ${totalForHeader.toLocaleString()} so'm`);

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkSardorDetails();