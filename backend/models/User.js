const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    // Explicit project constraint: Do NOT hash password (stored as plain text)
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'hi'
    },
    state: {
      type: String,
      default: 'Delhi',
      trim: true
    },
    district: {
      type: String,
      default: 'New Delhi',
      trim: true
    },
    city: {
      type: String,
      default: 'Delhi',
      trim: true
    },
    latitude: {
      type: Number,
      default: 28.6139
    },
    longitude: {
      type: Number,
      default: 77.2090
    },
    locationRecorded: {
      type: Boolean,
      default: false
    },
    landSizeAcres: {
      type: Number,
      default: 0
    },
    mainCrops: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Helper to remove password before returning JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
