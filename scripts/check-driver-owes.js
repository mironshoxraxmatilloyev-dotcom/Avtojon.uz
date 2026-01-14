require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function checkDriverOwes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const flightId = '69647e50f116dd5f61fe284a';
    const flight = await Flight.findById(flightId).lean();

    if (!flight) {
      console.log('❌ Flight not found');
      return;
    }

    console.log('\n📊 FLIGHT INFO:');
    console.log('Status:', flight.status);
    console.log('Total Income:', (flight.totalIncome || 0).toLocaleString(), 'so\'m');
    console.log('Total Expenses:', (flight.totalExpenses || 0).toLocaleString(), 'so\'m');
    console.log('Light Expenses:', (flight.lightExpenses || 0).toLocaleString(), 'so\'m');
    console.log('Heavy Expenses:', (flight.heavyExpenses || 0).toLocaleString(), 'so\'m');
    console.log('Net Profit:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('Driver Profit %:', flight.driverProfitPercent || 0);
    console.log('Driver Profit Amount:', (flight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
    console.log('Business Profit:', (flight.businessProfit || 0).toLocaleString(), 'so\'m');
    console.log('Driver Owes:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('Driver Paid Amount:', (flight.driverPaidAmount || 0).toLocaleString(), 'so\'m');
    console.log('Driver Payment Status:', flight.driverPaymentStatus || 'pending');

    // Hisoblash
    const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0);
    const lightExpenses = flight.lightExpenses || 0;
    const netProfit = totalIncome - lightExpenses;
    
    console.log('\n🔍 CALCULATED:');
    console.log('Total Income (calculated):', totalIncome.toLocaleString(), 'so\'m');
    console.log('Net Profit (calculated):', netProfit.toLocaleString(), 'so\'m');
    console.log('Driver Owes (should be):', (flight.driverOwes || 0).toLocaleString(), 'so\'m');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDriverOwes();
