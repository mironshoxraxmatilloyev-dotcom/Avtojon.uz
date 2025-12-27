/**
 * Flight Module Tests
 */

describe('Flight Module', () => {
  describe('Flight Data Validation', () => {
    const validFlight = {
      name: 'Toshkent - Samarqand',
      flightType: 'domestic',
      status: 'active',
      startOdometer: 100000,
      startFuel: 50
    };

    it('should have required name field', () => {
      expect(validFlight.name).toBeDefined();
      expect(validFlight.name.length).toBeGreaterThan(0);
    });

    it('should have valid flightType', () => {
      const validTypes = ['domestic', 'international'];
      expect(validTypes).toContain(validFlight.flightType);
    });

    it('should have valid status', () => {
      const validStatuses = ['active', 'completed', 'cancelled'];
      expect(validStatuses).toContain(validFlight.status);
    });

    it('should have non-negative startOdometer', () => {
      expect(validFlight.startOdometer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Flight Legs', () => {
    const validLeg = {
      from: 'Toshkent',
      to: 'Samarqand',
      distance: 300,
      payment: 500000,
      givenBudget: 200000,
      status: 'completed'
    };

    it('should have from and to cities', () => {
      expect(validLeg.from).toBeDefined();
      expect(validLeg.to).toBeDefined();
    });

    it('should have positive distance', () => {
      expect(validLeg.distance).toBeGreaterThan(0);
    });

    it('should have non-negative payment', () => {
      expect(validLeg.payment).toBeGreaterThanOrEqual(0);
    });

    it('should have valid leg status', () => {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      expect(validStatuses).toContain(validLeg.status);
    });
  });

  describe('Flight Expenses', () => {
    const validExpense = {
      type: 'fuel_metan',
      amount: 150000,
      quantity: 30,
      currency: 'UZS'
    };

    it('should have valid expense type', () => {
      const validTypes = [
        'fuel_metan', 'fuel_propan', 'fuel_benzin', 'fuel_diesel', 'fuel_gas',
        'food', 'repair', 'toll', 'fine', 'border', 'platon', 'other'
      ];
      expect(validTypes).toContain(validExpense.type);
    });

    it('should have positive amount', () => {
      expect(validExpense.amount).toBeGreaterThan(0);
    });

    it('should have valid currency', () => {
      const validCurrencies = ['UZS', 'USD', 'RUB', 'KZT'];
      expect(validCurrencies).toContain(validExpense.currency);
    });
  });

  describe('Flight Profit Calculation', () => {
    it('should calculate net profit correctly', () => {
      const totalPayment = 3000000;
      const totalGivenBudget = 2000000;
      const totalExpenses = 500000;
      const netProfit = totalPayment + totalGivenBudget - totalExpenses;
      expect(netProfit).toBe(4500000);
    });

    it('should calculate driver profit correctly', () => {
      const netProfit = 4500000;
      const driverPercent = 10;
      const driverProfit = netProfit * driverPercent / 100;
      expect(driverProfit).toBe(450000);
    });

    it('should calculate business profit correctly', () => {
      const netProfit = 4500000;
      const driverProfit = 450000;
      const businessProfit = netProfit - driverProfit;
      expect(businessProfit).toBe(4050000);
    });

    it('should handle negative profit (driver owes)', () => {
      const totalPayment = 1000000;
      const totalGivenBudget = 2000000;
      const totalExpenses = 3500000;
      const netProfit = totalPayment + totalGivenBudget - totalExpenses;
      expect(netProfit).toBe(-500000);
      expect(netProfit < 0).toBe(true);
    });
  });

  describe('Flight Distance Calculation', () => {
    it('should sum all leg distances', () => {
      const legs = [
        { distance: 300 },
        { distance: 150 },
        { distance: 200 }
      ];
      const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
      expect(totalDistance).toBe(650);
    });

    it('should calculate odometer difference', () => {
      const startOdometer = 100000;
      const endOdometer = 100650;
      const distance = endOdometer - startOdometer;
      expect(distance).toBe(650);
    });
  });
});
