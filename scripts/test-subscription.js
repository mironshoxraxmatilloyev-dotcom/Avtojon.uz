#!/usr/bin/env node

/**
 * Subscription tizimini test qilish uchun script
 */

require('dotenv').config({ path: '../apps/api/.env' });
const mongoose = require('mongoose');
const Businessman = require('../apps/api/src/models/Businessman');

async function testSubscription() {
  try {
    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/avtojon');
    console.log('✅ MongoDB ga ulandi');

    // Barcha biznesmenlarni olish
    const businessmen = await Businessman.find({}).select('fullName username registrationDate subscription createdAt');
    
    console.log('\n📊 Biznesmenlar ro\'yxati:');
    console.log('='.repeat(80));
    
    for (const businessman of businessmen) {
      const subInfo = businessman.checkSubscription();
      const regDate = businessman.registrationDate || businessman.createdAt;
      const daysSinceReg = Math.floor((new Date() - new Date(regDate)) / (1000 * 60 * 60 * 24));
      
      console.log(`\n👤 ${businessman.fullName} (@${businessman.username})`);
      console.log(`   📅 Ro'yxatdan o'tgan: ${regDate ? new Date(regDate).toLocaleDateString('uz-UZ') : 'Noma\'lum'} (${daysSinceReg} kun oldin)`);
      console.log(`   📋 Tarif: ${subInfo.plan}`);
      console.log(`   ⏰ Tugash sanasi: ${subInfo.endDate ? new Date(subInfo.endDate).toLocaleDateString('uz-UZ') : 'Noma\'lum'}`);
      console.log(`   📊 Holat: ${subInfo.isExpired ? '❌ Tugagan' : '✅ Aktiv'} (${subInfo.daysLeft} kun qoldi)`);
      
      if (subInfo.isExpired && daysSinceReg < 7) {
        console.log('   ⚠️  XATOLIK: Trial davom etishi kerak edi!');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Jami: ${businessmen.length} ta biznesmen`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB dan uzildi');
  }
}

// Script ni ishga tushirish
if (require.main === module) {
  testSubscription();
}

module.exports = { testSubscription };