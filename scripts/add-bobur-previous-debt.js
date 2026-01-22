const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Driver = require('../apps/api/src/models/Driver');

async function addBoburPreviousDebt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Bobur haydovchini topish
    const bobur = await Driver.findOne({ fullName: /bobur/i });
    if (!bobur) {
      console.log('❌ Bobur topilmadi');
      return;
    }

    console.log('\n👤 BOBUR (oldin):');
    console.log('Avvalgi qarz:', (bobur.previousDebt || 0).toLocaleString(), 'so\'m');

    // Test uchun avvalgi qarz qo'shish
    // Siz aytgan: 16,865,000 + 15,453,000 = 32,318,000
    // Demak avvalgi qarz: 16,865,000 - 15,453,000 = 1,412,000
    const testPreviousDebt = 1412000;
    
    bobur.previousDebt = testPreviousDebt;
    await bobur.save();

    console.log('\n👤 BOBUR (keyin):');
    console.log('Avvalgi qarz:', bobur.previousDebt.toLocaleString(), 'so\'m');

    console.log('\n🎯 KUTILAYOTGAN NATIJA:');
    console.log('Joriy reys (driverOwes): 15,453,000 so\'m');
    console.log('Avvalgi qarz: 1,412,000 so\'m');
    console.log('Header da jami: 16,865,000 so\'m');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addBoburPreviousDebt();