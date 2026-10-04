const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getWeather } = require('../controllers/weatherController');

// Optional auth: attaches req.user if token exists, otherwise proceeds with default coords
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'kheti_default_secret_key';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // proceed without user
    }
  }
  next();
};

router.get('/', optionalAuth, getWeather);

module.exports = router;
