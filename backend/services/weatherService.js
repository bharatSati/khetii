const axios = require('axios');

// In-memory weather cache (10 minutes TTL)
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * WMO Weather code interpreter with bilingual labels and agricultural advisories
 */
const getWeatherDetails = (code) => {
  switch (code) {
    case 0:
      return {
        condition: 'Clear Sky',
        conditionHi: 'साफ़ आसमान',
        type: 'clear',
        advisoryEn: 'Sunny and clear. Ideal conditions for harvesting, grain drying, and normal irrigation.',
        advisoryHi: 'मौसम पूरी तरह साफ़ व धूपदार है। कटाई, अनाज सुखाने और सामान्य सिंचाई के लिए उत्तम समय।'
      };
    case 1:
    case 2:
    case 3:
      return {
        condition: 'Partly Cloudy',
        conditionHi: 'आंशिक बादल',
        type: 'cloudy',
        advisoryEn: 'Mild clouds. Good conditions for fieldwork, sowing, and standard farm activities.',
        advisoryHi: 'हल्के बादल छाए रहेंगे। बुआई, खाद देने और सामान्य कृषि कार्यों के लिए अनुकूल मौसम।'
      };
    case 45:
    case 48:
      return {
        condition: 'Foggy / Mist',
        conditionHi: 'कोहरा / धुंध',
        type: 'fog',
        advisoryEn: 'Morning fog expected. Inspect crops for moisture and fungal risk; delay early morning spraying.',
        advisoryHi: 'सुबह कोहरा रहेगा। फसलों में फंगस/कीट पर नज़र रखें, सुबह-सुबह स्प्रे करने से बचें।'
      };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return {
        condition: 'Rain / Showers',
        conditionHi: 'वर्षा / बूंदाबांदी',
        type: 'rain',
        advisoryEn: 'Rain expected. Postpone irrigation and pesticide/fertiliser spraying; ensure field drainage.',
        advisoryHi: 'बारिश की संभावना है। सिंचाई और कीटनाशक छिड़काव टालें, खेत में जल निकासी सुनिश्चित करें।'
      };
    case 95:
    case 96:
    case 99:
      return {
        condition: 'Thunderstorm',
        conditionHi: 'आंधी-तूफ़ान',
        type: 'thunder',
        advisoryEn: 'Thunderstorm warning. Secure harvested produce, support young plants, and avoid open field work.',
        advisoryHi: 'तेज़ हवाओं व गरज की चेतावनी। कटी हुई फसल को ढकें और सुरक्षित स्थान पर रहें।'
      };
    default:
      return {
        condition: 'Fair Weather',
        conditionHi: 'सामान्य मौसम',
        type: 'clear',
        advisoryEn: 'Normal seasonal weather. Continue scheduled farm management practices.',
        advisoryHi: 'सामान्य मौसमी परिस्थितियां। अपनी योजनानुसार कृषि कार्य जारी रखें।'
      };
  }
};

/**
 * Fetch live weather from Open-Meteo
 * Defaults to Delhi (28.6139, 77.2090) if not provided
 */
const fetchWeather = async ({ latitude = 28.6139, longitude = 77.2090 }) => {
  const lat = parseFloat(latitude) || 28.6139;
  const lon = parseFloat(longitude) || 77.2090;

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;

  try {
    const response = await axios.get(url, { timeout: 7000 });
    const { current, daily } = response.data;

    const currentDetails = getWeatherDetails(current?.weather_code || 0);

    const forecast = (daily?.time || []).map((date, idx) => {
      const dayCode = daily.weather_code?.[idx] || 0;
      const details = getWeatherDetails(dayCode);
      return {
        date,
        tempMax: Math.round(daily.temperature_2m_max?.[idx] || 0),
        tempMin: Math.round(daily.temperature_2m_min?.[idx] || 0),
        rainProb: daily.precipitation_probability_max?.[idx] || 0,
        condition: details.condition,
        conditionHi: details.conditionHi,
        type: details.type
      };
    });

    const result = {
      location: {
        latitude: lat,
        longitude: lon
      },
      current: {
        temperature: Math.round(current?.temperature_2m || 0),
        feelsLike: Math.round(current?.apparent_temperature || current?.temperature_2m || 0),
        humidity: current?.relative_humidity_2m || 0,
        windSpeed: current?.wind_speed_10m || 0,
        precipitation: current?.precipitation || 0,
        weatherCode: current?.weather_code || 0,
        condition: currentDetails.condition,
        conditionHi: currentDetails.conditionHi,
        type: currentDetails.type,
        isDay: current?.is_day !== 0
      },
      advisory: {
        en: currentDetails.advisoryEn,
        hi: currentDetails.advisoryHi
      },
      forecast,
      updatedAt: new Date().toISOString()
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error('Weather fetch error:', error.message);
    // Return graceful default weather data for Delhi if network fails
    const fallbackDetails = getWeatherDetails(0);
    return {
      location: { latitude: lat, longitude: lon },
      current: {
        temperature: 28,
        feelsLike: 29,
        humidity: 55,
        windSpeed: 8,
        precipitation: 0,
        weatherCode: 0,
        condition: fallbackDetails.condition,
        conditionHi: fallbackDetails.conditionHi,
        type: 'clear',
        isDay: true
      },
      advisory: {
        en: fallbackDetails.advisoryEn,
        hi: fallbackDetails.advisoryHi
      },
      forecast: [],
      updatedAt: new Date().toISOString()
    };
  }
};

module.exports = {
  fetchWeather,
  getWeatherDetails
};
