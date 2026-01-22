const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Flight = require('../apps/api/src/models/Flight');
const Driver = require('../apps/api/src/models/Driver');

async function investigateSardorDebt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log('\n🔍 SARDOR MA\'LUMOTLARI (DB dan):');
    console.log('ID:', sardor._id);
    console.log('Ism:', sardor.fullName);
    console.log('currentBalance:', (sardor.currentBalance || 0).toLocaleString(), 'so\'m');
    console.log('previousDebt (agar bor bo\'lsa):', (sardor.previousDebt || 0).toLocaleString(), 'so\'m');

    // Sardor ning barcha reyslarini topish
    const sardorFlights = await Flight.find({ 
      driver: sardor._id 
    }).sort({ createdAt: -1 });

    console.log(`\n📊 SARDOR REYSLARI (${sardorFlights.length} ta):`);

    let totalDriverOwes = 0;
    let totalPaid = 0;
    let activeFlights = 0;
    let completedFlights = 0;

    sardorFlights.forEach((flight, index) => {
      console.log(`\n${index + 1}. REYS ID: ${flight._id}`);
      console.log(`   Status: ${flight.status}`);
      console.log(`   Sana: ${flight.createdAt?.toLocaleDateString() || 'N/A'}`);
      console.log(`   driverOwes: ${(flight.driverOwes || 0).toLocaleString()} so'm`);
      console.log(`   driverPaidAmount: ${(flight.driverPaidAmount || 0).toLocaleString()} so'm`);
      console.log(`   driverPaymentStatus: ${flight.driverPaymentStatus || 'pending'}`);
      
      if (flight.driverPayments && flight.driverPayments.length > 0) {
        console.log(`   To'lovlar tarixi:`);
        flight.driverPayments.forEach((payment, i) => {
          console.log(`     ${i + 1}. ${payment.amount?.toLocaleString()} so'm - ${payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'} - ${payment.note || 'Izohi yo\'q'}`);
        });
      }

      if (flight.status === 'active') {
        activeFlights++;
      } else if (flight.status === 'completed') {
        completedFlights++;
      }
      
      totalDriverOwes += flight.driverOwes || 0;
      totalPaid += flight.driverPaidAmount || 0;
    });

    console.log('\n📈 JAMI STATISTIKA:');
    console.log(`Faol reyslar: ${activeFlights} ta`);
    console.log(`Yopilgan reyslar: ${completedFlights} ta`);
    console.log(`Jami driverOwes: ${totalDriverOwes.toLocaleString()} so'm`);
    console.log(`Jami to'langan: ${totalPaid.toLocaleString()} so'm`);
    console.log(`Qolgan qarz (reyslardan): ${(totalDriverOwes - totalPaid).toLocaleString()} so'm`);

    // API endpoint qanday ishlashini simulatsiya qilish
    console.log('\n🔍 API ENDPOINT SIMULATSIYASI (/flights/driver-debts):');
    
    // Faqat driverOwes > 0 bo'lgan reyslarni olish
    const debtsFromAPI = sardorFlights.filter(f => (f.driverOwes || 0) > 0);
    console.log(`API qaytaradigan reyslar soni: ${debtsFromAPI.length} ta`);
    
    const apiTotalDebt = debtsFromAPI.reduce((sum, f) => {
      if (f.driverPaymentStatus === 'paid') return sum;
      const remaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    
    console.log(`API hisoblaydigan jami qarz: ${apiTotalDebt.toLocaleString()} so'm`);

    // SIZ AYTGAN 7,090,000 BILAN SOLISHTIRISH
    console.log('\n🎯 SIZ AYTGAN MA\'LUMOT BILAN TAQQOSLASH:');
    console.log('Siz aytdingiz: 7,090,000 so\'m qarz bor');
    console.log(`API da ko'rsatilmoqda: ${apiTotalDebt.toLocaleString()} so'm`);
    console.log(`Farq: ${(7090000 - apiTotalDebt).toLocaleString()} so'm`);

    if (apiTotalDebt !== 7090000) {
      console.log('\n⚠️  FARQ SABABLARI:');
      console.log('1. Bu qarz previousDebt maydonida saqlanmagan');
      console.log('2. Bu qarz boshqa joyda (masalan, manual hisob-kitobda) saqlanmoqda');
      console.log('3. Bu qarz frontend da faqat ko\'rsatiladi, lekin DB da saqlanmaydi');
      console.log('4. Bu qarz eski tizimdan qolgan va hali migrate qilinmagan');
    }

    // FRONTEND DA QANDAY KO'RSATILISHI KERAK
    console.log('\n🖥️  FRONTEND DA KO\'RSATILISHI KERAK:');
    console.log('FlightHeader.jsx da:');
    console.log(`- driverOwes (joriy reys): ${sardorFlights.find(f => f.status === 'active')?.driverOwes || 0} so'm`);
    console.log(`- previousDebt (avvalgi qarzlar): ${sardor.previousDebt || 0} so'm`);
    console.log(`- totalDriverOwes (header da): ${((sardorFlights.find(f => f.status === 'active')?.driverOwes || 0) + (sardor.previousDebt || 0)).toLocaleString()} so'm`);
    
    console.log('\nDriverDebts.jsx da (hisobotlar qismi):');
    console.log(`- API dan kelayotgan qarz: ${apiTotalDebt.toLocaleString()} so'm`);
    console.log(`- Ko'rsatilishi kerak: 7,090,000 so'm`);

    // YECHIM TAKLIFI
    console.log('\n💡 YECHIM TAKLIFI:');
    console.log('1. Driver modeliga previousDebt maydonini qo\'shish');
    console.log('2. Sardor uchun previousDebt = 7,090,000 qilib o\'rnatish');
    console.log('3. FlightHeader.jsx da totalDriverOwes = driverOwes + previousDebt qilish');
    console.log('4. DriverDebts API da previousDebt ni ham hisobga olish');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

investigateSardorDebt();