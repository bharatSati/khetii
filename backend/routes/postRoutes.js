const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  sharePost,
  deletePost
} = require('../controllers/postController');

// Optional auth middleware
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'kheti_default_secret_key';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // ignore expired / invalid token in optional auth
    }
  }
  next();
};

// Route definitions
router.get('/', optionalAuth, getPosts);
router.post('/', auth, upload.single('image'), createPost);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.post('/:id/share', sharePost);
router.delete('/:id', auth, deletePost);

module.exports = router;
