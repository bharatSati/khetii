const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    userLocation: {
      type: String,
      default: 'किसान साथी',
      trim: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    authorLocation: {
      city: { type: String, default: 'Delhi' },
      district: { type: String, default: 'New Delhi' },
      state: { type: String, default: 'Delhi' }
    },
    title: {
      type: String,
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: 2500,
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'crops', 'equipment', 'weather_alert', 'pest_help', 'market_advice'],
      default: 'general',
      index: true
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    // GeoJSON Point for 2dsphere indexing and geospatial 5km radius queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    likeCount: {
      type: Number,
      default: 0
    },
    comments: [commentSchema],
    commentCount: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere spatial index for hyperlocal geospatial queries
postSchema.index({ location: '2dsphere' });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
