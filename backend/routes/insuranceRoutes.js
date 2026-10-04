const express = require('express');
const router = express.Router();
const { getInsuranceGuide } = require('../controllers/insuranceController');

router.get('/', getInsuranceGuide);

module.exports = router;
