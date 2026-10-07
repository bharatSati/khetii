const path = require('path');
const fs = require('fs');

const schemesFilePath = path.join(__dirname, '..', 'data', 'schemes.json');

const loadSchemesData = () => {
  const raw = fs.readFileSync(schemesFilePath, 'utf-8');
  return JSON.parse(raw);
};

// @desc Get all government schemes with optional search and category filters
// @route GET /api/schemes
const getSchemes = async (req, res, next) => {
  try {
    const { search, category, level } = req.query;
    let schemes = loadSchemesData();

    if (category && category !== 'All') {
      schemes = schemes.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (level && level !== 'All') {
      schemes = schemes.filter(
        (s) => s.level.toLowerCase() === level.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      schemes = schemes.filter((s) => {
        const nameEn = s.name.en.toLowerCase();
        const nameHi = s.name.hi.toLowerCase();
        const descEn = (s.shortDescription?.en || s.description?.en || '').toLowerCase();
        const descHi = (s.shortDescription?.hi || s.description?.hi || '').toLowerCase();
        const cat = s.category.toLowerCase();
        return nameEn.includes(q) || nameHi.includes(q) || descEn.includes(q) || descHi.includes(q) || cat.includes(q);
      });
    }

    res.json({
      total: schemes.length,
      schemes
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get scheme by ID
// @route GET /api/schemes/:id
const getSchemeById = async (req, res, next) => {
  try {
    const schemes = loadSchemesData();
    const scheme = schemes.find((s) => s.id === req.params.id);

    if (!scheme) {
      return res.status(404).json({ message: 'Government scheme not found.' });
    }

    res.json(scheme);
  } catch (error) {
    next(error);
  }
};

const { askSchemeGroqAI } = require('../services/groqSchemeService');

// @desc Ask Groq AI about a government scheme
// @route POST /api/schemes/ask-ai
const askSchemeAI = async (req, res, next) => {
  try {
    const { schemeId, question, lang, schemeData } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    let scheme = schemeData;
    if (!scheme && schemeId) {
      const schemes = loadSchemesData();
      scheme = schemes.find((s) => s.id === schemeId);
    }

    if (!scheme) {
      return res.status(404).json({ message: 'Government scheme not found.' });
    }

    const aiResponse = await askSchemeGroqAI({
      scheme,
      question: question.trim(),
      lang: lang || req.user?.language || 'hi'
    });

    res.json(aiResponse);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchemes,
  getSchemeById,
  askSchemeAI
};
