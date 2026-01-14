require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function forceUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const Flight = mongoose.model('Flight', new mongoose.Schema({}, { strict: false }));
    const Driver = mongoose.model('Driver', new mongoose.Schema({}, { strict: false }));

    // Jizzax - G'ijduvon marshrutini topish
    const flight = await Flight.findOne({ name: /Jizzax.*G'ijduvon/i });
    
    if (!flight) {
      console.log('❌ Flight not found');
      return;
    }

    console.log('\n📊 FLIGHT ID:', flight._id);
    console.log('Name:', flight.name);
    
    // To'g'ri qiymatlar
    const driverProfitAmount = 4228000;
    const businessProfit = 16912000;

    // updateOne bilan yangilash
    const result = await Flight.updateOne(
      { _id: flight._id },
      {
        $set: {
          driverProfitAmount: driverProfitAmount,
          businessProfit: businessProfit,
          driverOwes: businessProfit
        }
      }
    );

    console.log('\n✅ Flight update result:', result);

    // Driver'ni yangilash
    const driver = await Driver.findById(flight.driver);
    if (driver) {
      console.log('\n🔧 DRIVER:', driver.fullName);
      
      const driverResult = await Driver.updateOne(
        { _id: driver._id },
        {
          $set: {
            totalEarnings: 4228000,
            pendingEarnings: 192000
          }
        }
      );
      
      console.log('✅ Driver update result:', driverResult);
    }

    console.log('\n✅ All updated!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

forceUpdate();
