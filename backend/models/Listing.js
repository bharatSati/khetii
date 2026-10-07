const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5
    },
    comment: {
      type: String,
      default: '',
      trim: true
    },
    verifiedBuyer: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

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
    whatsappNumber: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    sellerName: {
      type: String,
      trim: true,
      default: ''
    },
    sellerExperience: {
      type: String,
      default: 'प्रमाणित किसान (Verified Member)'
    },
    isVerifiedSeller: {
      type: Boolean,
      default: true
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Text index for search
listingSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
