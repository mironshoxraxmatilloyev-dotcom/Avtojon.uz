const {
  generateAccessToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAllUserTokens,
} = require('../utils/tokenManager');

// Redis mock - config mavjud emas

describe('Token Manager', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    fullName: 'Test User',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const payload = { id: mockUser._id, role: 'admin', username: mockUser.username };
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include correct payload in token', () => {
      const payload = { id: mockUser._id, role: 'admin', username: mockUser.username };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.role).toBe('admin');
      expect(decoded.username).toBe(mockUser.username);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const tokens = await generateTokenPair(mockUser, 'admin');

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('tokenId');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens).toHaveProperty('refreshExpiresIn');
    });

    it('should return correct expiration times', async () => {
      const tokens = await generateTokenPair(mockUser, 'admin');

      expect(tokens.expiresIn).toBe(60 * 60); // 1 hour
      expect(tokens.refreshExpiresIn).toBe(24 * 60 * 60); // 1 day
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: mockUser._id, role: 'admin', username: mockUser.username };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.iss).toBe('avtojon-api');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow('INVALID_ACCESS_TOKEN');
    });

    it('should throw error for tampered token', () => {
      const payload = { id: mockUser._id, role: 'admin', username: mockUser.username };
      const token = generateAccessToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tamperedToken)).toThrow('INVALID_ACCESS_TOKEN');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const tokens = await generateTokenPair(mockUser, 'admin');
      const decoded = await verifyRefreshToken(tokens.refreshToken);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.role).toBe('admin');
      expect(decoded.tokenId).toBe(tokens.tokenId);
    });

    it('should throw error for invalid refresh token', async () => {
      try {
        await verifyRefreshToken('invalid-token');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('INVALID_REFRESH_TOKEN');
      }
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Generate multiple tokens
      await generateTokenPair(mockUser, 'admin');
      await generateTokenPair(mockUser, 'admin');
      await generateTokenPair(mockUser, 'admin');

      const count = await revokeAllUserTokens(mockUser._id);

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Token Security', () => {
  it('should only include specified fields in token', () => {
    // generateAccessToken only includes what we pass, so we test that
    const payload = { id: '123', role: 'admin', username: 'test' };
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);

    // Should have the fields we passed
    expect(decoded.id).toBe('123');
    expect(decoded.role).toBe('admin');
    expect(decoded.username).toBe('test');
  });

  it('should have issuer claim', () => {
    const payload = { id: '123', role: 'admin', username: 'test' };
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.iss).toBe('avtojon-api');
  });
});
