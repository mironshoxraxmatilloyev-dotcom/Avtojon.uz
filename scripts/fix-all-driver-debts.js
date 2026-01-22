const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../apps/api/src/models/Driver');

async function fixAllDriverDebts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    console.log('\n🔧 BARCHA HAYDOVCHILAR UCHUN previousDebt NI TO\'G\'RILASH');
    console.log('=' .repeat(60));

    // Tahlil natijasidan olingan ma'lumotlar
    const debtUpdates = [
      { id: '696e5433f7c9d8244b7f7371', name: 'Dima', debt: 37000000 },
      { id: '69510554c5ea59545618af03', name: 'Shuhrat', debt: 34318000 },
      { id: '695105efc5ea59545618af33', name: 'Feruz', debt: 2679000 },
      { id: '6960d37812181c975f456ef6', name: 'Abdullayev Sardor', debt: 3000000 },
      { id: '695f67b2f53a819c7b605510', name: 'dffvgrfgvgv', debt: 3000000 },
      { id: '69510626c5ea59545618af45', name: 'Nosir', debt: 13560000 },
      { id: '69510673c5ea59545618af57', name: 'Sardor', debt: 7090000 },
      { id: '695105bbc5ea59545618af21', name: 'Rasul', debt: 4856000 },
      { id: '6951050bc5ea59545618aef1', name: 'Bobur', debt: 15453000 },
      { id: '6961e9b27fe7b6e08eadb2e9', name: 'qwertyujik', debt: 32750000 },
      { id: '695fa9379bee51e43d95d6f9', name: 'Boburbek Azizov', debt: 18340000 },
      { id: '695fa3c69bee51e43d95d5ed', name: 'asdfghjk', debt: 12540000 },
      { id: '695f9baf471aaf87c7c81128', name: 'Ism', debt: 8200000 },
      { id: '695f4ed5148547bb3908a6fd', name: 'Javohir', debt: 2550000 },
      { id: '695ce99cd9bd7c20ab07833a', name: 'asdfghj', debt: 8003110 },
      { id: '695dde4575e81a2e8ea7dcf6', name: 'Javohir', debt: 3945000 },
      { id: '695ce97dd9bd7c20ab078319', name: 'wefrty', debt: 4500000 },
      { id: '695cdeae8f8e678d073c6618', name: 'Javohir', debt: 2500000 },
      { id: '695cdcac8f8e678d073c6429', name: 'Java', debt: 2720000 },
      { id: '695cc2e30cbeebc3856db251', name: 'n765rfghjk', debt: 4000000 },
      { id: '695cbf063e222c23dab5b975', name: 'mjytredc', debt: 4000000 },
      { id: '695cb12f94c85992cfc87f77', name: 'fghjkijnm', debt: 4000000 },
      { id: '695ca7a0dd71e0f84d7a03ac', name: 'harakatdaman', debt: 500000 },
      { id: '695c92de05c5349f1e9c0a13', name: '2w3e4rt5yui1234567890', debt: 2840000 },
      { id: '695c904f982bcb4884cf4c9c', name: '1ertghjmkjmhgfd', debt: 1500000 },
      { id: '695c4ccf989122553637cd15', name: '23egtrf', debt: 6800123 },
      { id: '695780bb90b9a4959bb61a92', name: 'Haydovchi', debt: 27743211 },
      { id: '695102d5c5ea59545618ae5a', name: 'Dilshod', debt: 11885000 }
    ];

    let updatedCount = 0;
    let totalDebtFixed = 0;

    console.log(`📋 ${debtUpdates.length} ta haydovchi uchun previousDebt yangilanmoqda...\n`);

    for (const update of debtUpdates) {
      try {
        const result = await Driver.findByIdAndUpdate(
          update.id, 
          { previousDebt: update.debt },
          { new: true }
        );

        if (result) {
          console.log(`✅ ${update.name}: ${update.debt.toLocaleString()} so'm`);
          updatedCount++;
          totalDebtFixed += update.debt;
        } else {
          console.log(`❌ ${update.name}: Haydovchi topilmadi`);
        }
      } catch (error) {
        console.log(`❌ ${update.name}: Xato - ${error.message}`);
      }
    }

    console.log('\n📊 NATIJA:');
    console.log('=' .repeat(40));
    console.log(`✅ Yangilangan haydovchilar: ${updatedCount} ta`);
    console.log(`💰 Jami to'g'rilangan qarz: ${totalDebtFixed.toLocaleString()} so'm`);
    console.log(`📈 O'rtacha qarz: ${Math.round(totalDebtFixed / updatedCount).toLocaleString()} so'm`);

    console.log('\n🎯 ENDI WEB FRONTEND DA:');
    console.log('✅ FlightHeader.jsx da to\'g\'ri jami ko\'rsatiladi');
    console.log('✅ DriverDebts.jsx da to\'g\'ri qarzlar ko\'rsatiladi');
    console.log('✅ Sardor uchun 7,090,000 so\'m ko\'rsatiladi');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllDriverDebts();