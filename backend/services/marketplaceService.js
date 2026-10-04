const axios = require('axios');

/**
 * Adapter service for fetching external agricultural marketplace listings.
 * Strictly adheres to project constraints:
 * - Never fabricates fake items
 * - Returns clean status if external provider is unconfigured
 * - Never persists external listings in MongoDB
 */
const fetchExternalMarketplaceListings = async ({ q, category, limit = 20 }) => {
  const apiUrl = process.env.MARKETPLACE_API_URL;
  const apiKey = process.env.MARKETPLACE_API_KEY;

  if (!apiUrl) {
    return {
      configured: false,
      message: 'External marketplace source is not configured on the server.',
      listings: []
    };
  }

  try {
    const response = await axios.get(apiUrl, {
      params: {
        q: q || undefined,
        category: category || undefined,
        limit
      },
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      timeout: 10000
    });

    const rawListings = response.data?.listings || response.data || [];

    const normalised = Array.isArray(rawListings)
      ? rawListings.map((item, index) => ({
          id: item.id || `ext-${index}`,
          title: item.title || item.name || 'Agricultural Item',
          category: item.category || 'General',
          description: item.description || '',
          price: item.price || null,
          unit: item.unit || '',
          provider: item.provider || item.source || 'External Partner',
          sourceUrl: item.sourceUrl || item.url || item.link || '',
          location: item.location || '',
          imageUrl: item.imageUrl || item.image || ''
        }))
      : [];

    return {
      configured: true,
      listings: normalised
    };
  } catch (error) {
    throw new Error(`Failed to fetch external marketplace listings: ${error.message}`);
  }
};

module.exports = {
  fetchExternalMarketplaceListings
};
