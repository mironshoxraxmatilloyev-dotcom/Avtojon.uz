require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const flightSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  totalPayment: Number,
  roadMoney: Number,
  totalGivenBudget: Number,
  lightExpenses: Number,
  heavyExpenses: Number,
  totalExpenses: Number,
  netProfit: Number,
  driverProfitAmount: Number,
  driverOwes: Number,
  businessProfit: Number,
  driverPaymentStatus: String,
  driverPaidAmount: Number,
  driverPayments: Array,
  createdAt: Date
}, { collection: 'flights' });

const driverSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  phone: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'drivers' });

const Flight = mongoose.model('Flight', flightSchema);
const Driver = mongoose.model('Driver', driverSchema);

async function checkShuhratDriverOwes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Shuhrat haydovchini topish
    const driver = await Driver.findOne({ fullName: /shuhrat/i });
    
    if (!driver) {
      console.log('❌ Shuhrat topilmadi');
      return;
    }
    
    console.log('👤 HAYDOVCHI:');
    console.log('='.repeat(80));
    console.log('Ism:', driver.fullName);
    console.log('Username:', driver.username);
    console.log('Driver ID:', driver._id);
    console.log('');

    // Barcha marshrutlarni topish
    const flights = await Flight.find({ 
      driver: driver._id,
      status: { $in: ['completed', 'active'] }
    }).sort({ createdAt: -1 });
    
    console.log('✈️  MARSHRUTLAR:', flights.length, 'ta');
    console.log('='.repeat(80));
    
    let totalDriverOwes = 0;
    let totalPaidAmount = 0;
    const flightDetails = [];
    
    flights.forEach((f, index) => {
      // API logikasini takrorlash
      const totalIncome = (f.totalPayment || 0) + (f.roadMoney || f.totalGivenBudget || 0);
      const lightExpenses = f.lightExpenses || 0;
      const heavyExpenses = f.heavyExpenses || 0;
      const totalExpenses = f.totalExpenses || 0;
      const netProfit = f.netProfit || (totalIncome - lightExpenses);
      const driverProfitAmount = f.driverProfitAmount || 0;

      let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
      if (calculatedDriverOwes === 0 && netProfit > 0) {
        calculatedDriverOwes = netProfit - driverProfitAmount;
      }

      const paidAmount = f.driverPaidAmount || 0;
      const remaining = calculatedDriverOwes - paidAmount;

      if (calculatedDriverOwes > 0) {
        totalDriverOwes += calculatedDriverOwes;
        totalPaidAmount += paidAmount;
        
        flightDetails.push({
          index: index + 1,
          id: f._id,
          status: f.status,
          totalIncome,
          lightExpenses,
          heavyExpenses,
          netProfit,
          driverProfitAmount,
          driverOwes: calculatedDriverOwes,
          paidAmount,
          remaining,
          paymentStatus: f.driverPaymentStatus,
          createdAt: f.createdAt
        });
      }
    });
    
    console.log('📊 QARZ BO\'LGAN MARSHRUTLAR:', flightDetails.length, 'ta');
    console.log('='.repeat(80));
    
    flightDetails.forEach(detail => {
      console.log(`${detail.index}. Flight ${detail.id}`);
      console.log(`   Status: ${detail.status}`);
      console.log(`   Jami daromad: ${detail.totalIncome.toLocaleString()} so'm`);
      console.log(`   Yengil xarajat: ${detail.lightExpenses.toLocaleString()} so'm`);
      console.log(`   Og'ir xarajat: ${detail.heavyExpenses.toLocaleString()} so'm`);
      console.log(`   Sof foyda: ${detail.netProfit.toLocaleString()} so'm`);
      console.log(`   Haydovchi ulushi: ${detail.driverProfitAmount.toLocaleString()} so'm`);
      console.log(`   ⚠️  Haydovchi berishi kerak (driverOwes): ${detail.driverOwes.toLocaleString()} so'm`);
      console.log(`   ✅ To'langan: ${detail.paidAmount.toLocaleString()} so'm`);
      console.log(`   💰 Qolgan qarz: ${detail.remaining.toLocaleString()} so'm`);
      console.log(`   📅 Sana: ${detail.createdAt}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('📈 JAMI STATISTIKA:');
    console.log('   Jami driverOwes (barcha marshrutlar):', totalDriverOwes.toLocaleString(), 'so\'m');
    console.log('   Jami to\'langan:', totalPaidAmount.toLocaleString(), 'so\'m');
    console.log('   Qolgan qarz:', (totalDriverOwes - totalPaidAmount).toLocaleString(), 'so\'m');
    console.log('');

    // Dublikat tekshiruvi
    console.log('🔍 DUBLIKAT TEKSHIRUVI:');
    console.log('='.repeat(80));
    
    const groupedByAmount = {};
    flightDetails.forEach(detail => {
      const key = `${detail.driverOwes}_${detail.createdAt.toISOString().split('T')[0]}`;
      if (!groupedByAmount[key]) {
        groupedByAmount[key] = [];
      }
      groupedByAmount[key].push(detail);
    });
    
    let hasDuplicates = false;
    for (const [key, group] of Object.entries(groupedByAmount)) {
      if (group.length > 1) {
        hasDuplicates = true;
        const [amount, date] = key.split('_');
        console.log(`⚠️  ${date} - ${amount} so'm: ${group.length} marta`);
        group.forEach(d => {
          console.log(`   - Flight ${d.id} | Status: ${d.status}`);
        });
        console.log('');
      }
    }
    
    if (!hasDuplicates) {
      console.log('✅ Dublikat marshrutlar yo\'q');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkShuhratDriverOwes();
