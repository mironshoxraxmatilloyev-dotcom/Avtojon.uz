const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Driver = require('../apps/api/src/models/Driver');

async function fixSardorDebt() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor topilmadi');
      return;
    }

    console.log('\n👤 SARDOR (oldin):');
    console.log('Avvalgi qarz:', (sardor.previousDebt || 0).toLocaleString(), 'so\'m');

    // Sizning aytganingiz bo'yicha 7,090,000 so'm qarz qo'shish
    sardor.previousDebt = 7090000;
    await sardor.save();

    console.log('\n👤 SARDOR (keyin):');
    console.log('Avvalgi qarz:', sardor.previousDebt.toLocaleString(), 'so\'m');

    console.log('\n🎯 ENDI WEB HEADER DA KO\'RSATILISHI KERAK:');
    console.log('Faol reys (driverOwes): 0 so\'m');
    console.log('Avvalgi qarz (previousDebt): 7,090,000 so\'m');
    console.log('JAMI (totalDriverOwes): 7,090,000 so\'m');

    console.log('\n✅ Sardor ning qarzi to\'g\'rilandi!');
    console.log('Endi web da Sardor ning reysini ochsangiz, header da 7,090,000 so\'m ko\'rsatilishi kerak.');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSardorDebt();