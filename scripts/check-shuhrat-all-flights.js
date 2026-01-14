require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function checkShuhratAllFlights() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Shuhrat haydovchini topish
    const driver = await Driver.findOne({ fullName: /Shuhrat/i }).lean();
    
    if (!driver) {
      console.log('❌ Shuhrat not found');
      return;
    }

    console.log('\n👤 DRIVER INFO:');
    console.log('Name:', driver.fullName);
    console.log('ID:', driver._id);

    // Shuhrat'ning barcha marshrutlarini topish
    const flights = await Flight.find({ driver: driver._id }).lean();
    
    console.log(`\n📊 ALL FLIGHTS: ${flights.length}\n`);
    
    let totalDriverOwes = 0;
    
    flights.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name || 'No name'} (${f.status})`);
      console.log(`   Created: ${new Date(f.createdAt).toLocaleDateString('uz-UZ')}`);
      console.log(`   Total Income: ${(f.totalIncome || 0).toLocaleString()} so'm`);
      console.log(`   Net Profit: ${(f.netProfit || 0).toLocaleString()} so'm`);
      console.log(`   Driver Owes: ${(f.driverOwes || 0).toLocaleString()} so'm`);
      console.log(`   Driver Paid: ${(f.driverPaidAmount || 0).toLocaleString()} so'm`);
      console.log(`   Payment Status: ${f.driverPaymentStatus || 'pending'}`);
      
      const remaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0);
      if (remaining > 0) {
        console.log(`   ⚠️ REMAINING: ${remaining.toLocaleString()} so'm`);
        totalDriverOwes += remaining;
      }
      console.log('');
    });

    console.log(`💰 TOTAL DRIVER OWES (REMAINING): ${totalDriverOwes.toLocaleString()} so'm`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkShuhratAllFlights();
