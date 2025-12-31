const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true
  },
  companyName: String,
  phone: String,
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Subscription - obuna tizimi
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'pro'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => {
        // Test rejimda 1 daqiqa, production da 30 kun
        const trialMs = process.env.TRIAL_MINUTES 
          ? parseInt(process.env.TRIAL_MINUTES) * 60 * 1000 
          : 30 * 24 * 60 * 60 * 1000 // 30 kun default
        return new Date(Date.now() + trialMs)
      }
    },
    isExpired: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8); // 8 rounds - tezroq
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Obuna holatini tekshirish
userSchema.methods.checkSubscription = function() {
  const now = new Date();
  
  // Agar subscription mavjud bo'lmasa - yangi user, trial boshlanadi
  if (!this.subscription || !this.subscription.endDate) {
    // 30 kun trial
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      plan: 'trial',
      startDate: now,
      endDate: endDate,
      isExpired: false,
      daysLeft: 30,
      msLeft: 30 * 24 * 60 * 60 * 1000
    };
  }
  
  const endDate = new Date(this.subscription.endDate);
  const isExpired = now > endDate;
  
  return {
    plan: this.subscription.plan || 'trial',
    startDate: this.subscription.startDate,
    endDate: this.subscription.endDate,
    isExpired,
    daysLeft: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)),
    msLeft: isExpired ? 0 : endDate - now
  };
};

// Pro tarifga o'tkazish
userSchema.methods.upgradeToPro = async function(months = 1) {
  const now = new Date();
  this.subscription = {
    plan: 'pro',
    startDate: now,
    endDate: new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000),
    isExpired: false
  };
  return this.save();
};

// Statik metodlar
userSchema.statics.getPlans = function() {
  return {
    trial: { name: 'Sinov', duration: '7 kun', price: 0 },
    basic: { name: 'Asosiy', duration: '1 oy', price: 30000 },
    pro: { name: 'Pro', duration: '1 oy', price: 50000 }
  };
};

// Index yaratish - tez qidiruv uchun (username allaqachon unique: true orqali indexed)
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
