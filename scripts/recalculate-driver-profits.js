require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({}, { strict: false });
const Flight = mongoose.model('Flight', flightSchema);

const driverSchema = new mongoose.Schema({}, { strict: false });
const Driver = mongoose.model('Driver', driverSchema);

// Katta xarajat turlari
const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];

async function recalculateDriverProfits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Barcha yopilgan marshrutlarni olish
    const flights = await Flight.find({ status: 'completed' });
    console.log(`\n📊 Found ${flights.length} completed flights`);

    let updatedCount = 0;
    let totalOldProfit = 0;
    let totalNewProfit = 0;

    for (const flight of flights) {
      // Yengil va katta xarajatlarni ajratish
      let lightExpensesUZS = 0;
      let heavyExpensesUZS = 0;

      flight.expenses?.forEach(exp => {
        const isHeavy = HEAVY_EXPENSE_TYPES.includes(exp.type) || 
                        exp.expenseClass === 'heavy' ||
                        (exp.type && exp.type.startsWith('filter_'));
        const amountUZS = exp.amountInUZS || exp.amount || 0;

        if (isHeavy) {
          heavyExpensesUZS += amountUZS;
        } else {
          lightExpensesUZS += amountUZS;
        }
      });

      // Chegara va Platon - yengil xarajatlar
      if (flight.borderCrossings && flight.borderCrossings.length > 0) {
        lightExpensesUZS += flight.borderCrossingsTotalUZS || 0;
      }
      if (flight.platon && flight.platon.amountInUSD) {
        lightExpensesUZS += Math.round(flight.platon.amountInUSD * 12800);
      }

      // Jami kirim
      const totalPayment = flight.legs?.reduce((sum, leg) => sum + (leg.payment || 0), 0) || 0;
      const totalGivenBudget = flight.legs?.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0) || 0;
      const totalIncome = totalPayment + totalGivenBudget;

      // YANGI SOF FOYDA - faqat yengil xarajatlar ayiriladi
      const newNetProfit = totalIncome - lightExpensesUZS - (flight.totalPeritsenaFee || 0);

      // YANGI HAYDOVCHI ULUSHI
      const percent = flight.driverProfitPercent || 0;
      const newDriverProfitAmount = newNetProfit > 0 && percent > 0 
        ? Math.round(newNetProfit * percent / 100) 
        : 0;

      // Eski qiymatlar
      const oldNetProfit = flight.netProfit || 0;
      const oldDriverProfitAmount = flight.driverProfitAmount || 0;

      // Agar o'zgarish bo'lsa
      if (Math.abs(newNetProfit - oldNetProfit) > 100 || Math.abs(newDriverProfitAmount - oldDriverProfitAmount) > 100) {
        console.log(`\n🔄 Updating flight: ${flight.name || flight._id}`);
        console.log(`  Old Net Profit: ${oldNetProfit.toLocaleString()} → New: ${newNetProfit.toLocaleString()}`);
        console.log(`  Old Driver Profit: ${oldDriverProfitAmount.toLocaleString()} → New: ${newDriverProfitAmount.toLocaleString()}`);
        console.log(`  Light Expenses: ${lightExpensesUZS.toLocaleString()}, Heavy: ${heavyExpensesUZS.toLocaleString()}`);

        // Flight'ni yangilash
        flight.lightExpenses = Math.round(lightExpensesUZS);
        flight.heavyExpenses = Math.round(heavyExpensesUZS);
        flight.netProfit = Math.round(newNetProfit);
        flight.driverProfitAmount = newDriverProfitAmount;
        flight.businessProfit = Math.round(newNetProfit - newDriverProfitAmount);
        flight.driverOwes = flight.businessProfit;

        await flight.save();

        // Driver'ning pendingEarnings'ini yangilash
        if (flight.driver) {
          const driver = await Driver.findById(flight.driver);
          if (driver) {
            const diff = newDriverProfitAmount - oldDriverProfitAmount;
            driver.pendingEarnings = Math.max(0, (driver.pendingEarnings || 0) + diff);
            driver.totalEarnings = Math.max(0, (driver.totalEarnings || 0) + diff);
            await driver.save();
            console.log(`  ✅ Driver ${driver.fullName} earnings updated by ${diff.toLocaleString()}`);
          }
        }

        updatedCount++;
        totalOldProfit += oldDriverProfitAmount;
        totalNewProfit += newDriverProfitAmount;
      }
    }

    console.log(`\n✅ Recalculation complete!`);
    console.log(`Updated ${updatedCount} flights`);
    console.log(`Total old driver profits: ${totalOldProfit.toLocaleString()} so'm`);
    console.log(`Total new driver profits: ${totalNewProfit.toLocaleString()} so'm`);
    console.log(`Difference: ${(totalNewProfit - totalOldProfit).toLocaleString()} so'm`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

recalculateDriverProfits();
