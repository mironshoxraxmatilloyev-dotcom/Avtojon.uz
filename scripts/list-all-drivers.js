require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function listAllDrivers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Barcha haydovchilarni olish
    const drivers = await Driver.find({ isActive: true }).lean();
    
    console.log('📊 ALL DRIVERS:\n');
    
    for (const driver of drivers) {
      // Haydovchining marshrutlarini sanash
      const completedFlights = await Flight.countDocuments({ 
        driver: driver._id, 
        status: 'completed' 
      });
      
      const activeFlights = await Flight.countDocuments({ 
        driver: driver._id, 
        status: 'active' 
      });

      console.log(`👤 ${driver.fullName}`);
      console.log(`   Phone: ${driver.phone || 'N/A'}`);
      console.log(`   Total Earnings: ${(driver.totalEarnings || 0).toLocaleString()} so'm`);
      console.log(`   Pending: ${(driver.pendingEarnings || 0).toLocaleString()} so'm`);
      console.log(`   Flights: ${completedFlights} completed, ${activeFlights} active`);
      console.log('');
    }

    // Jami pending
    const totalPending = drivers.reduce((sum, d) => sum + (d.pendingEarnings || 0), 0);
    console.log(`💰 TOTAL PENDING: ${totalPending.toLocaleString()} so'm`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllDrivers();
