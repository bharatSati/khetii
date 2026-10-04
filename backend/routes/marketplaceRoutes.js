const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getFarmerListings,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getExternalListings
} = require('../controllers/marketplaceController');

// Farmer Listings (Kheti-owned, stored in MongoDB)
router.get('/listings', getFarmerListings);
router.get('/my-listings', auth, getMyListings);
router.post('/listings', auth, createListing);
router.put('/listings/:id', auth, updateListing);
router.delete('/listings/:id', auth, deleteListing);

// External Sources (live, never stored in MongoDB)
router.get('/external', getExternalListings);

module.exports = router;
