const { fetchWeather } = require('../services/weatherService');

// @desc Get live agricultural weather for user's recorded location or coordinates
// @route GET /api/weather
const getWeather = async (req, res, next) => {
  try {
    let { lat, lon } = req.query;

    // If user is authenticated and coordinates not passed in query, use user's saved location
    if ((!lat || !lon) && req.user) {
      lat = req.user.latitude;
      lon = req.user.longitude;
    }

    // Default to Delhi coordinates if still missing (28.6139 N, 77.2090 E)
    const latitude = lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : 28.6139;
    const longitude = lon !== undefined && !isNaN(Number(lon)) ? Number(lon) : 77.2090;

    const weatherData = await fetchWeather({ latitude, longitude });

    res.json(weatherData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeather
};
