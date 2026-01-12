// 🎯 Form Validation Utilities

// Validation rules
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak'
  },
  password: {
    minLength: 6,
    maxLength: 50,
    message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
  },
  phone: {
    pattern: /^\+998[0-9]{9}$/,
    message: 'Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email formati noto\'g\'ri'
  },
  plateNumber: {
    pattern: /^[0-9]{2}\s?[A-Z]\s?[0-9]{3}\s?[A-Z]{2}$/i,
    message: 'Davlat raqami formati: 01 A 123 AB'
  }
}

// 🎯 Validate single field
export const validateField = (name, value, rules = {}) => {
  const errors = []
  const rule = VALIDATION_RULES[name] || rules

  // Required check
  if (rules.required && (!value || !value.toString().trim())) {
    return { valid: false, error: `${rules.label || name} majburiy` }
  }

  if (!value || !value.toString().trim()) {
    return { valid: true, error: null }
  }

  const strValue = value.toString().trim()

  // Min length
  if (rule.minLength && strValue.length < rule.minLength) {
    errors.push(`Kamida ${rule.minLength} ta belgi bo'lishi kerak`)
  }

  // Max length
  if (rule.maxLength && strValue.length > rule.maxLength) {
    errors.push(`Ko'pi bilan ${rule.maxLength} ta belgi bo'lishi kerak`)
  }

  // Pattern
  if (rule.pattern && !rule.pattern.test(strValue)) {
    errors.push(rule.message || 'Format noto\'g\'ri')
  }

  // Custom validator
  if (rule.validator && typeof rule.validator === 'function') {
    const customError = rule.validator(strValue)
    if (customError) errors.push(customError)
  }

  return {
    valid: errors.length === 0,
    error: errors[0] || null,
    errors
  }
}

// 🎯 Validate entire form
export const validateForm = (formData, schema) => {
  const errors = {}
  let isValid = true

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateField(field, formData[field], rules)
    if (!result.valid) {
      errors[field] = result.error
      isValid = false
    }
  }

  return { isValid, errors }
}

// 🎯 Common validation schemas
export const SCHEMAS = {
  login: {
    username: { required: true, label: 'Username', ...VALIDATION_RULES.username },
    password: { required: true, label: 'Parol', ...VALIDATION_RULES.password }
  },
  register: {
    fullName: { required: true, label: 'To\'liq ism', minLength: 2, maxLength: 100 },
    username: { required: true, label: 'Username', ...VALIDATION_RULES.username },
    password: { required: true, label: 'Parol', ...VALIDATION_RULES.password },
    companyName: { required: false, label: 'Kompaniya', maxLength: 100 },
    phone: { required: false, label: 'Telefon' }
  },
  driver: {
    fullName: { required: true, label: 'To\'liq ism', minLength: 2, maxLength: 100 },
    username: { required: true, label: 'Username', ...VALIDATION_RULES.username },
    phone: { required: false, label: 'Telefon' }
  },
  vehicle: {
    plateNumber: { required: true, label: 'Davlat raqami', ...VALIDATION_RULES.plateNumber },
    brand: { required: true, label: 'Marka', minLength: 2, maxLength: 50 },
    year: { required: false, label: 'Yil', validator: (v) => {
      const year = parseInt(v)
      if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
        return 'Yil 1990 dan hozirgi yilgacha bo\'lishi kerak'
      }
      return null
    }}
  },
  flight: {
    fromCity: { required: true, label: 'Qayerdan', minLength: 2 },
    toCity: { required: true, label: 'Qayerga', minLength: 2 }
  }
}

// 🎯 Format phone number
export const formatPhone = (phone) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('998')) {
    return '+' + digits
  }
  if (digits.length === 9) {
    return '+998' + digits
  }
  return phone
}

// 🎯 Format plate number
export const formatPlateNumber = (plate) => {
  if (!plate) return ''
  return plate.toUpperCase().replace(/\s+/g, ' ').trim()
}

// 🎯 Format money
export const formatMoney = (amount, currency = 'som') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('uz-UZ').format(amount) + (currency ? ` ${currency}` : '')
}

// 🎯 Parse money string to number
export const parseMoney = (str) => {
  if (!str) return 0
  return parseInt(str.toString().replace(/\D/g, '')) || 0
}
