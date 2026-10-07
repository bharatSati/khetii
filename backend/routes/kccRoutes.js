const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { searchAdvisories, getMetadata, getPopular } = require('../controllers/kccController');

// Optional auth: attaches req.user if token exists, otherwise proceeds as guest
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

router.get('/search', optionalAuth, searchAdvisories);
router.post('/search', optionalAuth, searchAdvisories);
router.get('/metadata', getMetadata);
router.get('/popular', getPopular);

module.exports = router;
