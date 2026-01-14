require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

async function fixDriverEarnings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Barcha haydovchilarni olish
    const drivers = await Driver.find({ isActive: true });
    console.log(`\n📊 Found ${drivers.length} active drivers`);

    for (const driver of drivers) {
      // Haydovchining barcha yopilgan marshrutlarini olish
      const flights = await Flight.find({ 
        driver: driver._id, 
        status: 'completed' 
      });

      // Jami haydovchi foydasi
      let totalDriverProfit = 0;
      let totalPaid = 0;

      flights.forEach(f => {
        totalDriverProfit += f.driverProfitAmount || 0;
      });

      // To'langan summani hisoblash
      if (driver.salaryPayments && driver.salaryPayments.length > 0) {
        totalPaid = driver.salaryPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      // Kutilayotgan daromad = jami - to'langan
      const pendingEarnings = Math.max(0, totalDriverProfit - totalPaid);

      // Agar farq bor bo'lsa, yangilash
      if (Math.abs((driver.pendingEarnings || 0) - pendingEarnings) > 100 || 
          Math.abs((driver.totalEarnings || 0) - totalDriverProfit) > 100) {
        
        console.log(`\n🔄 Updating driver: ${driver.fullName}`);
        console.log(`  Flights: ${flights.length}`);
        console.log(`  Old Total Earnings: ${(driver.totalEarnings || 0).toLocaleString()}`);
        console.log(`  New Total Earnings: ${totalDriverProfit.toLocaleString()}`);
        console.log(`  Old Pending: ${(driver.pendingEarnings || 0).toLocaleString()}`);
        console.log(`  New Pending: ${pendingEarnings.toLocaleString()}`);
        console.log(`  Total Paid: ${totalPaid.toLocaleString()}`);

        driver.totalEarnings = totalDriverProfit;
        driver.pendingEarnings = pendingEarnings;
        await driver.save();
        console.log(`  ✅ Updated`);
      }
    }

    console.log(`\n✅ Fix complete!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixDriverEarnings();
