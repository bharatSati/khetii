const path = require('path');
const fs = require('fs');

const knowledgeFilePath = path.join(__dirname, '..', 'data', 'knowledge.json');

const loadKnowledgeData = () => {
  const raw = fs.readFileSync(knowledgeFilePath, 'utf-8');
  return JSON.parse(raw);
};

// @desc Get all knowledge guides with optional category filter and search
// @route GET /api/knowledge
const getKnowledgeArticles = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let articles = loadKnowledgeData();

    if (category && category !== 'All') {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      articles = articles.filter((a) => {
        const titleEn = a.title.en.toLowerCase();
        const titleHi = a.title.hi.toLowerCase();
        const sumEn = a.summary.en.toLowerCase();
        const sumHi = a.summary.hi.toLowerCase();
        const cat = a.category.toLowerCase();
        return titleEn.includes(q) || titleHi.includes(q) || sumEn.includes(q) || sumHi.includes(q) || cat.includes(q);
      });
    }

    res.json({
      total: articles.length,
      articles
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single knowledge article by ID
// @route GET /api/knowledge/:id
const getKnowledgeArticleById = async (req, res, next) => {
  try {
    const articles = loadKnowledgeData();
    const article = articles.find((a) => a.id === req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Knowledge article not found.' });
    }

    res.json(article);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKnowledgeArticles,
  getKnowledgeArticleById
};
