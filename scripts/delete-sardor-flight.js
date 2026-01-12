/**
 * Sardor haydovchining oxirgi xato reysini o'chirish
 * Ishlatish: node scripts/delete-sardor-flight.js
 */

require('dotenv').config({ path: 'apps/api/.env' });
const mongoose = require('mongoose');

async function deleteSardorFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB ga ulandi');

    const Driver = require('../apps/api/src/models/Driver');
    const Flight = require('../apps/api/src/models/Flight');

    // Sardor haydovchini topish
    const sardor = await Driver.findOne({ fullName: /sardor/i });
    if (!sardor) {
      console.log('❌ Sardor nomli haydovchi topilmadi');
      return;
    }
    console.log(`✅ Haydovchi topildi: ${sardor.fullName} (${sardor._id})`);

    // Uning oxirgi to'xtatilgan (cancelled) reysini topish
    const flight = await Flight.findOne({
      driver: sardor._id,
      status: { $in: ['cancelled', 'stopped', 'active'] }
    }).sort({ createdAt: -1 });

    if (!flight) {
      console.log('❌ Faol reys topilmadi');
      return;
    }

    console.log(`\n📋 O'chiriladigan reys:`);
    console.log(`   ID: ${flight._id}`);
    console.log(`   Yaratilgan: ${flight.createdAt}`);
    console.log(`   Spidometr: ${flight.startOdometer || 'kiritilmagan'}`);
    console.log(`   Status: ${flight.status}`);

    // Reysni o'chirish
    await Flight.findByIdAndDelete(flight._id);
    console.log('\n✅ Reys o\'chirildi!');

    // Haydovchi statusini yangilash
    await Driver.findByIdAndUpdate(sardor._id, { status: 'free' });
    console.log('✅ Haydovchi statusi "free" ga o\'zgartirildi');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB dan uzildi');
  }
}

deleteSardorFlight();
