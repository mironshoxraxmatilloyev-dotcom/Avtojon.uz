require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const businessmanSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  createdAt: Date
}, { collection: 'businessmen' });

const driverSchema = new mongoose.Schema({
  name: String,
  phone: String,
  licenseNumber: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' },
  balance: { type: Number, default: 0 },
  createdAt: Date
}, { collection: 'drivers' });

const Businessman = mongoose.model('Businessman', businessmanSchema);
const Driver = mongoose.model('Driver', driverSchema);

async function findIslamov() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Barcha businessmenlarni ko'rish
    const businessmen = await Businessman.find({});
    
    console.log('👔 BARCHA BUSINESSMENLAR:', businessmen.length, 'ta');
    console.log('='.repeat(80));
    
    businessmen.forEach((bm, index) => {
      console.log(`${index + 1}. ${bm.username} (${bm.name || 'Ism yo\'q'})`);
      console.log(`   📱 ${bm.phone || 'Tel yo\'q'}`);
      console.log(`   🆔 ${bm._id}`);
      console.log('');
    });

    // islamov ni topish
    const islamov = await Businessman.findOne({ 
      $or: [
        { username: 'islamov' },
        { username: /islamov/i },
        { name: /islamov/i }
      ]
    });

    if (islamov) {
      console.log('✅ ISLAMOV TOPILDI:');
      console.log('='.repeat(80));
      console.log('Username:', islamov.username);
      console.log('Name:', islamov.name);
      console.log('Phone:', islamov.phone);
      console.log('ID:', islamov._id);
      console.log('');

      // Uning haydovchilarini topish
      const drivers = await Driver.find({ businessmanId: islamov._id });
      console.log('🚗 HAYDOVCHILAR:', drivers.length, 'ta');
      console.log('='.repeat(80));
      
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name}`);
        console.log(`   📱 ${driver.phone || 'Tel yo\'q'}`);
        console.log(`   💰 Balance: ${driver.balance?.toLocaleString() || 0} so'm`);
        console.log(`   🆔 ${driver._id}`);
        console.log('');
      });
    } else {
      console.log('❌ islamov topilmadi');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findIslamov();
