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

const paymentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  amount: Number,
  type: String,
  description: String,
  createdAt: Date
}, { collection: 'payments' });

const Driver = mongoose.model('Driver', driverSchema);
const Payment = mongoose.model('Payment', paymentSchema);

const islamovId = '69510214c5ea59545618ae05';

async function checkIslamovDrivers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // islamov businessmaniga tegishli barcha haydovchilar
    const drivers = await Driver.find({ 
      businessmanId: new mongoose.Types.ObjectId(islamovId)
    });
    
    console.log('🚗 ISLAMOV HAYDOVCHILARI:', drivers.length, 'ta');
    console.log('='.repeat(80));
    
    for (const driver of drivers) {
      console.log('👤 Ism:', driver.name);
      console.log('📱 Telefon:', driver.phone);
      console.log('💰 Balance:', driver.balance?.toLocaleString() || 0, 'so\'m');
      console.log('🆔 Driver ID:', driver._id);
      console.log('📅 Yaratilgan:', driver.createdAt);
      console.log('');

      // To'lovlarni tekshirish
      const payments = await Payment.find({ 
        driverId: driver._id 
      }).sort({ createdAt: -1 });
      
      if (payments.length > 0) {
        console.log('💳 TO\'LOVLAR:', payments.length, 'ta');
        console.log('-'.repeat(80));
        
        let totalPayments = 0;
        const paymentGroups = {};
        
        payments.forEach((payment, index) => {
          const amount = payment.amount || 0;
          totalPayments += amount;
          
          const dateKey = payment.createdAt.toISOString().split('T')[0];
          const amountKey = `${dateKey}_${amount}`;
          
          if (!paymentGroups[amountKey]) {
            paymentGroups[amountKey] = [];
          }
          paymentGroups[amountKey].push({
            id: payment._id,
            time: payment.createdAt.toISOString(),
            type: payment.type,
            description: payment.description
          });
          
          console.log(`${index + 1}. ${payment.type} - ${amount.toLocaleString()} so'm`);
          console.log(`   📅 ${payment.createdAt.toISOString()}`);
          console.log(`   📝 ${payment.description || 'Tavsif yo\'q'}`);
          console.log(`   🆔 ${payment._id}`);
          console.log('');
        });
        
        console.log('='.repeat(80));
        console.log('📊 JAMI TO\'LOVLAR:', totalPayments.toLocaleString(), 'so\'m');
        console.log('💰 DB BALANCE:', driver.balance?.toLocaleString() || 0, 'so\'m');
        console.log('');

        // Dublikatlarni topish
        console.log('🔍 DUBLIKAT TEKSHIRUVI:');
        console.log('-'.repeat(80));
        let hasDuplicates = false;
        
        for (const [key, group] of Object.entries(paymentGroups)) {
          if (group.length > 1) {
            hasDuplicates = true;
            const [date, amount] = key.split('_');
            console.log(`⚠️  ${date} - ${amount} so'm: ${group.length} marta qo'shilgan`);
            group.forEach(p => {
              console.log(`   - ${p.id}`);
              console.log(`     ${p.time} | ${p.type} | ${p.description || ''}`);
            });
            console.log('');
          }
        }
        
        if (!hasDuplicates) {
          console.log('✅ Dublikat to\'lovlar yo\'q');
        }
      } else {
        console.log('💳 To\'lovlar yo\'q');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkIslamovDrivers();
