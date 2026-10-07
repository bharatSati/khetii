const { fetchWeather } = require('../services/weatherService');
const { generateStructuredAiBriefing, askAiFarmAdvisor } = require('../services/groqWeatherService');

/**
 * Helper to resolve farmer context from request query, body, and authenticated user
 */
const resolveFarmerContext = (req) => {
  const query = req.query || {};
  const body = req.body || {};
  const user = req.user || null;

  let lat = query.lat !== undefined ? query.lat : body.lat;
  let lon = query.lon !== undefined ? query.lon : body.lon;

  if ((lat === undefined || lon === undefined) && user) {
    lat = user.latitude;
    lon = user.longitude;
  }

  const latitude = lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : 28.6139;
  const longitude = lon !== undefined && !isNaN(Number(lon)) ? Number(lon) : 77.2090;

  // Crops
  let crops = [];
  if (query.crops) {
    crops = query.crops.split(',').map((c) => c.trim()).filter(Boolean);
  } else if (body.crops) {
    crops = Array.isArray(body.crops) ? body.crops : body.crops.split(',').map((c) => c.trim()).filter(Boolean);
  } else if (user?.mainCrops?.length > 0) {
    crops = user.mainCrops;
  }

  // Farm Size
  const farmSize = Number(query.landSizeAcres || body.landSizeAcres || user?.landSizeAcres || 0);

  // Location Names
  const city = query.city || body.city || user?.city || 'Delhi';
  const district = query.district || body.district || user?.district || 'New Delhi';
  const state = query.state || body.state || user?.state || 'Delhi';

  // Language
  const lang = query.lang || body.lang || user?.language || 'hi';

  return {
    latitude,
    longitude,
    crops,
    farmSize,
    locationName: { city, district, state },
    lang,
    user
  };
};

/**
 * @desc Get live agricultural weather & farm intelligence
 * @route GET /api/weather
 */
const getWeather = async (req, res, next) => {
  try {
    const context = resolveFarmerContext(req);
    const weatherData = await fetchWeather({
      latitude: context.latitude,
      longitude: context.longitude,
      crops: context.crops,
      farmSize: context.farmSize,
      locationName: context.locationName,
      lang: context.lang
    });

    res.json(weatherData);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get structured daily AI farm briefing (cached, fallback-safe)
 * @route GET /api/weather/ai-brief
 */
const getAiBriefing = async (req, res, next) => {
  try {
    const context = resolveFarmerContext(req);
    const weatherData = await fetchWeather({
      latitude: context.latitude,
      longitude: context.longitude,
      crops: context.crops,
      farmSize: context.farmSize,
      locationName: context.locationName,
      lang: context.lang
    });

    const briefing = await generateStructuredAiBriefing({
      weatherData,
      farmContext: {
        district: context.locationName.district,
        city: context.locationName.city,
        state: context.locationName.state,
        mainCrops: context.crops,
        landSizeAcres: context.farmSize
      },
      lang: context.lang
    });

    res.json(briefing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Interactive AI Farm Advisor Q&A
 * @route POST /api/weather/ask
 */
const askAdvisor = async (req, res, next) => {
  try {
    const context = resolveFarmerContext(req);
    const query = req.body?.query || req.query?.query || '';

    const weatherData = await fetchWeather({
      latitude: context.latitude,
      longitude: context.longitude,
      crops: context.crops,
      farmSize: context.farmSize,
      locationName: context.locationName,
      lang: context.lang
    });

    const answer = await askAiFarmAdvisor({
      query,
      weatherData,
      farmContext: {
        district: context.locationName.district,
        city: context.locationName.city,
        state: context.locationName.state,
        mainCrops: context.crops,
        landSizeAcres: context.farmSize
      },
      lang: context.lang
    });

    res.json(answer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeather,
  getAiBriefing,
  askAdvisor
};
