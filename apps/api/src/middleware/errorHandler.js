// ==========================================
// XAVFSIZ ERROR HANDLER
// ==========================================

const isDevelopment = process.env.NODE_ENV === 'development';

// Custom API Error class
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Xato turlarini aniqlash
const getErrorType = (err) => {
  if (err.name === 'ValidationError') return 'VALIDATION_ERROR';
  if (err.name === 'CastError') return 'INVALID_ID';
  if (err.code === 11000) return 'DUPLICATE_KEY';
  if (err.name === 'JsonWebTokenError') return 'INVALID_TOKEN';
  if (err.name === 'TokenExpiredError') return 'TOKEN_EXPIRED';
  if (err.name === 'MongoServerError') return 'DATABASE_ERROR';
  if (err.name === 'MongoNetworkError') return 'DATABASE_CONNECTION';
  return 'INTERNAL_ERROR';
};

// Foydalanuvchiga xavfsiz xabar
const getSafeMessage = (err, errorType) => {
  const messages = {
    VALIDATION_ERROR: 'Kiritilgan ma\'lumotlar noto\'g\'ri',
    INVALID_ID: 'Noto\'g\'ri ID formati',
    DUPLICATE_KEY: 'Bu ma\'lumot allaqachon mavjud',
    INVALID_TOKEN: 'Token yaroqsiz',
    TOKEN_EXPIRED: 'Token muddati tugagan',
    DATABASE_ERROR: 'Ma\'lumotlar bazasi xatosi',
    DATABASE_CONNECTION: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi',
    INTERNAL_ERROR: 'Serverda xatolik yuz berdi'
  };
  
  // Operational xatolar uchun asl xabarni ko'rsatish
  if (err.isOperational) {
    return err.message;
  }
  
  return messages[errorType] || messages.INTERNAL_ERROR;
};

// Status code aniqlash
const getStatusCode = (err, errorType) => {
  if (err.statusCode) return err.statusCode;
  
  const statusCodes = {
    VALIDATION_ERROR: 400,
    INVALID_ID: 400,
    DUPLICATE_KEY: 409,
    INVALID_TOKEN: 401,
    TOKEN_EXPIRED: 401,
    DATABASE_ERROR: 500,
    DATABASE_CONNECTION: 503,
    INTERNAL_ERROR: 500
  };
  
  return statusCodes[errorType] || 500;
};

// Mongoose validation xatolarini formatlash
const formatValidationErrors = (err) => {
  if (err.name !== 'ValidationError') return null;
  
  const errors = Object.values(err.errors).map(e => ({
    field: e.path,
    message: e.message
  }));
  
  return errors;
};

// Duplicate key xatosini formatlash
const formatDuplicateKeyError = (err) => {
  if (err.code !== 11000) return null;
  
  const field = Object.keys(err.keyValue || {})[0];
  return {
    field,
    message: `${field} allaqachon mavjud`
  };
};

// ==========================================
// ASOSIY ERROR HANDLER MIDDLEWARE
// ==========================================

const errorHandler = (err, req, res, next) => {
  const errorType = getErrorType(err);
  const statusCode = getStatusCode(err, errorType);
  const safeMessage = getSafeMessage(err, errorType);
  
  // Xatoni log qilish (faqat server tomonida)
  if (statusCode >= 500 || !err.isOperational) {
    console.error('❌ Server xatosi:', {
      type: errorType,
      message: err.message,
      // Stack faqat development'da
      ...(isDevelopment && { stack: err.stack }),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Response
  const response = {
    success: false,
    message: safeMessage,
    errorType
  };
  
  // Validation xatolarini qo'shish
  const validationErrors = formatValidationErrors(err);
  if (validationErrors) {
    response.errors = validationErrors;
  }
  
  // Duplicate key xatosini qo'shish
  const duplicateError = formatDuplicateKeyError(err);
  if (duplicateError) {
    response.error = duplicateError;
  }
  
  // Development'da qo'shimcha ma'lumot
  if (isDevelopment) {
    response.debug = {
      originalMessage: err.message,
      stack: err.stack?.split('\n').slice(0, 5)
    };
  }
  
  res.status(statusCode).json(response);
};

// ==========================================
// 404 HANDLER
// ==========================================

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint topilmadi: ${req.method} ${req.path}`,
    errorType: 'NOT_FOUND'
  });
};

// ==========================================
// ASYNC HANDLER WRAPPER
// ==========================================

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
