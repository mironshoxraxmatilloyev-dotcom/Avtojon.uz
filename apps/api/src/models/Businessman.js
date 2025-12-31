const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessmanSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Ism majburiy'],
    trim: true
  },
  businessType: {
    type: String,
    required: [true, 'Biznes turi majburiy'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Telefon raqam majburiy'],
    trim: true
  },
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
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'super_admin'
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
businessmanSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8); // 8 rounds - tezroq
  next();
});

// Compare password
businessmanSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Obuna holatini tekshirish
businessmanSchema.methods.checkSubscription = function() {
  const now = new Date();
  const endDate = this.subscription?.endDate || new Date();
  const isExpired = now > endDate;
  
  return {
    plan: this.subscription?.plan || 'trial',
    startDate: this.subscription?.startDate,
    endDate: this.subscription?.endDate,
    isExpired,
    daysLeft: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)),
    msLeft: isExpired ? 0 : endDate - now
  };
};

// Pro tarifga o'tkazish
businessmanSchema.methods.upgradeToPro = async function(months = 1) {
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
businessmanSchema.statics.getPlans = function() {
  return {
    trial: { name: 'Sinov', duration: '1 daqiqa', price: 0 },
    basic: { name: 'Asosiy', duration: '1 oy', price: 30000 },
    pro: { name: 'Pro', duration: '1 oy', price: 50000 }
  };
};

// Index yaratish - tez qidiruv uchun (username allaqachon unique: true orqali indexed)
businessmanSchema.index({ isActive: 1 });
businessmanSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Businessman', businessmanSchema);
