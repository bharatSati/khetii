const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const {
  getFarmerListings,
  getListingById,
  addListingReview,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getExternalListings
} = require('../controllers/marketplaceController');

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'kheti_default_secret_key';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // ignore error for optional auth
    }
  }
  next();
};

// Farmer Listings (Kheti-owned, stored in MongoDB)
router.get('/listings', getFarmerListings);
router.get('/listings/:id', getListingById);
router.post('/listings/:id/reviews', optionalAuth, addListingReview);
router.get('/my-listings', auth, getMyListings);
router.post('/listings', auth, createListing);
router.put('/listings/:id', auth, updateListing);
router.delete('/listings/:id', auth, deleteListing);

// External Sources (live, never stored in MongoDB)
router.get('/external', getExternalListings);

module.exports = router;
