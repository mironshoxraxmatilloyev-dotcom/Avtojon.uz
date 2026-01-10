/**
 * Barcha mavjud xarajatlarga addedBy maydonini qo'shish
 * Eski ma'lumotlar uchun default qiymat: 'businessman'
 */

const mongoose = require('mongoose');
const path = require('path');

// .env faylini to'g'ri yo'ldan o'qish
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

async function addAddedByToExpenses() {
  try {
    console.log('🔄 MongoDB ga ulanmoqda...');
    
    // MONGODB_URI ni tekshirish
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI topilmadi! .env faylini tekshiring');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');

    // Flight modelini import qilish
    const Flight = require('../apps/api/src/models/Flight');
    
    // Barcha flight larni olish
    const flights = await Flight.find({});
    console.log(`📊 Jami ${flights.length} ta flight topildi`);

    let updatedCount = 0;
    let expenseCount = 0;

    // Batch rejimida ishlash - 10 tadan
    const batchSize = 10;
    for (let i = 0; i < flights.length; i += batchSize) {
      const batch = flights.slice(i, i + batchSize);
      const updatePromises = [];

      for (const flight of batch) {
        let hasUpdates = false;
        
        // Har bir xarajatni tekshirish
        for (const expense of flight.expenses) {
          if (!expense.addedBy) {
            // Agar addedBy maydoni yo'q bo'lsa, default qiymat o'rnatish
            expense.addedBy = 'businessman';
            hasUpdates = true;
            expenseCount++;
          }
        }

        // Agar yangilanish bo'lsa, promise qo'shish
        if (hasUpdates) {
          updatePromises.push(
            flight.save().then(() => {
              updatedCount++;
              console.log(`✅ Flight ${flight._id} yangilandi (${flight.expenses.length} ta xarajat)`);
            })
          );
        }
      }

      // Batch ni parallel bajarish
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      console.log(`📊 Progress: ${Math.min(i + batchSize, flights.length)}/${flights.length} flight tekshirildi`);
    }

    console.log('\n📈 Natijalar:');
    console.log(`   - ${updatedCount} ta flight yangilandi`);
    console.log(`   - ${expenseCount} ta xarajatga addedBy qo'shildi`);
    console.log('✅ Migration muvaffaqiyatli yakunlandi!');

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB ulanishi yopildi');
  }
}

// Script ni ishga tushirish
if (require.main === module) {
  addAddedByToExpenses();
}

module.exports = addAddedByToExpenses;