const axios = require('axios');

// In-memory per-request cache for 2 minutes to prevent API rate limiting
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

const getCacheKey = (params) => {
  return JSON.stringify(params);
};

/**
 * Fetch live mandi prices strictly from Agmarknet API via data.gov.in
 * Never stores or persists external market data in any database or file.
 * Normalises fields into:
 * state, district, market, commodity, variety, arrivalDate, minPrice, maxPrice, modalPrice
 */
const fetchLiveMarketPrices = async ({ state, district, market, commodity, limit = 50 }) => {
  const apiKey = process.env.MARKET_API_KEY;
  const apiUrl = process.env.MARKET_API_URL || 'https://api.data.gov.in/resource';
  const resourceId = process.env.MARKET_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';

  if (!apiKey) {
    throw new Error('MARKET_API_KEY is not configured on the server. Please check your environment settings.');
  }

  const cacheKey = getCacheKey({ state, district, market, commodity, limit, resourceId });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = {
    'api-key': apiKey,
    format: 'json',
    limit: Math.min(parseInt(limit, 10) || 50, 200)
  };

  // data.gov.in supports filters[field_name]
  if (state) params['filters[state]'] = state;
  if (district) params['filters[district]'] = district;
  if (market) params['filters[market]'] = market;
  if (commodity && commodity !== 'All') params['filters[commodity]'] = commodity;

  const cleanApiUrl = apiUrl.trim().replace(/\/$/, '');
  const requestUrl = cleanApiUrl.includes(resourceId)
    ? cleanApiUrl
    : `${cleanApiUrl}/${resourceId}`;

  const serializeParams = (p) => {
    const parts = [];
    for (const [key, value] of Object.entries(p)) {
      if (value !== undefined && value !== null && value !== '') {
        parts.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    return parts.join('&');
  };

  const fullOutgoingUrl = `${requestUrl}?${serializeParams(params)}`;
  console.log(`[MarketService] Outgoing Government Request URL -> ${fullOutgoingUrl}`);

  try {
    const response = await axios.get(requestUrl, {
      params,
      paramsSerializer: serializeParams,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'api-key': apiKey
      },
      timeout: 10000
    });

    const records = response.data?.records || [];

    const normalised = records.map((item, index) => {
      return {
        id: item._id || item.id || `market-${index}-${Date.now()}`,
        state: item.state || item.State || '',
        district: item.district || item.District || '',
        market: item.market || item.Market || '',
        commodity: item.commodity || item.Commodity || '',
        variety: item.variety || item.Variety || 'Standard',
        grade: item.grade || item.Grade || 'FAQ',
        arrivalDate: item.arrival_date || item.arrivalDate || item.Arrival_Date || new Date().toISOString().split('T')[0],
        minPrice: parseFloat(item.min_price || item.minPrice || item.Min_Price || 0),
        maxPrice: parseFloat(item.max_price || item.maxPrice || item.Max_Price || 0),
        modalPrice: parseFloat(item.modal_price || item.modalPrice || item.Modal_Price || 0)
      };
    });

    const result = {
      source: 'data.gov.in / Agmarknet (Ministry of Agriculture & Farmers Welfare)',
      updatedAt: new Date().toISOString(),
      isLive: true,
      total: response.data?.total || normalised.length,
      records: normalised
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error(`[MarketService Error] Failed to fetch from Government URL (${fullOutgoingUrl}):`, error.code || error.message);
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'))) {
      throw new Error('सरकारी एगमार्कनेट पोर्टल (api.data.gov.in) का सर्वर वर्तमान में एनआईसी (NIC) द्वारा रखरखाव या अस्थायी रूप से अनुपलब्ध है (Connection Refused)। The Government Agmarknet API server is currently undergoing maintenance or temporarily offline. कृपया कुछ समय बाद पुनः प्रयास करें।');
    }
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout')) || error.code === 'ETIMEDOUT') {
      throw new Error('सरकारी एगमार्कनेट पोर्टल (data.gov.in) से संपर्क का समय समाप्त (Timeout) हो गया। सर्वर धीमा या व्यस्त है। The Government Agmarknet API request timed out. Please try again in a few moments.');
    }
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      throw new Error('सरकारी एगमार्कनेट पोर्टल (api.data.gov.in) का नेटवर्क पता नहीं मिल सका। The Government Agmarknet domain could not be reached.');
    }
    if (error.response) {
      if (error.response.status === 500 || error.response.status === 502 || error.response.status === 503) {
        throw new Error('सरकारी एगमार्कनेट पोर्टल (data.gov.in) वर्तमान में तकनीकी समस्या के कारण अनुपलब्ध है। The Government Agmarknet API is currently unavailable due to upstream server issues.');
      }
      if (error.response.status === 403 || error.response.status === 401) {
        throw new Error('data.gov.in के लिए अमान्य या अनधिकृत API कुंजी। Invalid or unauthorized MARKET_API_KEY for data.gov.in.');
      }
      if (error.response.status === 429) {
        throw new Error('सरकारी पोर्टल की अनुरोध सीमा (Rate Limit) समाप्त हो गई है। कृपया थोड़ी देर बाद प्रयास करें। Government Agmarknet API rate limit exceeded.');
      }
    }
    throw new Error(`लाइव मंडी भाव प्राप्त नहीं हो सके (data.gov.in): ${error.message}`);
  }
};

module.exports = {
  fetchLiveMarketPrices
};
