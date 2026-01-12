// Duplikat va nofaol shofyorlarni tozalash scripti
// Ishlatish: node scripts/cleanup-drivers.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ulandi');

    const Driver = mongoose.model('Driver', new mongoose.Schema({
      user: mongoose.Schema.Types.ObjectId,
      username: String,
      fullName: String,
      isActive: Boolean
    }));

    // Barcha shofyorlarni ko'rish
    const allDrivers = await Driver.find({});
    console.log('\n📋 Barcha shofyorlar:');
    allDrivers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.fullName} (@${d.username}) - isActive: ${d.isActive} - ID: ${d._id}`);
    });

    // Nofaol shofyorlarni topish
    const inactiveDrivers = await Driver.find({ isActive: false });
    console.log(`\n❌ Nofaol shofyorlar: ${inactiveDrivers.length}`);

    // Duplikatlarni topish (bir xil username)
    const duplicates = await Driver.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ Duplikat usernameler:');
      duplicates.forEach(d => {
        console.log(`   @${d._id}: ${d.count} ta`);
      });
    }

    console.log('\n✅ Tekshiruv tugadi');
    console.log('Agar o\'chirish kerak bo\'lsa, quyidagi buyruqni ishga tushiring:');
    console.log('   node scripts/cleanup-drivers.js --delete');

    // --delete flag bilan ishga tushirilsa, nofaol shofyorlarni o'chirish
    if (process.argv.includes('--delete')) {
      console.log('\n🗑️ Nofaol shofyorlar o\'chirilmoqda...');
      const result = await Driver.deleteMany({ isActive: false });
      console.log(`✅ ${result.deletedCount} ta shofyor o'chirildi`);
    }

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 MongoDB uzildi');
  }
}

cleanup();
