const express = require('express');
const router = express.Router();
const { getMarketPrices, getMarketFilters } = require('../controllers/marketController');

router.get('/', getMarketPrices);
router.get('/filters', getMarketFilters);

module.exports = router;
