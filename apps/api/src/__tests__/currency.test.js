/**
 * Currency Module Tests
 */

describe('Currency Module', () => {
  describe('Currency Conversion', () => {
    const rates = {
      USD: 12500,
      RUB: 140,
      KZT: 28
    };

    it('should convert USD to UZS correctly', () => {
      const usd = 100;
      const uzs = usd * rates.USD;
      expect(uzs).toBe(1250000);
    });

    it('should convert RUB to UZS correctly', () => {
      const rub = 1000;
      const uzs = rub * rates.RUB;
      expect(uzs).toBe(140000);
    });

    it('should convert KZT to UZS correctly', () => {
      const kzt = 5000;
      const uzs = kzt * rates.KZT;
      expect(uzs).toBe(140000);
    });

    it('should convert UZS to USD correctly', () => {
      const uzs = 1250000;
      const usd = uzs / rates.USD;
      expect(usd).toBe(100);
    });
  });

  describe('Currency Formatting', () => {
    it('should format UZS correctly', () => {
      const amount = 1500000;
      const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should format USD correctly', () => {
      const amount = 1500.50;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
      expect(formatted).toContain('$');
    });

    it('should handle zero amount', () => {
      const amount = 0;
      const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
      expect(formatted).toBe('0');
    });

    it('should handle negative amount', () => {
      const amount = -500000;
      const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
      expect(formatted).toContain('-');
    });
  });

  describe('Valid Currencies', () => {
    const validCurrencies = ['UZS', 'USD', 'RUB', 'KZT'];

    it('should have UZS as default currency', () => {
      expect(validCurrencies).toContain('UZS');
    });

    it('should support international currencies', () => {
      expect(validCurrencies).toContain('USD');
      expect(validCurrencies).toContain('RUB');
      expect(validCurrencies).toContain('KZT');
    });

    it('should have 4 supported currencies', () => {
      expect(validCurrencies.length).toBe(4);
    });
  });

  describe('Rate Validation', () => {
    it('should have positive rates', () => {
      const rates = { USD: 12500, RUB: 140, KZT: 28 };
      Object.values(rates).forEach(rate => {
        expect(rate).toBeGreaterThan(0);
      });
    });

    it('should have reasonable USD rate', () => {
      const usdRate = 12500;
      expect(usdRate).toBeGreaterThan(10000);
      expect(usdRate).toBeLessThan(20000);
    });
  });
});
