const express = require('express');
const router = express.Router();
const {
  getKnowledgeArticles,
  getKnowledgeArticleById
} = require('../controllers/knowledgeController');

router.get('/', getKnowledgeArticles);
router.get('/:id', getKnowledgeArticleById);

module.exports = router;
