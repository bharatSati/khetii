const Listing = require('../models/Listing');
const { fetchExternalMarketplaceListings } = require('../services/marketplaceService');

// @desc Get all Kheti farmer listings (stored in MongoDB)
// @route GET /api/marketplace/listings
const getFarmerListings = async (req, res, next) => {
  try {
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
        { category: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
      .populate('user', 'name state district')
      .sort({ createdAt: -1 });

    res.json({
      total: listings.length,
      listings
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
    const { title, category, description, price, unit, quantity, location, contactPhone, imageUrl } = req.body;

    if (!title || !category || price === undefined || !unit || !location || !contactPhone) {
      return res.status(400).json({
        message: 'Title, category, price, unit, location, and contact phone are required.'
      });
    }

    const listing = await Listing.create({
      user: req.user._id,
      title: title.trim(),
      category: category.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      unit: unit.trim(),
      quantity: Number(quantity) || 1,
      location: location.trim(),
      contactPhone: contactPhone.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : ''
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

    const { title, category, description, price, unit, quantity, location, contactPhone, imageUrl } = req.body;

    if (title !== undefined) listing.title = title.trim();
    if (category !== undefined) listing.category = category.trim();
    if (description !== undefined) listing.description = description.trim();
    if (price !== undefined) listing.price = Number(price);
    if (unit !== undefined) listing.unit = unit.trim();
    if (quantity !== undefined) listing.quantity = Number(quantity);
    if (location !== undefined) listing.location = location.trim();
    if (contactPhone !== undefined) listing.contactPhone = contactPhone.trim();
    if (imageUrl !== undefined) listing.imageUrl = imageUrl.trim();

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
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getExternalListings
};
