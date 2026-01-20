require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const driverSchema = new mongoose.Schema({
  name: String,
  phone: String,
  licenseNumber: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  balance: { type: Number, default: 0 },
  createdAt: Date
}, { collection: 'drivers' });

const businessmanSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  createdAt: Date
}, { collection: 'businessmen' });

const paymentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  amount: Number,
  type: String,
  description: String,
  createdAt: Date
}, { collection: 'payments' });

const Driver = mongoose.model('Driver', driverSchema);
const Businessman = mongoose.model('Businessman', businessmanSchema);
const Payment = mongoose.model('Payment', paymentSchema);

async function findDriverByBalance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // 34,318,000 yoki shunga yaqin balansga ega haydovchilarni topish
    const targetBalance = 34318000;
    const drivers = await Driver.find({
      balance: { $gte: targetBalance - 100000, $lte: targetBalance + 100000 }
    });
    
    console.log(`🔍 ${targetBalance.toLocaleString()} so'm atrofida balansga ega haydovchilar:`, drivers.length, 'ta');
    console.log('='.repeat(80));
    
    for (const driver of drivers) {
      console.log('👤 Ism:', driver.name);
      console.log('📱 Telefon:', driver.phone);
      console.log('💰 Balance:', driver.balance?.toLocaleString() || 0, 'so\'m');
      console.log('🆔 Driver ID:', driver._id);
      console.log('🏢 Businessman ID:', driver.businessmanId);
      
      // Businessman ma'lumotlarini olish
      const businessman = await Businessman.findById(driver.businessmanId);
      if (businessman) {
        console.log('👔 Businessman:', businessman.username, '|', businessman.phone);
      }
      
      console.log('📅 Yaratilgan:', driver.createdAt);
      console.log('');

      // To'lovlarni tekshirish
      const payments = await Payment.find({ 
        driverId: driver._id 
      }).sort({ createdAt: -1 });
      
      console.log('💳 TO\'LOVLAR:', payments.length, 'ta');
      console.log('-'.repeat(80));
      
      let totalPayments = 0;
      const paymentGroups = {};
      
      payments.forEach((payment, index) => {
        const amount = payment.amount || 0;
        totalPayments += amount;
        
        const dateKey = payment.createdAt.toISOString().split('T')[0];
        const timeKey = payment.createdAt.toISOString();
        const amountKey = `${dateKey}_${amount}_${payment.type}`;
        
        if (!paymentGroups[amountKey]) {
          paymentGroups[amountKey] = [];
        }
        paymentGroups[amountKey].push({
          id: payment._id,
          time: timeKey,
          type: payment.type,
          description: payment.description
        });
        
        if (index < 20) { // Faqat birinchi 20 tasini ko'rsatish
          console.log(`${index + 1}. ${payment.type} - ${amount.toLocaleString()} so'm`);
          console.log(`   📅 ${timeKey}`);
          console.log(`   📝 ${payment.description || 'Tavsif yo\'q'}`);
          console.log(`   🆔 ${payment._id}`);
          console.log('');
        }
      });
      
      if (payments.length > 20) {
        console.log(`... va yana ${payments.length - 20} ta to'lov\n`);
      }
      
      console.log('='.repeat(80));
      console.log('📊 JAMI TO\'LOVLAR:', totalPayments.toLocaleString(), 'so\'m');
      console.log('💰 DB BALANCE:', driver.balance?.toLocaleString() || 0, 'so\'m');
      console.log('');

      // Dublikatlarni topish
      console.log('🔍 DUBLIKAT TEKSHIRUVI:');
      console.log('-'.repeat(80));
      let hasDuplicates = false;
      let duplicateAmount = 0;
      
      for (const [key, group] of Object.entries(paymentGroups)) {
        if (group.length > 1) {
          hasDuplicates = true;
          const parts = key.split('_');
          const date = parts[0];
          const amount = parts[1];
          const type = parts[2];
          
          console.log(`⚠️  ${date} - ${type} - ${amount} so'm: ${group.length} marta qo'shilgan`);
          group.forEach(p => {
            console.log(`   - ${p.id} | ${p.time}`);
          });
          
          // Ortiqcha qo'shilgan summa
          duplicateAmount += parseInt(amount) * (group.length - 1);
          console.log(`   💸 Ortiqcha: ${(parseInt(amount) * (group.length - 1)).toLocaleString()} so'm`);
          console.log('');
        }
      }
      
      if (!hasDuplicates) {
        console.log('✅ Dublikat to\'lovlar yo\'q');
      } else {
        console.log('='.repeat(80));
        console.log('💸 JAMI ORTIQCHA QO\'SHILGAN:', duplicateAmount.toLocaleString(), 'so\'m');
        console.log('✅ TO\'G\'RI BALANCE BO\'LISHI KERAK:', (driver.balance - duplicateAmount).toLocaleString(), 'so\'m');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findDriverByBalance();
