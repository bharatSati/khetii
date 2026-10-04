const Post = require('../models/Post');
const User = require('../models/User');
const { uploadImageBuffer } = require('../services/cloudinaryService');

// Haversine formula to compute distance in km between two lat/lon points
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place (e.g. 1.8 km)
};

// Seed initial realistic posts around Delhi if none exist
const seedInitialCommunityPostsIfEmpty = async (userLat, userLon) => {
  try {
    const count = await Post.countDocuments();
    if (count > 0) return;

    // Create a mock community user if not existing
    let systemUser = await User.findOne({ email: 'community@kheti.in' });
    if (!systemUser) {
      systemUser = await User.create({
        name: 'कुलदीप शर्मा (किसान सलाहकार)',
        email: 'community@kheti.in',
        password: 'community_kheti_pass',
        state: 'Delhi',
        district: 'North Delhi',
        city: 'Delhi',
        latitude: userLat,
        longitude: userLon,
        locationRecorded: true
      });
    }

    // Coordinates within 1.2 km to 4.5 km of user's coordinates
    const initialPosts = [
      {
        author: systemUser._id,
        authorName: 'कुलदीप शर्मा (किसान सलाहकार)',
        authorLocation: { city: 'Delhi', district: 'North Delhi', state: 'Delhi' },
        title: 'रबी सीजन: गेहूं की डीबीडब्ल्यू 187 किस्म की बुवाई पर चर्चा',
        content: 'साथी किसान भाइयों, हमारे इलाके में गेहूं की बुवाई का सबसे अनुकूल समय 5 से 20 नवंबर के बीच है। DBW 187 या HD 3086 किस्म प्रति एकड़ 28-30 क्विंटल पैदावार दे रही है। किसी भाई को प्रमाणित बीज या रोटावेटर की आवश्यकता हो तो नीचे साझा करें।',
        category: 'crops',
        location: {
          type: 'Point',
          coordinates: [userLon + 0.012, userLat + 0.009] // ~1.5 km away
        },
        likeCount: 6,
        shares: 2,
        comments: [
          {
            user: systemUser._id,
            userName: 'महिपाल सिंह',
            userLocation: 'नरेला',
            text: 'शर्मा जी, क्या यह किस्म पीले रतुआ (Yellow Rust) के प्रति प्रतिरोधी है?'
          },
          {
            user: systemUser._id,
            userName: 'कुलदीप शर्मा (किसान सलाहकार)',
            userLocation: 'North Delhi',
            text: 'हाँ महिपाल जी, DBW 187 पीले और भूरे दोनों रतुआ से पूर्णतः सुरक्षित प्रमाणित है।'
          }
        ],
        commentCount: 2
      },
      {
        author: systemUser._id,
        authorName: 'बलजीत सिंह',
        authorLocation: { city: 'Delhi', district: 'North West Delhi', state: 'Delhi' },
        title: 'ट्रैक्टर लेजर लैंड लेवलर और कल्टीवेटर किराए पर उपलब्ध',
        content: 'हमारे 50 HP महिंद्रा ट्रैक्टर के साथ लेजर लेवलर खेत समतलीकरण के लिए उपलब्ध है। 5 किमी के दायरे में किसी भी किसान साथी को खेत तैयार करवाना हो तो संपर्क करें। उचित दर ₹650 प्रति घंटा।',
        category: 'equipment',
        location: {
          type: 'Point',
          coordinates: [userLon - 0.015, userLat + 0.011] // ~2.1 km away
        },
        likeCount: 4,
        shares: 1,
        comments: [
          {
            user: systemUser._id,
            userName: 'सत्यवीर यादव',
            userLocation: 'बवाना',
            text: 'कल सुबह 9 बजे 3 एकड़ खेत के लिए समय मिल सकता है क्या भाई?'
          }
        ],
        commentCount: 1
      },
      {
        author: systemUser._id,
        authorName: 'कृषि विज्ञान केंद्र अलर्ट',
        authorLocation: { city: 'Delhi', district: 'New Delhi', state: 'Delhi' },
        title: 'मौसम चेतावनी: अगले 48 घंटों में हल्की बूंदाबांदी का पूर्वानुमान',
        content: 'स्थानीय किसान ध्यान दें: तापमान में गिरावट के साथ हल्की ओस व नमी बढ़ने की संभावना है। सरसों की फसल में तना गलन रोग की रोकथाम हेतु जल निकासी सुनिश्चित करें और अनावश्यक सिंचाई से बचें।',
        category: 'weather_alert',
        location: {
          type: 'Point',
          coordinates: [userLon + 0.022, userLat - 0.018] // ~3.3 km away
        },
        likeCount: 9,
        shares: 5,
        comments: [],
        commentCount: 0
      }
    ];

    await Post.insertMany(initialPosts);
  } catch (err) {
    console.warn('Initial community post seed error:', err.message);
  }
};

// @desc Get posts within 5 km radius (or specified radiusKm)
// @route GET /api/samvaad/posts
const getPosts = async (req, res, next) => {
  try {
    let { lat, lon, radiusKm = 5, category, sort = 'closest' } = req.query;

    // Use logged in user coordinates if query params are not provided
    if ((!lat || !lon) && req.user) {
      lat = req.user.latitude;
      lon = req.user.longitude;
    }

    // Default to Delhi if still missing
    const userLat = lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : 28.6139;
    const userLon = lon !== undefined && !isNaN(Number(lon)) ? Number(lon) : 77.2090;
    const maxRadius = Math.max(1, Math.min(Number(radiusKm) || 5, 50)); // default 5 km, max 50 km

    // Seed mock community posts if empty so the page is immediately lively
    await seedInitialCommunityPostsIfEmpty(userLat, userLon);

    // MongoDB 2dsphere centerSphere query (radius in radians = km / Earth's radius in km)
    const radiusInRadians = maxRadius / 6378.1;
    const filter = {
      location: {
        $geoWithin: {
          $centerSphere: [[userLon, userLat], radiusInRadians]
        }
      }
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;

    // Attach exact distanceKm and isLikedByMe to each post
    const enrichedPosts = posts.map((post) => {
      const postLon = post.location?.coordinates?.[0] ?? userLon;
      const postLat = post.location?.coordinates?.[1] ?? userLat;
      const distance = calculateDistanceKm(userLat, userLon, postLat, postLon);

      const isLikedByMe = currentUserId
        ? (post.likes || []).some((id) => id.toString() === currentUserId)
        : false;

      return {
        ...post,
        distanceKm: distance,
        isLikedByMe,
        isAuthor: currentUserId ? post.author.toString() === currentUserId : false
      };
    });

    // Sort by closest distance or newest
    if (sort === 'closest') {
      enrichedPosts.sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      enrichedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      success: true,
      userLocation: {
        latitude: userLat,
        longitude: userLon,
        radiusKm: maxRadius
      },
      count: enrichedPosts.length,
      posts: enrichedPosts
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create a new community post
// @route POST /api/samvaad/posts
const createPost = async (req, res, next) => {
  try {
    const { title, content, category = 'general', lat, lon } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required.' });
    }

    const postLat = lat !== undefined && !isNaN(Number(lat))
      ? Number(lat)
      : (req.user?.latitude || 28.6139);
    const postLon = lon !== undefined && !isNaN(Number(lon))
      ? Number(lon)
      : (req.user?.longitude || 77.2090);

    // Process image attachment via Cloudinary (or fallback)
    let imageUrl = req.body.imageUrl || '';
    if (req.file && req.file.buffer) {
      try {
        imageUrl = await uploadImageBuffer(req.file.buffer, req.file.mimetype, 'kheti_samvaad');
      } catch (uploadErr) {
        console.warn('Image upload processing warning:', uploadErr.message);
      }
    }

    const post = await Post.create({
      author: req.user._id,
      authorName: req.user.name,
      authorLocation: {
        city: req.user.city || 'Delhi',
        district: req.user.district || 'New Delhi',
        state: req.user.state || 'Delhi'
      },
      title: title?.trim() || '',
      content: content.trim(),
      category,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [postLon, postLat]
      },
      likes: [],
      likeCount: 0,
      comments: [],
      commentCount: 0,
      shares: 0
    });

    const populated = {
      ...post.toObject(),
      distanceKm: 0,
      isLikedByMe: false,
      isAuthor: true
    };

    res.status(201).json({
      success: true,
      message: 'Post published to Local Samvaad successfully.',
      post: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle like on a post
// @route POST /api/samvaad/posts/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const userId = req.user._id;
    const userIndex = post.likes.findIndex((uid) => uid.toString() === userId.toString());

    let isLiked = false;
    if (userIndex > -1) {
      // User already liked -> unlike
      post.likes.splice(userIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
      isLiked = false;
    } else {
      // Like
      post.likes.push(userId);
      post.likeCount += 1;
      isLiked = true;
    }

    await post.save();

    res.json({
      success: true,
      isLiked,
      likeCount: post.likeCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add comment to a post
// @route POST /api/samvaad/posts/:id/comment
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.name,
      userLocation: req.user.district || req.user.city || 'किसान साथी',
      text: text.trim()
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment posted.',
      comment: newComment,
      commentCount: post.commentCount,
      comments: post.comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc Increment share count of a post
// @route POST /api/samvaad/posts/:id/share
const sharePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.json({
      success: true,
      shares: post.shares
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete own post
// @route DELETE /api/samvaad/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this post.' });
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  sharePost,
  deletePost
};
