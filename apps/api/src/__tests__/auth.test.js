/**
 * Auth Routes Tests
 */

const { authSchemas } = require('../utils/validators');

describe('Auth Module', () => {
  describe('Login Schema', () => {
    it('should accept valid login credentials', () => {
      const validData = { username: 'testuser', password: 'password123' };
      const { error } = authSchemas.login.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject empty username', () => {
      const { error } = authSchemas.login.validate({ username: '', password: 'pass' });
      expect(error).toBeDefined();
    });

    it('should reject empty password', () => {
      const { error } = authSchemas.login.validate({ username: 'user', password: '' });
      expect(error).toBeDefined();
    });

    it('should reject missing fields', () => {
      const { error: e1 } = authSchemas.login.validate({});
      const { error: e2 } = authSchemas.login.validate({ username: 'user' });
      const { error: e3 } = authSchemas.login.validate({ password: 'pass' });
      expect(e1).toBeDefined();
      expect(e2).toBeDefined();
      expect(e3).toBeDefined();
    });
  });

  describe('Register Schema', () => {
    const validRegister = {
      username: 'newuser',
      password: 'Password1!',
      fullName: 'Test User',
      companyName: 'Test Company',
      phone: '+998901234567'
    };

    it('should accept valid registration data', () => {
      const { error } = authSchemas.register.validate(validRegister);
      expect(error).toBeUndefined();
    });

    it('should reject username less than 3 characters', () => {
      const { error } = authSchemas.register.validate({ ...validRegister, username: 'ab' });
      expect(error).toBeDefined();
    });

    it('should reject password less than 6 characters', () => {
      const { error } = authSchemas.register.validate({ ...validRegister, password: '12345' });
      expect(error).toBeDefined();
    });

    it('should accept registration without optional fields', () => {
      const minimalData = {
        username: 'testuser',
        password: 'Password1!',
        fullName: 'Test User'
      };
      const { error } = authSchemas.register.validate(minimalData);
      expect(error).toBeUndefined();
    });
  });
});
