const Joi = require('joi');

// ==========================================
// UMUMIY VALIDATSIYA QOIDALARI
// ==========================================

// MongoDB ObjectId validatsiyasi
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Noto\'g\'ri ID formati'
});

// Telefon raqam (O'zbekiston formati)
const phoneNumber = Joi.string()
  .pattern(/^(\+998|998)?[0-9]{9}$/)
  .messages({
    'string.pattern.base': 'Telefon raqam formati noto\'g\'ri. Masalan: +998901234567'
  });

// Kuchli parol validatsiyasi
const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Parol 128 ta belgidan oshmasligi kerak',
    'string.pattern.base': 'Parol kamida 1 ta katta harf, 1 ta kichik harf, 1 ta raqam va 1 ta maxsus belgi (@$!%*?&) bo\'lishi kerak'
  });

// Oddiy parol (mavjud foydalanuvchilar uchun) - lotin va kirill
const simplePassword = Joi.string()
  .min(6)
  .max(128)
  .messages({
    'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Parol 128 ta belgidan oshmasligi kerak'
  });

// Username validatsiyasi - lotin va kirill harflarini qabul qiladi
const username = Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Zа-яёўқғҳА-ЯЁЎҚҒҲ0-9_]+$/)
  .trim()
  .messages({
    'string.min': 'Username kamida 3 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Username 30 ta belgidan oshmasligi kerak',
    'string.pattern.base': 'Username faqat harflar (lotin/kirill), raqamlar va pastki chiziq (_) dan iborat bo\'lishi kerak'
  });

// ==========================================
// AUTH VALIDATSIYALARI
// ==========================================

const authSchemas = {
  register: Joi.object({
    username: username.required(),
    password: simplePassword.required(), // strongPassword o'rniga simplePassword - foydalanuvchi uchun oson
    fullName: Joi.string().min(2).max(100).trim().required().messages({
      'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
      'any.required': 'To\'liq ism kiritilishi shart'
    }),
    companyName: Joi.string().max(100).trim().allow('').optional(),
    phone: Joi.string().allow('', null).optional() // phoneNumber o'rniga oddiy string - telefon ixtiyoriy
  }),

  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': 'Username kiritilishi shart'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Parol kiritilishi shart'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: simplePassword.required(), // Oddiy parol - kamida 6 ta belgi
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Parollar mos kelmayapti'
    })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  })
};

// ==========================================
// DRIVER VALIDATSIYALARI
// ==========================================

const driverSchemas = {
  create: Joi.object({
    fullName: Joi.string().min(2).max(100).trim().required(),
    phone: phoneNumber.required(),
    username: username.required(),
    password: simplePassword.required(),
    licenseNumber: Joi.string().max(50).trim().allow(''),
    address: Joi.string().max(200).trim().allow('')
  }),

  update: Joi.object({
    fullName: Joi.string().min(2).max(100).trim(),
    phone: phoneNumber,
    licenseNumber: Joi.string().max(50).trim().allow(''),
    address: Joi.string().max(200).trim().allow(''),
    isActive: Joi.boolean()
  }),

  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    accuracy: Joi.number().min(0).max(100000),
    speed: Joi.number().min(0).max(500).allow(null),
    heading: Joi.number().min(0).max(360).allow(null),
    altitude: Joi.number().allow(null),
    altitudeAccuracy: Joi.number().allow(null),
    timestamp: Joi.number()
  })
};

// ==========================================
// VEHICLE VALIDATSIYALARI
// ==========================================

const vehicleSchemas = {
  create: Joi.object({
    plateNumber: Joi.string().min(2).max(20).trim().uppercase().required().messages({
      'any.required': 'Davlat raqami kiritilishi shart'
    }),
    brand: Joi.string().max(50).trim().allow(''),
    model: Joi.string().max(50).trim().allow(''),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
    color: Joi.string().max(30).trim().allow(''),
    capacity: Joi.number().min(0).max(1000000),
    fuelType: Joi.string().valid('benzin', 'dizel', 'gaz', 'elektr', 'gibrid').allow('')
  }),

  update: Joi.object({
    plateNumber: Joi.string().min(2).max(20).trim().uppercase(),
    brand: Joi.string().max(50).trim().allow(''),
    model: Joi.string().max(50).trim().allow(''),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
    color: Joi.string().max(30).trim().allow(''),
    capacity: Joi.number().min(0).max(1000000),
    fuelType: Joi.string().valid('benzin', 'dizel', 'gaz', 'elektr', 'gibrid').allow(''),
    isActive: Joi.boolean()
  })
};

// ==========================================
// TRIP VALIDATSIYALARI
// ==========================================

const tripSchemas = {
  create: Joi.object({
    driver: objectId.required(),
    vehicle: objectId.required(),
    startAddress: Joi.string().max(200).trim().required(),
    endAddress: Joi.string().max(200).trim().required(),
    startCoords: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }),
    endCoords: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }),
    tripBudget: Joi.number().min(0).max(1000000000),
    notes: Joi.string().max(500).trim().allow('')
  }),

  update: Joi.object({
    startAddress: Joi.string().max(200).trim(),
    endAddress: Joi.string().max(200).trim(),
    tripBudget: Joi.number().min(0).max(1000000000),
    bonusAmount: Joi.number().min(0).max(100000000),
    penaltyAmount: Joi.number().min(0).max(100000000),
    notes: Joi.string().max(500).trim().allow('')
  })
};

// ==========================================
// FLIGHT VALIDATSIYALARI
// ==========================================

const flightSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).trim(),
    driver: objectId.required(),
    vehicle: objectId.required(),
    flightType: Joi.string().valid('local', 'international').default('local'),
    legs: Joi.array().items(Joi.object({
      fromCity: Joi.string().max(100).trim().required(),
      toCity: Joi.string().max(100).trim().required(),
      fromCoords: Joi.object({
        lat: Joi.number().min(-90).max(90),
        lng: Joi.number().min(-180).max(180)
      }),
      toCoords: Joi.object({
        lat: Joi.number().min(-90).max(90),
        lng: Joi.number().min(-180).max(180)
      }),
      distance: Joi.number().min(0).max(50000),
      payment: Joi.number().min(0).max(1000000000)
    })).min(1).required(),
    notes: Joi.string().max(1000).trim().allow('')
  }),

  addExpense: Joi.object({
    type: Joi.string().valid('fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'fuel_metan', 'fuel_propan', 'toll', 'food', 'repair', 'fine', 'other').required(),
    amount: Joi.number().min(0).max(1000000000).required(),
    description: Joi.string().max(200).trim().allow(''),
    legIndex: Joi.number().integer().min(0)
  })
};

// ==========================================
// EXPENSE VALIDATSIYALARI
// ==========================================

const expenseSchemas = {
  create: Joi.object({
    trip: objectId,
    flight: objectId,
    type: Joi.string().valid('fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'fuel_metan', 'fuel_propan', 'toll', 'food', 'repair', 'fine', 'other').required(),
    amount: Joi.number().min(0).max(1000000000).required(),
    description: Joi.string().max(500).trim().allow(''),
    date: Joi.date().max('now')
  }).or('trip', 'flight')
};

// ==========================================
// SALARY VALIDATSIYALARI
// ==========================================

const salarySchemas = {
  create: Joi.object({
    driver: objectId.required(),
    amount: Joi.number().min(0).max(1000000000).required(),
    type: Joi.string().valid('salary', 'bonus', 'advance', 'deduction').required(),
    description: Joi.string().max(500).trim().allow(''),
    date: Joi.date()
  })
};

// ==========================================
// PAGINATION VALIDATSIYASI
// ==========================================

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().max(50),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(100).trim()
});

// ==========================================
// SANITIZE FUNKSIYALARI
// ==========================================

// NoSQL injection oldini olish
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.replace(/[\$\.]/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(item => sanitizeInput(item));
    }
    const sanitized = {};
    for (const key of Object.keys(input)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

// HTML/XSS tozalash
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    req[property] = sanitizeInput(req[property]);
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Noto'g'ri ${paramName} formati`
      });
    }
    next();
  };
};

module.exports = {
  authSchemas,
  driverSchemas,
  vehicleSchemas,
  tripSchemas,
  flightSchemas,
  expenseSchemas,
  salarySchemas,
  paginationSchema,
  validate,
  validateQuery,
  validateParams,
  validateObjectId,
  sanitizeInput,
  escapeHtml,
  objectId,
  phoneNumber,
  strongPassword,
  simplePassword,
  username
};
