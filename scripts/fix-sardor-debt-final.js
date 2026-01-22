const mongoose = require('mongoose');
require('dotenv').config();

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

    console.log('\n👤 SARDOR (OLDIN):');
    console.log('ID:', sardor._id);
    console.log('Ism:', sardor.fullName);
    console.log('Avvalgi qarz (previousDebt):', (sardor.previousDebt || 0).toLocaleString(), 'so\'m');
    console.log('Qo\'lidagi pul (currentBalance):', (sardor.currentBalance || 0).toLocaleString(), 'so\'m');

    // Sizning aytganingiz bo'yicha 7,090,000 so'm qarz o'rnatish
    sardor.previousDebt = 7090000;
    await sardor.save();

    console.log('\n👤 SARDOR (KEYIN):');
    console.log('Avvalgi qarz (previousDebt):', sardor.previousDebt.toLocaleString(), 'so\'m');
    console.log('Qo\'lidagi pul (currentBalance):', (sardor.currentBalance || 0).toLocaleString(), 'so\'m');

    console.log('\n🎯 WEB HEADER DA KO\'RSATILISHI KERAK:');
    console.log('Faol reys (driverOwes): 0 so\'m (chunki faol reys yo\'q yoki yopilgan)');
    console.log('Avvalgi qarz (previousDebt): 7,090,000 so\'m');
    console.log('JAMI (totalDriverOwes): 7,090,000 so\'m');
    
    console.log('\n✅ Sardor qarzi to\'g\'rilandi!');
    console.log('Endi web frontend\'da header to\'g\'ri ko\'rsatadi.');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSardorDebt();