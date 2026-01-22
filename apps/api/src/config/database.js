const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 MongoDB ga ulanishga harakat qilinmoqda...');
    
    // MongoDB ulanish optimizatsiyasi
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool - bir vaqtda ko'p ulanish
      maxPoolSize: 10,
      minPoolSize: 2,
      // Serverga ulanish timeout - qisqaroq vaqt
      serverSelectionTimeoutMS: 10000, // 10 sekund
      // Socket timeout
      socketTimeoutMS: 15000, // 15 sekund
      // Heartbeat
      heartbeatFrequencyMS: 10000,
      // Buffering o'chirilgan - tezroq xato qaytaradi
      bufferCommands: false,
      // Retry ulanishlar
      retryWrites: true,
    });
    
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}`);
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB xatosi:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB uzildi');
    });
    
  } catch (error) {
    console.error(`❌ MongoDB ulanish xatosi: ${error.message}`);
    console.error('🔍 Mumkin bo\'lgan sabablar:');
    console.error('   1. Internet ulanishi muammosi');
    console.error('   2. MongoDB Atlas IP whitelist da sizning IP manzilingiz yo\'q');
    console.error('   3. Username yoki parol noto\'g\'ri');
    console.error('   4. Connection string formati noto\'g\'ri');
    
    // Xato bo'lsa jarayonni to'xtatish
    process.exit(1);
  }
};

module.exports = connectDB;
