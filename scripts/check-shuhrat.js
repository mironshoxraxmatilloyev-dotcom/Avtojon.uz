require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function checkShuhrat() {
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
    console.log('Phone:', driver.phone);
    console.log('Total Earnings:', (driver.totalEarnings || 0).toLocaleString(), 'so\'m');
    console.log('Pending Earnings:', (driver.pendingEarnings || 0).toLocaleString(), 'so\'m');
    console.log('Current Month:', (driver.currentMonthEarnings || 0).toLocaleString(), 'so\'m');

    // Shuhrat'ning marshrutlarini topish
    const flights = await Flight.find({ driver: driver._id, status: 'completed' }).lean();
    
    console.log(`\n📊 COMPLETED FLIGHTS: ${flights.length}`);
    
    let totalDriverProfit = 0;
    flights.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.name}`);
      console.log(`   Net Profit: ${(f.netProfit || 0).toLocaleString()} so'm`);
      console.log(`   Driver Profit (${f.driverProfitPercent || 0}%): ${(f.driverProfitAmount || 0).toLocaleString()} so'm`);
      console.log(`   Light Expenses: ${(f.lightExpenses || 0).toLocaleString()} so'm`);
      console.log(`   Heavy Expenses: ${(f.heavyExpenses || 0).toLocaleString()} so'm`);
      totalDriverProfit += f.driverProfitAmount || 0;
    });

    console.log(`\n💰 TOTAL DRIVER PROFIT FROM FLIGHTS: ${totalDriverProfit.toLocaleString()} so'm`);
    console.log(`📊 DRIVER PENDING EARNINGS: ${(driver.pendingEarnings || 0).toLocaleString()} so'm`);
    
    if (Math.abs(totalDriverProfit - (driver.pendingEarnings || 0)) > 100) {
      console.log(`\n⚠️ MISMATCH! Difference: ${(totalDriverProfit - (driver.pendingEarnings || 0)).toLocaleString()} so'm`);
    } else {
      console.log(`\n✅ MATCH! Driver earnings are correct.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkShuhrat();
