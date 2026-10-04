const { fetchLiveMarketPrices } = require('../services/marketService');

// Curated list of major agricultural states and commodities in India for easy UI filtering
const DEFAULT_STATES = [
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Rajasthan',
  'Maharashtra',
  'Gujarat',
  'Bihar',
  'West Bengal',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Odisha',
  'Uttarakhand',
  'Himachal Pradesh'
];

const DEFAULT_COMMODITIES = [
  'Wheat',
  'Paddy(Dhan)(Common)',
  'Paddy(Dhan)(Basmati)',
  'Mustard',
  'Potato',
  'Onion',
  'Tomato',
  'Maize',
  'Soyabean',
  'Gram',
  'Cotton',
  'Sugarcane',
  'Barley (Jau)',
  'Arhar (Tur/Red Gram)(Dal)',
  'Moong(Green Gram)',
  'Bajra(Pearl Millet/Cumbu)',
  'Groundnut'
];

// @desc Get live mandi prices from external API
// @route GET /api/market
const getMarketPrices = async (req, res, next) => {
  try {
    const { state, district, market, commodity, limit } = req.query;

    const data = await fetchLiveMarketPrices({
      state,
      district,
      market,
      commodity,
      limit
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({
      message: error.message || 'Unable to retrieve live market data at this time.',
      records: [],
      error: true
    });
  }
};

// @desc Get suggested filters for state and commodity
// @route GET /api/market/filters
const getMarketFilters = async (req, res, next) => {
  try {
    res.json({
      states: DEFAULT_STATES,
      commodities: DEFAULT_COMMODITIES
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarketPrices,
  getMarketFilters
};
