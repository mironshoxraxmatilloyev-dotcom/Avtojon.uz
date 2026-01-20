require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  businessmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Businessman' }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const users = await User.find({}).select('username role businessmanId');
    
    console.log('👥 BARCHA USERLAR:', users.length, 'ta');
    console.log('='.repeat(60));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
      console.log(`   BusinessmanId: ${user.businessmanId}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
