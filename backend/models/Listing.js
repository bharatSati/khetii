const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be non-negative']
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Text index for search
listingSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
