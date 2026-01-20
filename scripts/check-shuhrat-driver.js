require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Models
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' }
}, { collection: 'users' });

const driverSchema = new mongoose.Schema({
  name: String,
  phone: String,
  licenseNumber: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  balance: { type: Number, default: 0 },
  createdAt: Date
}, { collection: 'drivers' });

const paymentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  amount: Number,
  type: String,
  description: String,
  createdAt: Date
}, { collection: 'payments' });

const flightSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  status: String,
  totalIncome: Number,
  driverShare: Number,
  createdAt: Date
}, { collection: 'flights' });

const User = mongoose.model('User', userSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Flight = mongoose.model('Flight', flightSchema);

async function checkShuhratDriver() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // 1. islamov userini topish
    const user = await User.findOne({ username: 'islamov' });
    if (!user) {
      console.log('❌ islamov user topilmadi');
      return;
    }
    console.log('👤 User:', user.username);
    console.log('🆔 BusinessmanId:', user.businessmanId);
    console.log('');

    // 2. Shuhrat haydovchini topish
    const driver = await Driver.findOne({ 
      name: 'Shuhrat',
      businessmanId: user.businessmanId 
    });
    
    if (!driver) {
      console.log('❌ Shuhrat haydovchi topilmadi');
      return;
    }
    
    console.log('🚗 Haydovchi:', driver.name);
    console.log('📱 Telefon:', driver.phone);
    console.log('💰 Balance (DB):', driver.balance?.toLocaleString(), 'so\'m');
    console.log('📅 Yaratilgan:', driver.createdAt);
    console.log('');

    // 3. Barcha to'lovlarni tekshirish
    const payments = await Payment.find({ 
      driverId: driver._id 
    }).sort({ createdAt: -1 });
    
    console.log('💳 BARCHA TO\'LOVLAR:', payments.length, 'ta');
    console.log('='.repeat(80));
    
    let totalPayments = 0;
    const paymentsByDate = {};
    
    payments.forEach((payment, index) => {
      const dateStr = payment.createdAt.toISOString();
      const amount = payment.amount || 0;
      totalPayments += amount;
      
      console.log(`${index + 1}. ${payment.type} - ${amount.toLocaleString()} so'm`);
      console.log(`   📅 ${dateStr}`);
      console.log(`   📝 ${payment.description || 'Tavsif yo\'q'}`);
      console.log(`   🆔 ${payment._id}`);
      console.log('');
      
      // Bir xil sanada bir xil summa bormi?
      const key = `${dateStr.split('T')[0]}_${amount}`;
      if (!paymentsByDate[key]) {
        paymentsByDate[key] = [];
      }
      paymentsByDate[key].push(payment);
    });
    
    console.log('='.repeat(80));
    console.log('📊 JAMI TO\'LOVLAR:', totalPayments.toLocaleString(), 'so\'m');
    console.log('');

    // 4. Dublikat to'lovlarni topish
    console.log('🔍 DUBLIKAT TO\'LOVLAR:');
    console.log('='.repeat(80));
    let duplicatesFound = false;
    
    for (const [key, paymentGroup] of Object.entries(paymentsByDate)) {
      if (paymentGroup.length > 1) {
        duplicatesFound = true;
        const [date, amount] = key.split('_');
        console.log(`⚠️  ${date} sanada ${amount} so'm - ${paymentGroup.length} marta`);
        paymentGroup.forEach(p => {
          console.log(`   - ${p._id} (${p.createdAt.toISOString()})`);
        });
        console.log('');
      }
    }
    
    if (!duplicatesFound) {
      console.log('✅ Dublikat to\'lovlar topilmadi');
    }
    console.log('');

    // 5. Flightlardan hisoblash
    const flights = await Flight.find({ 
      driverId: driver._id,
      status: 'completed'
    });
    
    let totalDriverShare = 0;
    flights.forEach(flight => {
      totalDriverShare += flight.driverShare || 0;
    });
    
    console.log('✈️  FLIGHTLAR:');
    console.log('   Tugallangan flightlar:', flights.length, 'ta');
    console.log('   Jami haydovchi ulushi:', totalDriverShare.toLocaleString(), 'so\'m');
    console.log('');

    // 6. Hisob-kitob
    console.log('📈 HISOB-KITOB:');
    console.log('='.repeat(80));
    console.log('   Flightlardan ulush:', totalDriverShare.toLocaleString(), 'so\'m');
    console.log('   To\'lovlar jami:', totalPayments.toLocaleString(), 'so\'m');
    console.log('   Qo\'lida qolishi kerak:', (totalDriverShare - totalPayments).toLocaleString(), 'so\'m');
    console.log('   DB dagi balance:', driver.balance?.toLocaleString(), 'so\'m');
    console.log('');

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  }
}

checkShuhratDriver();
