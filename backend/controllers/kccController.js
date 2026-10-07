const {
  searchKCC,
  summarizeKccAdvisories,
  getKCCMetadata,
  getPopularAdvisories
} = require('../services/kccService');

/**
 * @desc Search Kisan Call Centre (KCC) advisories with ranking and optional AI summary
 * @route GET /api/kcc/search or POST /api/kcc/search
 */
const searchAdvisories = async (req, res, next) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;

    const query = (params.query || '').trim();
    const crop = (params.crop || '').trim();
    const category = (params.category || '').trim();
    const state = (params.state || '').trim();
    const limit = Math.min(20, Math.max(1, parseInt(params.limit, 10) || 6));
    const aiExplain = params.aiExplain !== false && params.aiExplain !== 'false';
    const lang = (params.lang || req.user?.language || 'hi').startsWith('hi') ? 'hi' : 'en';

    // Search KCC dataset
    const searchResult = await searchKCC({
      query,
      crop,
      category,
      state,
      limit
    });

    // Generate AI interpretation / summary if requested and results exist
    let aiSummary = null;
    if (aiExplain && searchResult.results && searchResult.results.length > 0) {
      aiSummary = await summarizeKccAdvisories({
        query: query || `${searchResult.detectedCrop} ${searchResult.detectedCategory}`,
        results: searchResult.results,
        lang
      });
    }

    res.json({
      success: true,
      query: searchResult.query,
      detectedCrop: searchResult.detectedCrop,
      detectedCategory: searchResult.detectedCategory,
      totalMatches: searchResult.totalMatches,
      results: searchResult.results,
      aiSummary,
      message: searchResult.message,
      filters: {
        crop: crop || 'All',
        category: category || 'All',
        state: state || 'All'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get KCC metadata (supported crops, categories, record count)
 * @route GET /api/kcc/metadata
 */
const getMetadata = async (req, res, next) => {
  try {
    const metadata = await getKCCMetadata();
    res.json({
      success: true,
      ...metadata
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get popular sample KCC advisories
 * @route GET /api/kcc/popular
 */
const getPopular = async (req, res, next) => {
  try {
    const popular = await getPopularAdvisories();
    res.json({
      success: true,
      advisories: popular
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAdvisories,
  getMetadata,
  getPopular
};
