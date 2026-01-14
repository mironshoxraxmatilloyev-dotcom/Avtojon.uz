require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

async function checkJizzaxFlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Jizzax - G'ijduvon marshrutini topish
    const flight = await Flight.findOne({ name: /Jizzax.*G'ijduvon/i }).lean();
    
    if (!flight) {
      console.log('❌ Flight not found');
      return;
    }

    console.log('\n📊 FLIGHT DETAILS:');
    console.log('Name:', flight.name);
    console.log('Status:', flight.status);
    console.log('Created:', new Date(flight.createdAt).toLocaleDateString('uz-UZ'));
    
    console.log('\n💰 PAYMENTS:');
    let totalPayment = 0;
    flight.legs?.forEach((leg, i) => {
      console.log(`Leg ${i + 1}: ${(leg.payment || 0).toLocaleString()} so'm`);
      totalPayment += leg.payment || 0;
    });
    console.log('Total Payment:', totalPayment.toLocaleString(), 'so\'m');
    console.log('Total Given Budget:', (flight.totalGivenBudget || 0).toLocaleString(), 'so\'m');
    console.log('Total Income:', (flight.totalIncome || totalPayment + (flight.totalGivenBudget || 0)).toLocaleString(), 'so\'m');

    console.log('\n💸 EXPENSES:');
    let lightExpenses = 0;
    let heavyExpenses = 0;
    
    const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
    
    flight.expenses?.forEach(exp => {
      const amount = exp.amountInUZS || exp.amount || 0;
      const isHeavy = exp.expenseClass === 'heavy' || 
                      HEAVY_EXPENSE_TYPES.includes(exp.type) ||
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
    const netProfitCorrect = totalIncome - lightExpenses;
    const driverProfitPercent = flight.driverProfitPercent || 0;
    const driverProfitAmount = netProfitCorrect > 0 && driverProfitPercent > 0 
      ? Math.round(netProfitCorrect * driverProfitPercent / 100) 
      : 0;
    const businessProfit = netProfitCorrect - driverProfitAmount;
    
    console.log('Total Income:', totalIncome.toLocaleString(), 'so\'m');
    console.log('- Light Expenses:', lightExpenses.toLocaleString(), 'so\'m');
    console.log('= Net Profit (correct):', netProfitCorrect.toLocaleString(), 'so\'m');
    console.log(`Driver Profit (${driverProfitPercent}%):`, driverProfitAmount.toLocaleString(), 'so\'m');
    console.log('Business Profit (Driver Owes):', businessProfit.toLocaleString(), 'so\'m');
    
    console.log('\n🔍 CURRENT DB VALUES:');
    console.log('flight.netProfit:', (flight.netProfit || 0).toLocaleString(), 'so\'m');
    console.log('flight.driverProfitAmount:', (flight.driverProfitAmount || 0).toLocaleString(), 'so\'m');
    console.log('flight.businessProfit:', (flight.businessProfit || 0).toLocaleString(), 'so\'m');
    console.log('flight.driverOwes:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('flight.lightExpenses:', (flight.lightExpenses || 0).toLocaleString(), 'so\'m');
    console.log('flight.heavyExpenses:', (flight.heavyExpenses || 0).toLocaleString(), 'so\'m');

    console.log('\n⚠️ DIFFERENCE:');
    console.log('DB driverOwes:', (flight.driverOwes || 0).toLocaleString(), 'so\'m');
    console.log('Correct driverOwes:', businessProfit.toLocaleString(), 'so\'m');
    console.log('Difference:', ((flight.driverOwes || 0) - businessProfit).toLocaleString(), 'so\'m');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkJizzaxFlight();
