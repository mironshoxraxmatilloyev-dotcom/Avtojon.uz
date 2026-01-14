require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

async function fixJizzaxFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Jizzax - G'ijduvon marshrutini topish
    const flight = await Flight.findOne({ name: /Jizzax.*G'ijduvon/i });
    
    if (!flight) {
      console.log('❌ Flight not found');
      return;
    }

    console.log('\n📊 FIXING FLIGHT:', flight.name);
    
    // To'g'ri hisoblash
    const totalIncome = 22100000;
    const lightExpenses = 960000;
    const netProfit = totalIncome - lightExpenses; // 21,140,000
    const driverProfitPercent = 20;
    const driverProfitAmount = Math.round(netProfit * driverProfitPercent / 100); // 4,228,000
    const businessProfit = netProfit - driverProfitAmount; // 16,912,000

    console.log('\n🔧 UPDATING:');
    console.log('Old driverProfitAmount:', (flight.driverProfitAmount || 0).toLocaleString());
    console.log('New driverProfitAmount:', driverProfitAmount.toLocaleString());
    console.log('Old businessProfit:', (flight.businessProfit || 0).toLocaleString());
    console.log('New businessProfit:', businessProfit.toLocaleString());
    console.log('Old driverOwes:', (flight.driverOwes || 0).toLocaleString());
    console.log('New driverOwes:', businessProfit.toLocaleString());

    // Flight'ni yangilash
    flight.driverProfitAmount = driverProfitAmount;
    flight.businessProfit = businessProfit;
    flight.driverOwes = businessProfit;
    await flight.save();

    console.log('\n✅ Flight updated!');

    // Driver'ni yangilash
    const driver = await Driver.findById(flight.driver);
    if (driver) {
      console.log('\n🔧 UPDATING DRIVER:', driver.fullName);
      console.log('Old pendingEarnings:', (driver.pendingEarnings || 0).toLocaleString());
      console.log('Old totalEarnings:', (driver.totalEarnings || 0).toLocaleString());
      
      // Farqni hisoblash
      const oldDriverProfit = 4420000;
      const diff = driverProfitAmount - oldDriverProfit; // -192,000
      
      driver.pendingEarnings = Math.max(0, (driver.pendingEarnings || 0) + diff);
      driver.totalEarnings = Math.max(0, (driver.totalEarnings || 0) + diff);
      await driver.save();
      
      console.log('New pendingEarnings:', (driver.pendingEarnings || 0).toLocaleString());
      console.log('New totalEarnings:', (driver.totalEarnings || 0).toLocaleString());
      console.log('Difference applied:', diff.toLocaleString());
    }

    console.log('\n✅ All fixed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixJizzaxFlight();
