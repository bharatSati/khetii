const axios = require('axios');
const https = require('https');
const dns = require('dns');

// Enforce IPv4 DNS resolution across Node to prevent ENETUNREACH on systems with unrouted IPv6 / DNS64
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Reusable IPv4-enforced HTTPS agent to strictly prevent ENETUNREACH
const httpsAgent = new https.Agent({
  family: 4,
  keepAlive: true,
  timeout: 6000
});

// In-memory per-request cache for 2 minutes to prevent API rate limiting
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

const getCacheKey = (params) => {
  return JSON.stringify(params);
};

// Map common shorthand/lowercase user inputs to official Agmarknet commodity names
const COMMODITY_ALIASES = {
  paddy: 'Paddy(Dhan)(Common)',
  dhan: 'Paddy(Dhan)(Common)',
  wheat: 'Wheat',
  gehun: 'Wheat',
  mustard: 'Mustard',
  sarson: 'Mustard',
  potato: 'Potato',
  aloo: 'Potato',
  onion: 'Onion',
  pyaz: 'Onion',
  tomato: 'Tomato',
  tamatar: 'Tomato',
  maize: 'Maize',
  makka: 'Maize',
  soyabean: 'Soyabean',
  gram: 'Gram',
  chana: 'Gram',
  cotton: 'Cotton',
  kapas: 'Cotton',
  sugarcane: 'Sugarcane',
  ganna: 'Sugarcane',
  bajra: 'Bajra(Pearl Millet/Cumbu)'
};

// Curated authentic dummy/sample mandi records matching Agmarknet standards
// Provides immediate realistic visual UI preview when official NIC server is unreachable
const DUMMY_MARKET_DATA = [
  // Uttar Pradesh - Agra District
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2180, maxPrice: 2350, modalPrice: 2260 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Achhnera', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2160, maxPrice: 2320, modalPrice: 2240 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Fatehabad', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2150, maxPrice: 2300, modalPrice: 2225 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Shamsabad', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2170, maxPrice: 2340, modalPrice: 2250 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Paddy(Dhan)(Basmati)', variety: 'Basmati', grade: 'FAQ', minPrice: 3450, maxPrice: 3950, modalPrice: 3700 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2380, maxPrice: 2540, modalPrice: 2460 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Achhnera', commodity: 'Wheat', variety: 'Deshi', grade: 'FAQ', minPrice: 2360, maxPrice: 2500, modalPrice: 2420 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Fatehabad', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2350, maxPrice: 2490, modalPrice: 2410 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Mustard', variety: 'Mustard', grade: 'FAQ', minPrice: 5400, maxPrice: 5850, modalPrice: 5620 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Achhnera', commodity: 'Mustard', variety: 'Black', grade: 'FAQ', minPrice: 5350, maxPrice: 5780, modalPrice: 5550 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Potato', variety: 'Desi', grade: 'FAQ', minPrice: 1250, maxPrice: 1550, modalPrice: 1400 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Shamsabad', commodity: 'Potato', variety: 'Badshah', grade: 'FAQ', minPrice: 1280, maxPrice: 1580, modalPrice: 1430 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Fatehabad', commodity: 'Potato', variety: 'Chipsona', grade: 'FAQ', minPrice: 1300, maxPrice: 1600, modalPrice: 1450 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Bajra(Pearl Millet/Cumbu)', variety: 'Deshi', grade: 'FAQ', minPrice: 2180, maxPrice: 2460, modalPrice: 2320 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Achhnera', commodity: 'Bajra(Pearl Millet/Cumbu)', variety: 'Hybrid', grade: 'FAQ', minPrice: 2150, maxPrice: 2420, modalPrice: 2280 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Onion', variety: 'Red', grade: 'FAQ', minPrice: 1800, maxPrice: 2400, modalPrice: 2100 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', commodity: 'Tomato', variety: 'Hybrid', grade: 'FAQ', minPrice: 1600, maxPrice: 2300, modalPrice: 1950 },

  // Uttar Pradesh - Other Major Districts
  { state: 'Uttar Pradesh', district: 'Aligarh', market: 'Aligarh', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2370, maxPrice: 2510, modalPrice: 2430 },
  { state: 'Uttar Pradesh', district: 'Aligarh', market: 'Aligarh', commodity: 'Mustard', variety: 'Mustard', grade: 'FAQ', minPrice: 5400, maxPrice: 5820, modalPrice: 5610 },
  { state: 'Uttar Pradesh', district: 'Mathura', market: 'Mathura', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2170, maxPrice: 2330, modalPrice: 2240 },
  { state: 'Uttar Pradesh', district: 'Mathura', market: 'Mathura', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2360, maxPrice: 2500, modalPrice: 2425 },
  { state: 'Uttar Pradesh', district: 'Meerut', market: 'Meerut', commodity: 'Sugarcane', variety: 'Co-0238', grade: 'FAQ', minPrice: 370, maxPrice: 410, modalPrice: 390 },
  { state: 'Uttar Pradesh', district: 'Meerut', market: 'Meerut', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2390, maxPrice: 2560, modalPrice: 2470 },
  { state: 'Uttar Pradesh', district: 'Kanpur', market: 'Kanpur', commodity: 'Paddy(Dhan)(Common)', variety: 'Common', grade: 'FAQ', minPrice: 2190, maxPrice: 2360, modalPrice: 2270 },
  { state: 'Uttar Pradesh', district: 'Kanpur', market: 'Kanpur', commodity: 'Gram', variety: 'Desi', grade: 'FAQ', minPrice: 5800, maxPrice: 6350, modalPrice: 6100 },
  { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', minPrice: 2400, maxPrice: 2580, modalPrice: 2490 },
  { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow', commodity: 'Potato', variety: 'Desi', grade: 'FAQ', minPrice: 1200, maxPrice: 1500, modalPrice: 1350 },
  { state: 'Uttar Pradesh', district: 'Varanasi', market: 'Varanasi', commodity: 'Tomato', variety: 'Deshi', grade: 'FAQ', minPrice: 1700, maxPrice: 2400, modalPrice: 2050 },

  // Madhya Pradesh
  { state: 'Madhya Pradesh', district: 'Indore', market: 'Indore', commodity: 'Soyabean', variety: 'Yellow', grade: 'FAQ', minPrice: 4350, maxPrice: 4850, modalPrice: 4620 },
  { state: 'Madhya Pradesh', district: 'Indore', market: 'Indore', commodity: 'Wheat', variety: 'Lokwan', grade: 'FAQ', minPrice: 2550, maxPrice: 2900, modalPrice: 2720 },
  { state: 'Madhya Pradesh', district: 'Ujjain', market: 'Ujjain', commodity: 'Soyabean', variety: 'Yellow', grade: 'FAQ', minPrice: 4320, maxPrice: 4800, modalPrice: 4590 },
  { state: 'Madhya Pradesh', district: 'Ujjain', market: 'Ujjain', commodity: 'Gram', variety: 'Desi', grade: 'FAQ', minPrice: 5750, maxPrice: 6250, modalPrice: 6020 },
  { state: 'Madhya Pradesh', district: 'Bhopal', market: 'Bhopal', commodity: 'Wheat', variety: 'Sharbati', grade: 'FAQ', minPrice: 2800, maxPrice: 3400, modalPrice: 3100 },

  // Punjab
  { state: 'Punjab', district: 'Ludhiana', market: 'Ludhiana', commodity: 'Paddy(Dhan)(Common)', variety: 'PR-126', grade: 'FAQ', minPrice: 2203, maxPrice: 2340, modalPrice: 2280 },
  { state: 'Punjab', district: 'Ludhiana', market: 'Ludhiana', commodity: 'Wheat', variety: 'HD-3086', grade: 'FAQ', minPrice: 2375, maxPrice: 2520, modalPrice: 2450 },
  { state: 'Punjab', district: 'Amritsar', market: 'Amritsar', commodity: 'Paddy(Dhan)(Basmati)', variety: '1121', grade: 'FAQ', minPrice: 3600, maxPrice: 4200, modalPrice: 3950 },
  { state: 'Punjab', district: 'Patiala', market: 'Patiala', commodity: 'Wheat', variety: 'PBW-725', grade: 'FAQ', minPrice: 2360, maxPrice: 2500, modalPrice: 2430 },

  // Haryana
  { state: 'Haryana', district: 'Karnal', market: 'Karnal', commodity: 'Paddy(Dhan)(Basmati)', variety: '1509', grade: 'FAQ', minPrice: 3500, maxPrice: 4050, modalPrice: 3820 },
  { state: 'Haryana', district: 'Karnal', market: 'Karnal', commodity: 'Wheat', variety: 'DBW-187', grade: 'FAQ', minPrice: 2380, maxPrice: 2540, modalPrice: 2460 },
  { state: 'Haryana', district: 'Hisar', market: 'Hisar', commodity: 'Cotton', variety: 'Bt Cotton', grade: 'FAQ', minPrice: 6800, maxPrice: 7450, modalPrice: 7120 },
  { state: 'Haryana', district: 'Sirsa', market: 'Sirsa', commodity: 'Mustard', variety: 'Mustard', grade: 'FAQ', minPrice: 5350, maxPrice: 5790, modalPrice: 5560 },

  // Rajasthan
  { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur', commodity: 'Mustard', variety: 'Mustard', grade: 'FAQ', minPrice: 5420, maxPrice: 5880, modalPrice: 5650 },
  { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur', commodity: 'Bajra(Pearl Millet/Cumbu)', variety: 'Deshi', grade: 'FAQ', minPrice: 2200, maxPrice: 2500, modalPrice: 2340 },
  { state: 'Rajasthan', district: 'Kota', market: 'Kota', commodity: 'Soyabean', variety: 'Yellow', grade: 'FAQ', minPrice: 4300, maxPrice: 4780, modalPrice: 4560 },
  { state: 'Rajasthan', district: 'Sri Ganganagar', market: 'Sri Ganganagar', commodity: 'Cotton', variety: 'Medium', grade: 'FAQ', minPrice: 6750, maxPrice: 7380, modalPrice: 7080 },

  // Maharashtra
  { state: 'Maharashtra', district: 'Nashik', market: 'Lasalgaon', commodity: 'Onion', variety: 'Red', grade: 'FAQ', minPrice: 1750, maxPrice: 2600, modalPrice: 2250 },
  { state: 'Maharashtra', district: 'Nashik', market: 'Pimpalgaon', commodity: 'Tomato', variety: 'Hybrid', grade: 'FAQ', minPrice: 1550, maxPrice: 2350, modalPrice: 1980 },
  { state: 'Maharashtra', district: 'Nagpur', market: 'Nagpur', commodity: 'Soyabean', variety: 'Yellow', grade: 'FAQ', minPrice: 4350, maxPrice: 4820, modalPrice: 4610 }
];

// Helper to filter or dynamically generate dummy records for the requested parameters
const getDummyRecords = ({ state, district, market, commodity, limit = 50 }) => {
  const targetDate = new Date().toISOString().split('T')[0];
  const normState = (state || '').trim().toLowerCase();
  const normDistrict = (district || '').trim().toLowerCase();
  const normMarket = (market || '').trim().toLowerCase();
  const normCommodity = (commodity || '').trim().toLowerCase();

  let filtered = DUMMY_MARKET_DATA.filter((item) => {
    if (normState && !item.state.toLowerCase().includes(normState)) return false;
    if (normDistrict && !item.district.toLowerCase().includes(normDistrict)) return false;
    if (normMarket && !item.market.toLowerCase().includes(normMarket)) return false;
    if (normCommodity && normCommodity !== 'all') {
      const itemComm = item.commodity.toLowerCase();
      if (!itemComm.includes(normCommodity) && !normCommodity.includes(itemComm.split('(')[0].trim().toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // If no preset match found, generate realistic synthetic records for the requested parameters
  if (filtered.length === 0) {
    const displayState = state || 'Uttar Pradesh';
    const displayDistrict = district || 'Agra';
    const displayCommodity = commodity && commodity !== 'All' ? commodity : 'Paddy(Dhan)(Common)';
    const markets = [
      market || `${displayDistrict} Mandi`,
      `${displayDistrict} Grain Market`,
      `Kisan Mandi (${displayDistrict})`
    ];

    filtered = markets.map((mkt, idx) => {
      let baseModal = 2300;
      const lowerComm = displayCommodity.toLowerCase();
      if (lowerComm.includes('wheat') || lowerComm.includes('gehun')) baseModal = 2460;
      else if (lowerComm.includes('mustard') || lowerComm.includes('sarson')) baseModal = 5620;
      else if (lowerComm.includes('potato') || lowerComm.includes('aloo')) baseModal = 1420;
      else if (lowerComm.includes('onion') || lowerComm.includes('pyaz')) baseModal = 2150;
      else if (lowerComm.includes('cotton') || lowerComm.includes('kapas')) baseModal = 7120;
      else if (lowerComm.includes('soyabean')) baseModal = 4620;
      else if (lowerComm.includes('basmati')) baseModal = 3720;
      else if (lowerComm.includes('tomato')) baseModal = 1980;
      else if (lowerComm.includes('gram') || lowerComm.includes('chana')) baseModal = 6050;
      else if (lowerComm.includes('bajra')) baseModal = 2320;

      const variance = (idx - 1) * 35;
      const modal = baseModal + variance;
      return {
        state: displayState,
        district: displayDistrict,
        market: mkt,
        commodity: displayCommodity,
        variety: 'Standard',
        grade: 'FAQ',
        minPrice: Math.round(modal * 0.94),
        maxPrice: Math.round(modal * 1.06),
        modalPrice: modal
      };
    });
  }

  const maxItems = Math.min(parseInt(limit, 10) || 50, 100);
  return filtered.slice(0, maxItems).map((item, index) => ({
    id: `mandi-${index}-${item.market.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    state: item.state,
    district: item.district,
    market: item.market,
    commodity: item.commodity,
    variety: item.variety || 'Standard',
    grade: item.grade || 'FAQ',
    arrivalDate: targetDate,
    minPrice: item.minPrice,
    maxPrice: item.maxPrice,
    modalPrice: item.modalPrice
  }));
};

/**
 * Fetch mandi prices.
 * Attempts live fetch from Agmarknet API via data.gov.in over IPv4.
 * When official NIC server is offline/under maintenance, serves dummy/preview records
 * so the farmer/user can immediately see the rich UI layout, comparisons, and charts.
 */
const fetchLiveMarketPrices = async ({ state, district, market, commodity, limit = 50 }) => {
  const apiKey = process.env.MARKET_API_KEY;
  const apiUrl = process.env.MARKET_API_URL || 'https://api.data.gov.in/resource';
  const resourceId = process.env.MARKET_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';

  const cacheKey = getCacheKey({ state, district, market, commodity, limit, resourceId });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = {
    'api-key': apiKey || '579b464db66ec23bdd00000179c080f8994c4b68708555b3ac207264',
    format: 'json',
    limit: Math.min(parseInt(limit, 10) || 50, 200)
  };

  // Resolve commodity alias if shorthand passed (e.g., 'paddy' -> 'Paddy(Dhan)(Common)')
  let targetCommodity = commodity;
  if (targetCommodity && targetCommodity !== 'All') {
    const lower = targetCommodity.trim().toLowerCase();
    if (COMMODITY_ALIASES[lower]) {
      targetCommodity = COMMODITY_ALIASES[lower];
    }
  }

  // data.gov.in supports filters[field_name]
  if (state) params['filters[state]'] = state;
  if (district) params['filters[district]'] = district;
  if (market) params['filters[market]'] = market;
  if (targetCommodity && targetCommodity !== 'All') params['filters[commodity]'] = targetCommodity;

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
        'api-key': params['api-key']
      },
      httpsAgent,
      timeout: 6000
    });

    const records = response.data?.records || [];

    if (records.length > 0) {
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
        isSample: false,
        total: response.data?.total || normalised.length,
        records: normalised
      };

      cache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }
  } catch (error) {
    console.warn(`[MarketService] Live Government API offline (${error.code || error.message}). Serving sample preview mandi data.`);
  }

  // Gracefully serve dummy/sample records for UI preview
  const dummyRecords = getDummyRecords({ state, district, market, commodity: targetCommodity || commodity, limit });

  const result = {
    source: 'data.gov.in / Agmarknet (UI Preview / नमूना भाव)',
    updatedAt: new Date().toISOString(),
    isLive: false,
    isSample: true,
    total: dummyRecords.length,
    records: dummyRecords
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
};

module.exports = {
  fetchLiveMarketPrices
};
