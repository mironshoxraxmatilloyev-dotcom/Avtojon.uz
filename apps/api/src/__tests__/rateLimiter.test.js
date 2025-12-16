const { createRateLimiter } = require('../middleware/rateLimiter');

describe('Rate Limiter', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      on: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('createRateLimiter', () => {
    it('should allow requests under the limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 10 });

      // First request should pass
      limiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should set rate limit headers', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 10 });

      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should block requests over the limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 2 });

      // Use unique IP for this test
      mockReq.ip = '192.168.1.' + Math.floor(Math.random() * 255);

      // First two requests should pass
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      // Reset mocks
      mockNext.mockClear();
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Third request should be blocked
      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorType: 'RATE_LIMIT_EXCEEDED',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom key generator', () => {
      const keyGenerator = jest.fn((req) => `custom:${req.body.username}`);
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10,
        keyGenerator,
      });

      mockReq.body.username = 'testuser';
      limiter(mockReq, mockRes, mockNext);

      expect(keyGenerator).toHaveBeenCalledWith(mockReq);
    });

    it('should return custom message when blocked', () => {
      const customMessage = 'Custom rate limit message';
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        message: customMessage,
      });

      // Use unique IP
      mockReq.ip = '10.0.0.' + Math.floor(Math.random() * 255);

      // First request passes
      limiter(mockReq, mockRes, mockNext);

      // Reset mocks
      mockRes.json.mockClear();

      // Second request blocked
      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage,
        })
      );
    });

    it('should include retryAfter in response', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 1 });

      // Use unique IP
      mockReq.ip = '172.16.0.' + Math.floor(Math.random() * 255);

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: expect.any(Number),
        })
      );
    });
  });

  describe('Different IPs', () => {
    it('should track different IPs separately', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 1 });

      // First IP
      mockReq.ip = '1.1.1.1';
      limiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      mockNext.mockClear();

      // Second IP should also pass
      mockReq.ip = '2.2.2.2';
      limiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
