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
  // Fleet subscription
  fleetSubscription: {
    plan: {
      type: String,
      enum: ['trial', 'pro'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 kun trial
    }
  }
}, { timestamps: true });

// Hash password
businessmanSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
businessmanSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Businessman', businessmanSchema);
