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

const businessmanSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  createdAt: Date
}, { collection: 'businessmen' });

const Driver = mongoose.model('Driver', driverSchema);
const Businessman = mongoose.model('Businessman', businessmanSchema);

async function listAllDrivers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Barcha haydovchilarni balans bo'yicha tartiblash
    const drivers = await Driver.find({}).sort({ balance: -1 });
    
    console.log('🚗 BARCHA HAYDOVCHILAR:', drivers.length, 'ta');
    console.log('='.repeat(80));
    
    for (const driver of drivers) {
      const businessman = await Businessman.findById(driver.businessmanId);
      
      console.log(`👤 ${driver.name} | 💰 ${driver.balance?.toLocaleString() || 0} so'm`);
      console.log(`   📱 ${driver.phone || 'Tel yo\'q'}`);
      console.log(`   👔 Businessman: ${businessman?.username || 'Noma\'lum'} (${businessman?.phone || ''})`);
      console.log(`   🆔 ${driver._id}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllDrivers();
