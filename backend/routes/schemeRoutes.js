const express = require('express');
const router = express.Router();
const { getSchemes, getSchemeById, askSchemeAI } = require('../controllers/schemeController');

router.get('/', getSchemes);
router.post('/ask-ai', askSchemeAI);
router.get('/:id', getSchemeById);

module.exports = router;
