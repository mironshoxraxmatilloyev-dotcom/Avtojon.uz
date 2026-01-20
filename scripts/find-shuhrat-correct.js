require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const driverSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  phone: String,
  currentBalance: Number,
  totalEarnings: Number,
  pendingEarnings: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expenses: [{
    flightId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    timing: String,
    description: String,
    date: Date
  }],
  createdAt: Date
}, { collection: 'drivers' });

const userSchema = new mongoose.Schema({
  username: String,
  role: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' }
}, { collection: 'users' });

const businessmanSchema = new mongoose.Schema({
  username: String,
  phone: String
}, { collection: 'businessmen' });

const Driver = mongoose.model('Driver', driverSchema);
const User = mongoose.model('User', userSchema);
const Businessman = mongoose.model('Businessman', businessmanSchema);

async function findShuhrat() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Shuhrat ismli haydovchilarni topish
    const drivers = await Driver.find({ 
      fullName: /shuhrat/i 
    });
    
    console.log('🚗 SHUHRAT ISMLI HAYDOVCHILAR:', drivers.length, 'ta');
    console.log('='.repeat(80));
    
    for (const driver of drivers) {
      console.log('👤 Ism:', driver.fullName);
      console.log('🔐 Username:', driver.username);
      console.log('📱 Telefon:', driver.phone);
      console.log('💰 Current Balance:', driver.currentBalance?.toLocaleString() || 0, 'so\'m');
      console.log('💵 Total Earnings:', driver.totalEarnings?.toLocaleString() || 0, 'so\'m');
      console.log('⏳ Pending Earnings:', driver.pendingEarnings?.toLocaleString() || 0, 'so\'m');
      console.log('🆔 Driver ID:', driver._id);
      console.log('👤 User ID:', driver.user);
      
      // User ma'lumotlarini olish
      if (driver.user) {
        const user = await User.findById(driver.user);
        if (user && user.businessmanId) {
          const businessman = await Businessman.findById(user.businessmanId);
          if (businessman) {
            console.log('👔 Businessman:', businessman.username, '|', businessman.phone);
          }
        }
      }
      
      console.log('📅 Yaratilgan:', driver.createdAt);
      console.log('');

      // Xarajatlarni tekshirish
      if (driver.expenses && driver.expenses.length > 0) {
        console.log('💳 XARAJATLAR:', driver.expenses.length, 'ta');
        console.log('-'.repeat(80));
        
        let totalExpenses = 0;
        const expenseGroups = {};
        
        driver.expenses.forEach((expense, index) => {
          const amount = expense.amount || 0;
          totalExpenses += amount;
          
          const dateKey = expense.date ? expense.date.toISOString().split('T')[0] : 'no-date';
          const amountKey = `${dateKey}_${amount}_${expense.type}_${expense.timing}`;
          
          if (!expenseGroups[amountKey]) {
            expenseGroups[amountKey] = [];
          }
          expenseGroups[amountKey].push({
            id: expense._id,
            time: expense.date ? expense.date.toISOString() : 'no-date',
            type: expense.type,
            timing: expense.timing,
            description: expense.description,
            flightId: expense.flightId
          });
          
          if (index < 30) { // Birinchi 30 tasini ko'rsatish
            console.log(`${index + 1}. ${expense.type} (${expense.timing}) - ${amount.toLocaleString()} so'm`);
            console.log(`   📅 ${expense.date ? expense.date.toISOString() : 'Sana yo\'q'}`);
            console.log(`   📝 ${expense.description || 'Tavsif yo\'q'}`);
            console.log(`   ✈️  Flight: ${expense.flightId || 'Yo\'q'}`);
            console.log(`   🆔 ${expense._id}`);
            console.log('');
          }
        });
        
        if (driver.expenses.length > 30) {
          console.log(`... va yana ${driver.expenses.length - 30} ta xarajat\n`);
        }
        
        console.log('='.repeat(80));
        console.log('📊 JAMI XARAJATLAR:', totalExpenses.toLocaleString(), 'so\'m');
        console.log('');

        // Dublikatlarni topish
        console.log('🔍 DUBLIKAT TEKSHIRUVI:');
        console.log('-'.repeat(80));
        let hasDuplicates = false;
        let duplicateAmount = 0;
        
        for (const [key, group] of Object.entries(expenseGroups)) {
          if (group.length > 1) {
            hasDuplicates = true;
            const parts = key.split('_');
            const date = parts[0];
            const amount = parts[1];
            const type = parts[2];
            const timing = parts[3];
            
            console.log(`⚠️  ${date} - ${type} (${timing}) - ${amount} so'm: ${group.length} marta qo'shilgan`);
            group.forEach(p => {
              console.log(`   - ${p.id} | ${p.time} | Flight: ${p.flightId || 'Yo\'q'}`);
              console.log(`     ${p.description || ''}`);
            });
            
            // Ortiqcha qo'shilgan summa
            duplicateAmount += parseInt(amount) * (group.length - 1);
            console.log(`   💸 Ortiqcha: ${(parseInt(amount) * (group.length - 1)).toLocaleString()} so'm`);
            console.log('');
          }
        }
        
        if (!hasDuplicates) {
          console.log('✅ Dublikat xarajatlar yo\'q');
        } else {
          console.log('='.repeat(80));
          console.log('💸 JAMI ORTIQCHA QO\'SHILGAN:', duplicateAmount.toLocaleString(), 'so\'m');
          console.log('✅ TO\'G\'RI BALANCE BO\'LISHI KERAK:', (driver.currentBalance - duplicateAmount).toLocaleString(), 'so\'m');
        }
      } else {
        console.log('💳 Xarajatlar yo\'q');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Agar Shuhrat topilmasa, barcha haydovchilarni ko'rsatish
    if (drivers.length === 0) {
      console.log('❌ Shuhrat topilmadi. Barcha haydovchilarni ko\'rsatamiz:\n');
      
      const allDrivers = await Driver.find({}).sort({ currentBalance: -1 }).limit(20);
      console.log('🚗 ENG KATTA BALANSGA EGA HAYDOVCHILAR (20 ta):');
      console.log('='.repeat(80));
      
      for (const driver of allDrivers) {
        console.log(`👤 ${driver.fullName || driver.username || 'Ism yo\'q'} | 💰 ${driver.currentBalance?.toLocaleString() || 0} so'm`);
        console.log(`   📱 ${driver.phone || 'Tel yo\'q'}`);
        console.log(`   🆔 ${driver._id}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findShuhrat();
