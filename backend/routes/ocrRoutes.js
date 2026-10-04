const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { processDocumentOcr, getOcrHistory } = require('../controllers/ocrController');

// Optional auth middleware so public / demo users can also try OCR, but logged-in users have scan history saved!
const optionalAuth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'kheti_default_secret_key';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Ignore token failure for optional auth
    }
  }
  next();
};

router.post('/', optionalAuth, upload.single('document'), processDocumentOcr);
router.get('/history', auth, getOcrHistory);

module.exports = router;
