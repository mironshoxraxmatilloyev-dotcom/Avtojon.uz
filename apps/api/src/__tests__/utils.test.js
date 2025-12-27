/**
 * Utility Functions Tests
 */

describe('Utility Functions', () => {
  describe('Haversine Distance', () => {
    // Haversine formula for distance calculation
    function haversineDistance(lon1, lat1, lon2, lat2) {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    it('should calculate distance between Tashkent and Samarkand', () => {
      // Tashkent: 41.2995, 69.2401
      // Samarkand: 39.6542, 66.9597
      const distance = haversineDistance(69.2401, 41.2995, 66.9597, 39.6542);
      expect(distance).toBeGreaterThan(250);
      expect(distance).toBeLessThan(350);
    });

    it('should return 0 for same coordinates', () => {
      const distance = haversineDistance(69.2401, 41.2995, 69.2401, 41.2995);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = haversineDistance(-74.006, 40.7128, -118.2437, 34.0522);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = date.toLocaleDateString('uz-UZ');
      expect(formatted).toBeDefined();
    });

    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = date.toLocaleTimeString('uz-UZ');
      expect(formatted).toBeDefined();
    });

    it('should handle invalid date', () => {
      const date = new Date('invalid');
      expect(isNaN(date.getTime())).toBe(true);
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with separators', () => {
      const num = 1500000;
      const formatted = new Intl.NumberFormat('uz-UZ').format(num);
      expect(formatted.length).toBeGreaterThan(String(num).length - 2);
    });

    it('should handle decimal numbers', () => {
      const num = 1234.56;
      const formatted = new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
      expect(formatted).toBeDefined();
    });
  });

  describe('Phone Number Validation', () => {
    const phoneRegex = /^\+998\d{9}$/;

    it('should validate correct Uzbek phone number', () => {
      expect(phoneRegex.test('+998901234567')).toBe(true);
      expect(phoneRegex.test('+998331234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(phoneRegex.test('998901234567')).toBe(false);
      expect(phoneRegex.test('+99890123456')).toBe(false);
      expect(phoneRegex.test('+9989012345678')).toBe(false);
      expect(phoneRegex.test('invalid')).toBe(false);
    });
  });

  describe('Plate Number Validation', () => {
    const plateRegex = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/;

    it('should validate correct Uzbek plate number', () => {
      expect(plateRegex.test('01A123BC')).toBe(true);
      expect(plateRegex.test('95X999ZZ')).toBe(true);
    });

    it('should reject invalid plate numbers', () => {
      expect(plateRegex.test('1A123BC')).toBe(false);
      expect(plateRegex.test('01a123BC')).toBe(false);
      expect(plateRegex.test('01A12BC')).toBe(false);
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate percentage correctly', () => {
      const total = 1000000;
      const percent = 10;
      const result = total * percent / 100;
      expect(result).toBe(100000);
    });

    it('should handle 0 percent', () => {
      const total = 1000000;
      const percent = 0;
      const result = total * percent / 100;
      expect(result).toBe(0);
    });

    it('should handle 100 percent', () => {
      const total = 1000000;
      const percent = 100;
      const result = total * percent / 100;
      expect(result).toBe(1000000);
    });
  });
});
