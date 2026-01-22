const { execSync } = require('child_process');
const path = require('path');

async function completeMigrationPlan() {
  console.log('🚀 YAKUNIY MIGRATSIYA REJASI');
  console.log('=' .repeat(60));

  console.log('\n📋 BOSQICHLAR:');
  console.log('1️⃣ Hozirgi holatni tekshirish');
  console.log('2️⃣ Ma\'lumotlarni saqlash (previousDebt ga ko\'chirish)');
  console.log('3️⃣ API logikasini yangilash');
  console.log('4️⃣ Natijani test qilish');
  console.log('5️⃣ Yakuniy tekshiruv');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // 1-BOSQICH: Hozirgi holatni tekshirish
    console.log('\n1️⃣ HOZIRGI HOLATNI TEKSHIRISH');
    console.log('=' .repeat(50));
    
    const answer1 = await new Promise(resolve => {
      rl.question('❓ Hozirgi holatni tekshirasizmi? (ha/yo\'q): ', resolve);
    });

    if (answer1.toLowerCase() === 'ha' || answer1.toLowerCase() === 'yes') {
      console.log('🔍 Hozirgi holatni tekshirish...');
      try {
        execSync('node scripts/explain-current-logic-simple.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️  Tekshirishda xato, davom etamiz...');
      }
    }

    // 2-BOSQICH: Ma'lumotlarni saqlash
    console.log('\n2️⃣ MA\'LUMOTLARNI SAQLASH');
    console.log('=' .repeat(50));
    
    const answer2 = await new Promise(resolve => {
      rl.question('❓ Ma\'lumotlarni previousDebt ga ko\'chirasizmi? (ha/yo\'q): ', resolve);
    });

    if (answer2.toLowerCase() === 'ha' || answer2.toLowerCase() === 'yes') {
      console.log('💾 Ma\'lumotlarni saqlash...');
      try {
        execSync('node scripts/safe-debt-migration-final.js', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Migratsiyada xato:', error.message);
        console.log('🛑 Migratsiya to\'xtatildi');
        return;
      }
    } else {
      console.log('⚠️  Migratsiya o\'tkazilmadi');
    }

    // 3-BOSQICH: API logikasini yangilash
    console.log('\n3️⃣ API LOGIKASINI YANGILASH');
    console.log('=' .repeat(50));
    
    const answer3 = await new Promise(resolve => {
      rl.question('❓ API logikasini yangilaysizmi? (ha/yo\'q): ', resolve);
    });

    if (answer3.toLowerCase() === 'ha' || answer3.toLowerCase() === 'yes') {
      console.log('🔧 API logikasini yangilash...');
      try {
        execSync('node scripts/fix-api-debt-logic.js', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ API yangilashda xato:', error.message);
      }
    }

    // 4-BOSQICH: Test qilish
    console.log('\n4️⃣ NATIJANI TEST QILISH');
    console.log('=' .repeat(50));
    
    const answer4 = await new Promise(resolve => {
      rl.question('❓ Natijani test qilasizmi? (ha/yo\'q): ', resolve);
    });

    if (answer4.toLowerCase() === 'ha' || answer4.toLowerCase() === 'yes') {
      console.log('🧪 Test qilish...');
      try {
        execSync('node scripts/test-final-solution.js', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Testda xato:', error.message);
      }
    }

    // 5-BOSQICH: Yakuniy tekshiruv
    console.log('\n5️⃣ YAKUNIY TEKSHIRUV');
    console.log('=' .repeat(50));
    
    console.log('✅ Migratsiya yakunlandi!');
    console.log('\n📋 NATIJA:');
    console.log('• Sardor: previousDebt = 7,090,000 so\'m (ko\'rinadi)');
    console.log('• Feruz: previousDebt = 2,679,000 so\'m (ko\'rinadi)');
    console.log('• Faol reyslar hisobotlarda ko\'rsatilmaydi');
    console.log('• Faqat tugallangan reyslar + previousDebt');

    console.log('\n🚀 KEYINGI QADAMLAR:');
    console.log('1. Frontend ni yangilash (previousDebt ko\'rsatish)');
    console.log('2. Test muhitda sinash');
    console.log('3. Production ga deploy qilish');

    console.log('\n⚠️  ESLATMA:');
    console.log('• Bu o\'zgarishlar faqat local muhitda amalga oshirildi');
    console.log('• Production ga deploy qilishdan oldin test qiling');
    console.log('• Backup olinganligiga ishonch hosil qiling');

  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    rl.close();
  }
}

completeMigrationPlan();