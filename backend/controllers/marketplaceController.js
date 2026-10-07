const Listing = require('../models/Listing');
const User = require('../models/User');
const { fetchExternalMarketplaceListings } = require('../services/marketplaceService');

// Seed verified farmer listings if database has 0 listings
const seedInitialListingsIfEmpty = async () => {
  try {
    const count = await Listing.countDocuments();
    if (count > 0) return;

    let adminFarmer = await User.findOne();
    if (!adminFarmer) {
      adminFarmer = await User.create({
        name: 'रामेश्वर पटेल (Rameshwar Patel)',
        email: 'farmer.admin@kheti.in',
        password: 'password123',
        language: 'hi',
        state: 'Madhya Pradesh',
        district: 'Sehore',
        city: 'Sehore'
      });
    }

    const starterListings = [
      {
        user: adminFarmer._id,
        title: 'शरबती गेहूं (Sharbati Premium Wheat Grade A)',
        category: 'Crops & Produce',
        description: 'शुद्ध सीहोर शरबती गेहूं। दाना मोटा, चमकदार और प्राकृतिक रूप से सुखाया हुआ। आटा बहुत ही मुलायम और मीठा बनता है। कोई मिलावट नहीं।',
        price: 2850,
        unit: 'quintal',
        quantity: 60,
        location: 'सीहोर, मध्य प्रदेश (Sehore, MP)',
        contactPhone: '9826012345',
        whatsappNumber: '9826012345',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&auto=format&fit=crop&q=80',
        sellerName: 'राजेश वर्मा (Rajesh Verma)',
        sellerExperience: '10+ वर्षों से प्रमाणित जैविक किसान',
        isVerifiedSeller: true,
        averageRating: 4.9,
        reviewCount: 3,
        reviews: [
          {
            userName: 'महेश पाटीदार (सीहोर)',
            rating: 5,
            comment: 'बहुत उत्तम गुणवत्ता का शरबती गेहूं मिला। पूरी तौल सही थी और सीधे खेत से लोड करवाया।',
            verifiedBuyer: true
          },
          {
            userName: 'सुनील कुमार (भोपाल)',
            rating: 5,
            comment: 'रोटियां बहुत नरम बनती हैं। अगली बार भी इन्हीं से खरीदेंगे।',
            verifiedBuyer: true
          },
          {
            userName: 'दिनेश शर्मा',
            rating: 4.8,
            comment: 'समय पर डिलीवरी मिली और किसान भाई का व्यवहार बहुत अच्छा था।',
            verifiedBuyer: true
          }
        ]
      },
      {
        user: adminFarmer._id,
        title: 'उन्नत पूसा बोल्ड सरसों बीज (Certified Pusa Bold Mustard Seeds)',
        category: 'Seeds',
        description: 'भारतीय कृषि अनुसंधान परिषद (ICAR) प्रमाणित पूसा बोल्ड सरसों के उच्च अंकुरण वाले बीज। तेल की मात्रा 41-42% तक। पाला व कीट सहने की उत्तम क्षमता।',
        price: 120,
        unit: 'kg',
        quantity: 250,
        location: 'भरतपुर, राजस्थान (Bharatpur, RJ)',
        contactPhone: '9414054321',
        whatsappNumber: '9414054321',
        imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=700&auto=format&fit=crop&q=80',
        sellerName: 'चौधरी धर्मवीर सिंह (Dharamveer Singh)',
        sellerExperience: 'प्रमाणित बीज उत्पादक किसान संघ',
        isVerifiedSeller: true,
        averageRating: 4.8,
        reviewCount: 2,
        reviews: [
          {
            userName: 'रामनिवास मीणा',
            rating: 5,
            comment: 'अंकुरण 92% से अधिक रहा, बहुत शानदार और निरोगी बीज है।',
            verifiedBuyer: true
          },
          {
            userName: 'गोपाल चौधरी',
            rating: 4.6,
            comment: 'बीज की पैकेट सीलिंग सही थी और तय रेट पर मिला।',
            verifiedBuyer: true
          }
        ]
      },
      {
        user: adminFarmer._id,
        title: 'शुद्ध केंचुआ खाद / वर्मीकम्पोस्ट (100% Pure Organic Vermicompost)',
        category: 'Fertilisers & Organic Manure',
        description: 'गोबर व नीम के पत्तों से तैयार उच्च गुणवत्ता युक्त वर्मीकम्पोस्ट। पौधों के विकास, मिट्टी में केंचुआ वृद्धि और नाइट्रोजन-फास्फोरस आपूर्ति के लिए सर्वोत्तम। 50 किलो की पैकिंग।',
        price: 450,
        unit: 'bag',
        quantity: 120,
        location: 'मेरठ, उत्तर प्रदेश (Meerut, UP)',
        contactPhone: '9897011223',
        whatsappNumber: '9897011223',
        imageUrl: 'https://images.unsplash.com/photo-1615811361543-6cf4b4542a42?w=700&auto=format&fit=crop&q=80',
        sellerName: 'सत्येंद्र तोमर (Satyendra Tomar)',
        sellerExperience: 'जैविक कृषि मित्र मेरठ',
        isVerifiedSeller: true,
        averageRating: 5.0,
        reviewCount: 2,
        reviews: [
          {
            userName: 'अरुण त्यागी',
            rating: 5,
            comment: 'गन्ने और सब्जियों में डाला था, पैदावार और मिट्टी में भारी सुधार दिखा।',
            verifiedBuyer: true
          },
          {
            userName: 'हरीश पाल',
            rating: 5,
            comment: 'खाद में कोई बदबू नहीं है, एकदम चाय पत्ती जैसा भुरभुरा है।',
            verifiedBuyer: true
          }
        ]
      },
      {
        user: adminFarmer._id,
        title: 'नासिक लाल प्याज (Fresh Desi Nashik Red Onion)',
        category: 'Crops & Produce',
        description: 'नासिक के खेतों से सीधे ताजा, ठोस और सूखा लाल प्याज। लंबे समय तक भंडारण के लिए उपयुक्त। होटल, मंडी और थोक व्यापारियों के लिए विशेष छूट।',
        price: 2150,
        unit: 'quintal',
        quantity: 90,
        location: 'नासिक, महाराष्ट्र (Nashik, MH)',
        contactPhone: '9822099887',
        whatsappNumber: '9822099887',
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=700&auto=format&fit=crop&q=80',
        sellerName: 'संदीप भोसले (Sandeep Bhosle)',
        sellerExperience: 'प्रगतिशील प्याज उत्पादक शेतकरी',
        isVerifiedSeller: true,
        averageRating: 4.7,
        reviewCount: 2,
        reviews: [
          {
            userName: 'दिलीप शिंदे',
            rating: 5,
            comment: 'बिल्कुल सूखा माल मिला, कोई सड़ा-गला नहीं था। सही भाव पर दिया।',
            verifiedBuyer: true
          },
          {
            userName: 'अमित कुमार',
            rating: 4.5,
            comment: 'गाड़ी में लोड कराकर तुरंत भेजा। भरोसेमंद किसान हैं।',
            verifiedBuyer: true
          }
        ]
      },
      {
        user: adminFarmer._id,
        title: '7 HP पावर वीडर व मिनी रोटावेटर (Heavy Duty Power Weeder)',
        category: 'Tools & Equipment',
        description: 'कम इस्तेमाल किया गया 7 एचपी पेट्रोल इंजन पावर वीडर। गन्ने, मक्के, सब्जियों और बागवानी में खरपतवार हटाने व जुताई के लिए आदर्श। 32 ब्लेड सेट व रिजर साथ में।',
        price: 33500,
        unit: 'piece',
        quantity: 1,
        location: 'करनाल, हरियाणा (Karnal, HR)',
        contactPhone: '9812044556',
        whatsappNumber: '9812044556',
        imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=700&auto=format&fit=crop&q=80',
        sellerName: 'गुरप्रीत सिंह (Gurpreet Singh)',
        sellerExperience: 'किसान व कृषि यंत्र सहयोगी करनाल',
        isVerifiedSeller: true,
        averageRating: 4.9,
        reviewCount: 1,
        reviews: [
          {
            userName: 'बलविंदर मान',
            rating: 5,
            comment: 'मशीन चालू हालत में मिली। मौके पर चलाकर दिखाई। बहुत उपयोगी साधन है।',
            verifiedBuyer: true
          }
        ]
      }
    ];

    await Listing.insertMany(starterListings);
    console.log('[Marketplace] Seeded 5 initial verified farmer listings with reviews.');
  } catch (err) {
    console.warn('[Marketplace] Seed notice:', err.message);
  }
};

// @desc Get all Kheti farmer listings (stored in MongoDB)
// @route GET /api/marketplace/listings
const getFarmerListings = async (req, res, next) => {
  try {
    // Check if seeding is needed
    await seedInitialListingsIfEmpty();

    const { q, category, location, minPrice, maxPrice } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { sellerName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
      .populate('user', 'name state district email')
      .sort({ createdAt: -1 });

    res.json({
      total: listings.length,
      listings
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single listing with reviews & seller details
// @route GET /api/marketplace/listings/:id
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('user', 'name state district email');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    res.json(listing);
  } catch (error) {
    next(error);
  }
};

// @desc Add a review & rating to a listing
// @route POST /api/marketplace/listings/:id/reviews
const addListingReview = async (req, res, next) => {
  try {
    const { rating, comment, userName } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const reviewerName = (userName || (req.user ? req.user.name : 'साथी किसान')).trim();

    const newReview = {
      user: req.user ? req.user._id : undefined,
      userName: reviewerName,
      rating: Number(rating),
      comment: (comment || '').trim(),
      verifiedBuyer: true,
      createdAt: new Date()
    };

    listing.reviews.unshift(newReview);

    // Calculate new average rating
    const totalScore = listing.reviews.reduce((acc, item) => acc + item.rating, 0);
    listing.averageRating = Number((totalScore / listing.reviews.length).toFixed(1));
    listing.reviewCount = listing.reviews.length;

    await listing.save();

    const populated = await Listing.findById(listing._id).populate('user', 'name state district email');

    res.status(201).json({
      message: 'Review posted successfully.',
      listing: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current user's listings
// @route GET /api/marketplace/my-listings
const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// @desc Create a new farmer listing
// @route POST /api/marketplace/listings
const createListing = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      price,
      unit,
      quantity,
      location,
      contactPhone,
      whatsappNumber,
      imageUrl,
      sellerName,
      sellerExperience
    } = req.body;

    if (!title || !category || price === undefined || !unit || !location || !contactPhone) {
      return res.status(400).json({
        message: 'Title, category, price, unit, location, and contact phone are required.'
      });
    }

    const cleanContact = contactPhone.trim();
    const cleanWhatsapp = (whatsappNumber || cleanContact).trim();

    const listing = await Listing.create({
      user: req.user._id,
      title: title.trim(),
      category: category.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      unit: unit.trim(),
      quantity: Number(quantity) || 1,
      location: location.trim(),
      contactPhone: cleanContact,
      whatsappNumber: cleanWhatsapp,
      imageUrl: imageUrl ? imageUrl.trim() : '',
      sellerName: (sellerName || req.user.name).trim(),
      sellerExperience: (sellerExperience || 'प्रमाणित किसान (Verified Member)').trim(),
      isVerifiedSeller: true,
      averageRating: 5.0,
      reviewCount: 0,
      reviews: []
    });

    const populated = await Listing.findById(listing._id).populate('user', 'name state district');

    res.status(201).json({
      message: 'Listing posted successfully.',
      listing: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update existing farmer listing
// @route PUT /api/marketplace/listings/:id
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Must be listing owner
    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this listing.' });
    }

    const {
      title,
      category,
      description,
      price,
      unit,
      quantity,
      location,
      contactPhone,
      whatsappNumber,
      imageUrl,
      sellerName,
      sellerExperience
    } = req.body;

    if (title !== undefined) listing.title = title.trim();
    if (category !== undefined) listing.category = category.trim();
    if (description !== undefined) listing.description = description.trim();
    if (price !== undefined) listing.price = Number(price);
    if (unit !== undefined) listing.unit = unit.trim();
    if (quantity !== undefined) listing.quantity = Number(quantity);
    if (location !== undefined) listing.location = location.trim();
    if (contactPhone !== undefined) listing.contactPhone = contactPhone.trim();
    if (whatsappNumber !== undefined) listing.whatsappNumber = whatsappNumber.trim();
    if (imageUrl !== undefined) listing.imageUrl = imageUrl.trim();
    if (sellerName !== undefined) listing.sellerName = sellerName.trim();
    if (sellerExperience !== undefined) listing.sellerExperience = sellerExperience.trim();

    await listing.save();

    const populated = await Listing.findById(listing._id).populate('user', 'name state district');

    res.json({
      message: 'Listing updated successfully.',
      listing: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete farmer listing
// @route DELETE /api/marketplace/listings/:id
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this listing.' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc Get live external marketplace listings (Never saved to MongoDB)
// @route GET /api/marketplace/external
const getExternalListings = async (req, res, next) => {
  try {
    const { q, category, limit } = req.query;
    const result = await fetchExternalMarketplaceListings({ q, category, limit });
    res.json(result);
  } catch (error) {
    res.status(502).json({
      configured: false,
      message: error.message || 'Unable to fetch external listings.',
      listings: []
    });
  }
};

module.exports = {
  getFarmerListings,
  getListingById,
  addListingReview,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getExternalListings
};
