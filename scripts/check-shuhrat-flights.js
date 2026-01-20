require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const flightSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  totalIncome: Number,
  driverShare: Number,
  driverSharePercentage: Number,
  expenses: [{
    amount: Number,
    type: String,
    timing: String,
    description: String,
    date: Date
  }],
  createdAt: Date
}, { collection: 'flights' });

const driverSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  phone: String,
  currentBalance: Number,
  totalEarnings: Number,
  pendingEarnings: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'drivers' });

const Flight = mongoose.model('Flight', flightSchema);
const Driver = mongoose.model('Driver', driverSchema);

async function checkShuhratFlights() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Shuhrat haydovchini topish
    const driver = await Driver.findOne({ fullName: /shuhrat/i });
    
    if (!driver) {
      console.log('❌ Shuhrat topilmadi');
      return;
    }
    
    console.log('👤 HAYDOVCHI MA\'LUMOTLARI:');
    console.log('='.repeat(80));
    console.log('Ism:', driver.fullName);
    console.log('Username:', driver.username);
    console.log('Telefon:', driver.phone);
    console.log('Current Balance:', driver.currentBalance?.toLocaleString() || 0, 'so\'m');
    console.log('Total Earnings:', driver.totalEarnings?.toLocaleString() || 0, 'so\'m');
    console.log('Pending Earnings:', driver.pendingEarnings?.toLocaleString() || 0, 'so\'m');
    console.log('Driver ID:', driver._id);
    console.log('');

    // Flightlarni topish
    const flights = await Flight.find({ driver: driver._id }).sort({ createdAt: -1 });
    
    console.log('✈️  FLIGHTLAR:', flights.length, 'ta');
    console.log('='.repeat(80));
    
    let totalDriverShare = 0;
    let totalIncome = 0;
    let totalExpenses = 0;
    
    flights.forEach((flight, index) => {
      const driverShare = flight.driverShare || 0;
      const income = flight.totalIncome || 0;
      totalDriverShare += driverShare;
      totalIncome += income;
      
      // Flight xarajatlari
      let flightExpenses = 0;
      if (flight.expenses && flight.expenses.length > 0) {
        flight.expenses.forEach(exp => {
          flightExpenses += exp.amount || 0;
        });
      }
      totalExpenses += flightExpenses;
      
      if (index < 20) { // Birinchi 20 tasini ko'rsatish
        console.log(`${index + 1}. Flight ${flight._id}`);
        console.log(`   Status: ${flight.status}`);
        console.log(`   Jami daromad: ${income.toLocaleString()} so'm`);
        console.log(`   Haydovchi ulushi: ${driverShare.toLocaleString()} so'm (${flight.driverSharePercentage || 0}%)`);
        console.log(`   Xarajatlar: ${flightExpenses.toLocaleString()} so'm (${flight.expenses?.length || 0} ta)`);
        console.log(`   Sana: ${flight.createdAt}`);
        console.log('');
      }
    });
    
    if (flights.length > 20) {
      console.log(`... va yana ${flights.length - 20} ta flight\n`);
    }
    
    console.log('='.repeat(80));
    console.log('📊 JAMI STATISTIKA:');
    console.log('   Jami daromad:', totalIncome.toLocaleString(), 'so\'m');
    console.log('   Jami haydovchi ulushi:', totalDriverShare.toLocaleString(), 'so\'m');
    console.log('   Jami xarajatlar:', totalExpenses.toLocaleString(), 'so\'m');
    console.log('   Qo\'lida qolishi kerak:', (totalDriverShare - totalExpenses).toLocaleString(), 'so\'m');
    console.log('');
    console.log('💰 DB DAGI MA\'LUMOTLAR:');
    console.log('   Current Balance:', driver.currentBalance?.toLocaleString() || 0, 'so\'m');
    console.log('   Total Earnings:', driver.totalEarnings?.toLocaleString() || 0, 'so\'m');
    console.log('   Pending Earnings:', driver.pendingEarnings?.toLocaleString() || 0, 'so\'m');
    console.log('');

    // Xarajatlarni batafsil ko'rish
    console.log('💳 XARAJATLAR BATAFSIL:');
    console.log('='.repeat(80));
    
    const expenseGroups = {};
    let expenseIndex = 0;
    
    for (const flight of flights) {
      if (flight.expenses && flight.expenses.length > 0) {
        flight.expenses.forEach(expense => {
          const amount = expense.amount || 0;
          const dateKey = expense.date ? expense.date.toISOString().split('T')[0] : 'no-date';
          const amountKey = `${dateKey}_${amount}_${expense.type}_${expense.timing}`;
          
          if (!expenseGroups[amountKey]) {
            expenseGroups[amountKey] = [];
          }
          expenseGroups[amountKey].push({
            flightId: flight._id,
            expenseId: expense._id,
            time: expense.date ? expense.date.toISOString() : 'no-date',
            type: expense.type,
            timing: expense.timing,
            description: expense.description
          });
          
          if (expenseIndex < 30) {
            console.log(`${expenseIndex + 1}. ${expense.type} (${expense.timing}) - ${amount.toLocaleString()} so'm`);
            console.log(`   📅 ${expense.date ? expense.date.toISOString() : 'Sana yo\'q'}`);
            console.log(`   📝 ${expense.description || 'Tavsif yo\'q'}`);
            console.log(`   ✈️  Flight: ${flight._id}`);
            console.log('');
            expenseIndex++;
          }
        });
      }
    }
    
    if (expenseIndex > 30) {
      console.log(`... va yana ${expenseIndex - 30} ta xarajat\n`);
    }
    
    // Dublikatlarni topish
    console.log('🔍 DUBLIKAT XARAJATLAR:');
    console.log('='.repeat(80));
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
          console.log(`   - Flight: ${p.flightId} | Expense: ${p.expenseId}`);
          console.log(`     ${p.time} | ${p.description || ''}`);
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
      console.log('💸 JAMI ORTIQCHA QO\'SHILGAN XARAJAT:', duplicateAmount.toLocaleString(), 'so\'m');
      console.log('✅ TO\'G\'RI XARAJAT BO\'LISHI KERAK:', (totalExpenses - duplicateAmount).toLocaleString(), 'so\'m');
      console.log('✅ TO\'G\'RI BALANCE BO\'LISHI KERAK:', (totalDriverShare - (totalExpenses - duplicateAmount)).toLocaleString(), 'so\'m');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkShuhratFlights();
