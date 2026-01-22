const fs = require('fs');
const path = require('path');

async function fixApiDebtLogic() {
  console.log('🔧 API QARZ LOGIKASINI TO\'G\'RILASH');
  console.log('=' .repeat(50));

  const apiFilePath = path.join(__dirname, '../apps/api/src/routes/flight.routes.js');
  
  try {
    // Fayl mavjudligini tekshirish
    if (!fs.existsSync(apiFilePath)) {
      console.error('❌ API fayl topilmadi:', apiFilePath);
      return;
    }

    // Faylni o'qish
    let content = fs.readFileSync(apiFilePath, 'utf8');
    console.log('✅ API fayl o\'qildi');

    // 1. Driver debts endpoint ni yangilash
    const oldDriverDebtsLogic = `// Shofyor qarzdorliklari ro'yxati (hisobotlar uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/driver-debts', protect, businessOnly, async (req, res) => {
  try {
    const { status, driverId } = req.query;

    // FAQAT tugallangan reyslarni olish (hisobotlar uchun)
    const filter = {
      user: req.user._id,
      status: 'completed'  // ❌ Faol reyslar hisobotlarda ko'rsatilmasligi kerak
    };

    if (driverId) {
      filter.driver = driverId;
    }

    const flights = await Flight.find(filter)
      .populate('driver', 'fullName phone currentBalance')
      .populate('vehicle', 'plateNumber brand')
      .sort({ createdAt: -1 })
      .lean();

    // Har bir mashrut uchun driverOwes ni hisoblash
    const processedFlights = flights.map(f => {
      const totalIncome = (f.totalPayment || 0) + (f.roadMoney || f.totalGivenBudget || 0);
      
      // YANGI LOGIKA: Faqat yengil xarajatlar ayiriladi
      const lightExpenses = f.lightExpenses || 0;
      const heavyExpenses = f.heavyExpenses || 0;
      const totalExpenses = f.totalExpenses || 0;
      
      // Sof foyda - faqat yengil xarajatlar ayirilgan
      // Agar lightExpenses mavjud bo'lsa, uni ishlatamiz
      // Aks holda, eski logika (backward compatibility)
      const netProfit = f.netProfit || (totalIncome - lightExpenses);
      
      const driverProfitAmount = f.driverProfitAmount || 0;

      let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
      if (calculatedDriverOwes === 0 && netProfit > 0) {
        calculatedDriverOwes = netProfit - driverProfitAmount;
      }

      return {
        ...f,
        driverOwes: calculatedDriverOwes,
        calculatedNetProfit: netProfit,
        calculatedTotalIncome: totalIncome,
        lightExpenses,
        heavyExpenses
      };
    });

    // TUZATILDI: Barcha marshrutlarni qaytarish (qarz bor yoki to'langan)
    // Faqat driverOwes > 0 bo'lgan marshrutlarni olish (qarz bo'lgan marshrutlar)
    let filteredFlights = processedFlights.filter(f => f.driverOwes > 0);

    if (status === 'pending') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus !== 'paid');
    } else if (status === 'paid') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus === 'paid');
    }
    // Agar filter 'all' bo'lsa, barcha marshrutlar qaytariladi (pending va paid)

    // TUZATILDI: Qolgan qarzni to'g'ri hisoblash
    const totalDebt = filteredFlights.reduce((sum, f) => {
      if (f.driverPaymentStatus === 'paid') return sum;
      const remaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    
    const paidAmount = filteredFlights.reduce((sum, f) => sum + (f.driverPaidAmount || 0), 0);

    res.json({
      success: true,
      data: filteredFlights,
      stats: {
        totalDebt,
        paidAmount,
        pendingCount: filteredFlights.filter(f => f.driverPaymentStatus !== 'paid').length,
        paidCount: filteredFlights.filter(f => f.driverPaymentStatus === 'paid').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

    const newDriverDebtsLogic = `// Shofyor qarzdorliklari ro'yxati (hisobotlar uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/driver-debts', protect, businessOnly, async (req, res) => {
  try {
    const { status, driverId } = req.query;

    // FAQAT tugallangan reyslarni olish (hisobotlar uchun)
    const filter = {
      user: req.user._id,
      status: 'completed'  // ✅ Faqat tugallangan reyslar
    };

    if (driverId) {
      filter.driver = driverId;
    }

    const flights = await Flight.find(filter)
      .populate('driver', 'fullName phone currentBalance previousDebt')
      .populate('vehicle', 'plateNumber brand')
      .sort({ createdAt: -1 })
      .lean();

    // Har bir mashrut uchun driverOwes ni hisoblash
    const processedFlights = flights.map(f => {
      // ✅ Faqat tugallangan reyslar uchun qarz hisoblanadi
      const calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;

      return {
        ...f,
        driverOwes: calculatedDriverOwes,
        calculatedNetProfit: f.netProfit || 0,
        calculatedTotalIncome: (f.totalPayment || 0) + (f.totalGivenBudget || 0),
        lightExpenses: f.lightExpenses || 0,
        heavyExpenses: f.heavyExpenses || 0
      };
    });

    // Faqat qarz bo'lgan marshrutlarni olish
    let filteredFlights = processedFlights.filter(f => f.driverOwes > 0);

    if (status === 'pending') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus !== 'paid');
    } else if (status === 'paid') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus === 'paid');
    }

    // Qolgan qarzni hisoblash
    const totalDebt = filteredFlights.reduce((sum, f) => {
      if (f.driverPaymentStatus === 'paid') return sum;
      const remaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    
    const paidAmount = filteredFlights.reduce((sum, f) => sum + (f.driverPaidAmount || 0), 0);

    // ✅ previousDebt ni qo'shish
    let totalPreviousDebt = 0;
    if (driverId) {
      const driver = await Driver.findById(driverId);
      totalPreviousDebt = driver?.previousDebt || 0;
    } else {
      // Barcha haydovchilarning previousDebt ini yig'ish
      const allDrivers = await Driver.find({ user: req.user._id });
      totalPreviousDebt = allDrivers.reduce((sum, d) => sum + (d.previousDebt || 0), 0);
    }

    res.json({
      success: true,
      data: filteredFlights,
      stats: {
        totalDebt: totalDebt + totalPreviousDebt, // ✅ previousDebt qo'shildi
        currentFlightsDebt: totalDebt,
        previousDebt: totalPreviousDebt,
        paidAmount,
        pendingCount: filteredFlights.filter(f => f.driverPaymentStatus !== 'paid').length,
        paidCount: filteredFlights.filter(f => f.driverPaymentStatus === 'paid').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});`;

    // Almashtirishni amalga oshirish
    if (content.includes(oldDriverDebtsLogic)) {
      content = content.replace(oldDriverDebtsLogic, newDriverDebtsLogic);
      console.log('✅ Driver debts endpoint yangilandi');
    } else {
      console.log('⚠️  Driver debts endpoint topilmadi yoki allaqachon yangilangan');
    }

    // Faylni saqlash
    fs.writeFileSync(apiFilePath, content, 'utf8');
    console.log('✅ API fayl saqlandi');

    console.log('\n🎉 API LOGIKASI MUVAFFAQIYATLI YANGILANDI!');
    console.log('=' .repeat(50));
    console.log('✅ Faqat tugallangan reyslar hisoblanadi');
    console.log('✅ previousDebt qo\'shildi');
    console.log('✅ Faol reyslar hisobotlarda ko\'rsatilmaydi');

  } catch (error) {
    console.error('❌ Xato:', error.message);
    console.error(error.stack);
  }
}

fixApiDebtLogic();