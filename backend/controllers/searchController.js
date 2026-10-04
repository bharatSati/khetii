const path = require('path');
const fs = require('fs');
const Listing = require('../models/Listing');

const schemesFilePath = path.join(__dirname, '..', 'data', 'schemes.json');
const knowledgeFilePath = path.join(__dirname, '..', 'data', 'knowledge.json');

// @desc Global search across schemes, knowledge and farmer listings
// @route GET /api/search?q=
const globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();

    if (!q) {
      return res.json({
        query: '',
        schemes: [],
        knowledge: [],
        listings: []
      });
    }

    // 1. Search schemes
    let schemes = [];
    try {
      const rawSchemes = JSON.parse(fs.readFileSync(schemesFilePath, 'utf-8'));
      schemes = rawSchemes.filter((s) => {
        return (
          s.name.en.toLowerCase().includes(q) ||
          s.name.hi.toLowerCase().includes(q) ||
          (s.shortDescription?.en || '').toLowerCase().includes(q) ||
          (s.shortDescription?.hi || '').toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      }).slice(0, 5);
    } catch (e) {
      console.error('Error searching schemes:', e);
    }

    // 2. Search knowledge
    let knowledge = [];
    try {
      const rawKnowledge = JSON.parse(fs.readFileSync(knowledgeFilePath, 'utf-8'));
      knowledge = rawKnowledge.filter((k) => {
        return (
          k.title.en.toLowerCase().includes(q) ||
          k.title.hi.toLowerCase().includes(q) ||
          (k.summary?.en || '').toLowerCase().includes(q) ||
          (k.summary?.hi || '').toLowerCase().includes(q) ||
          k.category.toLowerCase().includes(q) ||
          (k.season || '').toLowerCase().includes(q)
        );
      }).slice(0, 5);
    } catch (e) {
      console.error('Error searching knowledge:', e);
    }

    // 3. Search farmer listings in MongoDB
    let listings = [];
    try {
      listings = await Listing.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } }
        ]
      })
        .populate('user', 'name')
        .limit(5);
    } catch (e) {
      console.error('Error searching listings:', e);
    }

    res.json({
      query: q,
      totalResults: schemes.length + knowledge.length + listings.length,
      schemes,
      knowledge,
      listings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch
};
