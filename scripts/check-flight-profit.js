require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function checkFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const flightId = '69647e50f116dd5f61fe284a';
    const flight = await Flight.findById(flightId);

    if (!flight) {
      console.log('❌ Flight not found');
      return;
    }

    console.log('\n📊 FLIGHT DETAILS:');
    console.log('Driver ID:', flight.driver);
    console.log('Status:', flight.status);
    console.log('Legs:', flight.legs?.length);
    
    console.log('\n💰 PAYMENTS:');
    let totalPayment = 0;
    flight.legs?.forEach((leg, i) => {
      console.log(`Leg ${i + 1}: ${leg.payment?.toLocaleString()} so'm (${leg.paymentType})`);
      totalPayment += leg.payment || 0;
    });
    console.log('Total Payment:', totalPayment.toLocaleString(), 'so\'m');
    console.log('Total Given Budget:', (flight.totalGivenBudget || 0).toLocaleString(), 'so\'m');
    console.log('Total Income:', (flight.totalIncome || totalPayment + (flight.totalGivenBudget || 0)).toLocaleString(), 'so\'m');

    console.log('\n💸 EXPENSES:');
    let lightExpenses = 0;
    let heavyExpenses = 0;
    
    flight.expenses?.forEach(exp => {
      const amount = exp.amountInUZS || exp.amount || 0;
      const isHeavy = exp.expenseClass === 'heavy' || 
                      ['repair_major', 'tire', 'accident', 'insurance', 'oil'].includes(exp.type) ||
                      (exp.type && exp.type.startsWith('filter_'));
      
      if (isHeavy) {
        heavyExpenses += amount;
        console.log(`  [HEAVY] ${exp.type}: ${amount.toLocaleString()} so'm`);
      } else {
        lightExpenses += amount;
        console.log(`  [LIGHT] ${exp.type}: ${amount.toLocaleString()} so'm`);
      }
    });

    console.log('\nLight Expenses Total:', lightExpenses.toLocaleString(), 'so\'m');
    console.log('Heavy Expenses Total:', heavyExpenses.toLocaleString(), 'so\'m');
    console.log('Total Expenses:', (lightExpenses + heavyExpenses).toLocaleString(), 'so\'m');

    console.log('\n📈 PROFIT CALCULATION:');
    const totalIncome = totalPayment + (flight.totalGivenBudget || 0);
    const netProfitWithLight = totalIncome - lightExpenses;
    const netProfitWithAll = totalIncome - lightExpenses - heavyExpenses;
    
    console.log('Total Income:', totalIncome.toLocaleString(), 'so\'m');
    console.log('- Light Expenses:', lightExpenses.toLocaleString(), 'so\'m');
    console.log('= Net Profit (correct):', netProfitWithLight.toLocaleString(), 'so\'m');
    console.log('\nIf heavy expenses included:');
    console.log('- Heavy Expenses:', heavyExpenses.toLocaleString(), 'so\'m');
    console.log('= Net Profit (wrong):', netProfitWithAll.toLocaleString(), 'so\'m');
    
    console.log('\n🔍 CURRENT DB VALUES:');
    console.log('flight.netProfit:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('flight.lightExpenses:', (flight.lightExpenses || 0).toLocaleString(), 'so\'m');
    console.log('flight.heavyExpenses:', (flight.heavyExpenses || 0).toLocaleString(), 'so\'m');
    console.log('flight.totalExpenses:', (flight.totalExpenses || 0).toLocaleString(), 'so\'m');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkFlight();
