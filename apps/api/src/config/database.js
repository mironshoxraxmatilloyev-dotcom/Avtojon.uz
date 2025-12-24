const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB ulanish optimizatsiyasi
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool - bir vaqtda ko'p ulanish
      maxPoolSize: 10,
      minPoolSize: 2,
      // Serverga ulanish timeout - ko'proq vaqt
      serverSelectionTimeoutMS: 30000,
      // Socket timeout
      socketTimeoutMS: 45000,
      // Heartbeat
      heartbeatFrequencyMS: 10000,
      // Buffering o'chirilgan - tezroq xato qaytaradi
      bufferCommands: false,
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
    console.error(`❌ MongoDB xatosi: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
