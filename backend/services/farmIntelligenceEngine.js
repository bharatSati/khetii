/**
 * Farm Intelligence Engine
 * Deterministic agricultural meteorology algorithms for Indian farming conditions.
 * Calculates irrigation windows, spraying suitability, fieldwork advisories,
 * farm risk scores (0-100), crop-specific vulnerabilities, today's farm plan,
 * smart 24-hr farm clock, and transparent "Why?" rationales.
 */

// Normalize crop names for bilingual matching (English & Hindi)
const CROP_DICTIONARY = {
  wheat: { en: 'Wheat', hi: 'गेहूं', aliases: ['wheat', 'gehu', 'gehoon', 'गेहूं', 'गेंहू'] },
  rice: { en: 'Paddy / Rice', hi: 'धान / चावल', aliases: ['rice', 'paddy', 'dhan', 'chawal', 'धान', 'चावल'] },
  mustard: { en: 'Mustard', hi: 'सरसों', aliases: ['mustard', 'sarson', 'rai', 'toria', 'सरसों', 'राई'] },
  cotton: { en: 'Cotton', hi: 'कपास', aliases: ['cotton', 'kapas', 'रूई', 'कपास'] },
  potato: { en: 'Potato', hi: 'आलू', aliases: ['potato', 'aloo', 'alu', 'आलू'] },
  tomato: { en: 'Tomato', hi: 'टमाटर', aliases: ['tomato', 'tamatar', 'टमाटर'] },
  maize: { en: 'Maize / Corn', hi: 'मक्का', aliases: ['maize', 'corn', 'makka', 'bhutta', 'मक्का', 'भुट्टा'] },
  sugarcane: { en: 'Sugarcane', hi: 'गन्ना', aliases: ['sugarcane', 'ganna', 'ikshu', 'गन्ना'] },
  gram: { en: 'Gram / Chickpea', hi: 'चना', aliases: ['gram', 'chana', 'chickpea', 'चना', 'छोले'] },
  soybean: { en: 'Soybean', hi: 'सोयाबीन', aliases: ['soybean', 'soya', 'soyabean', 'सोयाबीन'] },
  onion: { en: 'Onion', hi: 'प्याज', aliases: ['onion', 'pyaj', 'pyaaz', 'कांदा', 'प्याज'] },
  groundnut: { en: 'Groundnut / Peanut', hi: 'मूंगफली', aliases: ['groundnut', 'peanut', 'mungfali', 'moongfali', 'मूंगफली'] },
  pulses: { en: 'Pulses / Dal', hi: 'दालें / दलहन', aliases: ['pulses', 'dal', 'moong', 'urad', 'arhar', 'tur', 'दाल', 'दलहन', 'मूंग', 'उड़द', 'अरहर'] },
  chilli: { en: 'Chilli', hi: 'मिर्च', aliases: ['chilli', 'chili', 'mirch', 'mirchi', 'मिर्च'] },
  garlic: { en: 'Garlic', hi: 'लहसुन', aliases: ['garlic', 'lahsun', 'lahsan', 'लहसुन'] }
};

/**
 * Match user crop string to standardized key
 */
const matchCrop = (cropStr) => {
  if (!cropStr) return null;
  const lower = cropStr.toLowerCase().trim();
  for (const [key, meta] of Object.entries(CROP_DICTIONARY)) {
    if (meta.aliases.some((alias) => lower.includes(alias.toLowerCase()))) {
      return { key, ...meta };
    }
  }
  return { key: lower, en: cropStr, hi: cropStr, aliases: [lower] };
};

/**
 * 1. Irrigation Intelligence
 * Analyzes rain forecast, soil moisture, ET0, and crop demand
 */
const calculateIrrigationIntelligence = ({ current, hourly, daily, crops = [] }) => {
  const currentRain = current?.rain || current?.precipitation || 0;
  const todayRainProb = daily?.precipitation_probability_max?.[0] || 0;
  const todayRainSum = daily?.precipitation_sum?.[0] || daily?.rain_sum?.[0] || 0;
  const next24hRainProbMax = Math.max(...(hourly?.precipitation_probability?.slice(0, 24) || [todayRainProb]));
  const next24hRainSum = (hourly?.precipitation?.slice(0, 24) || []).reduce((acc, v) => acc + (v || 0), 0);
  const et0 = daily?.et0_fao_evapotranspiration?.[0] || current?.et0 || 3.5;
  const soilMoist = current?.soil_moisture_0_to_1cm ?? hourly?.soil_moisture_0_to_1cm?.[0] ?? 0.22;
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature || 28;

  let status = 'normal'; // 'irrigate_now' | 'postpone' | 'skip' | 'normal'
  let windowEn = '';
  let windowHi = '';
  let reasonEn = '';
  let reasonHi = '';

  // Decision logic
  if (next24hRainSum >= 8 || todayRainSum >= 8 || next24hRainProbMax >= 70) {
    status = 'skip';
    windowEn = 'Skip irrigation today and tomorrow';
    windowHi = 'आज और कल सिंचाई पूरी तरह छोड़ें';
    reasonEn = `Significant rain expected (${Math.round(next24hRainSum || todayRainSum)} mm, ${next24hRainProbMax}% probability). Natural precipitation will saturate roots; irrigation risks severe waterlogging and nutrient leaching.`;
    reasonHi = `भारी बारिश की संभावना (${Math.round(next24hRainSum || todayRainSum)} मिमी, ${next24hRainProbMax}% आशंका)। प्राकृतिक वर्षा से पर्याप्त नमी मिलेगी; सिंचाई करने पर जलभराव और खाद बहने का जोखिम है।`;
  } else if (next24hRainSum >= 2 || next24hRainProbMax >= 45 || todayRainProb >= 50) {
    status = 'postpone';
    windowEn = 'Postpone by 24 to 36 hours';
    windowHi = 'सिंचाई 24 से 36 घंटे के लिए टालें';
    reasonEn = `Moderate rain probability (${next24hRainProbMax}%). Wait 24 hours to monitor actual rainfall before turning on tubewells or canals.`;
    reasonHi = `बारिश की मध्यम संभावना (${next24hRainProbMax}%) है। ट्यूबवेल या नहर से पानी लगाने से पहले 24 घंटे इंतज़ार करें ताकि बिजली और पानी की बचत हो।`;
  } else if (soilMoist >= 0.32) {
    status = 'skip';
    windowEn = 'Soil moisture is currently sufficient';
    windowHi = 'खेत की मिट्टी में पर्याप्त नमी मौजूद है';
    reasonEn = `Root zone soil moisture is high (${Math.round(soilMoist * 100)}%). Adding more water will reduce root aeration and increase fungal damping-off risk.`;
    reasonHi = `जड़ क्षेत्र की मिट्टी में नमी उच्च स्तर (${Math.round(soilMoist * 100)}%) पर है। अतिरिक्त सिंचाई से जड़ों को हवा नहीं मिलेगी और फंगस का खतरा बढ़ेगा।`;
  } else if (soilMoist < 0.18 || (et0 >= 4.2 && next24hRainSum < 1)) {
    status = 'irrigate_now';
    windowEn = 'Optimal: Early morning (06:00 - 09:00 AM) or Late evening (05:00 - 07:30 PM)';
    windowHi = 'उत्तम समय: सुबह 06:00 से 09:00 बजे या शाम 05:00 से 07:30 बजे';
    reasonEn = `High evapotranspiration (${et0.toFixed(1)} mm/day) and low soil moisture (${Math.round(soilMoist * 100)}%). Irrigate during cool morning or evening hours to avoid 30-40% midday water evaporation loss.`;
    reasonHi = `तेज़ वाष्पोत्सर्जन (${et0.toFixed(1)} मिमी/दिन) और मिट्टी में कम नमी (${Math.round(soilMoist * 100)}%)। दोपहर की धूप में 30-40% पानी उड़ने से बचाने के लिए सुबह या शाम को सिंचाई करें।`;
  } else {
    status = 'normal';
    windowEn = 'Morning (06:30 - 09:30 AM) or late afternoon';
    windowHi = 'सुबह 06:30 से 09:30 बजे या देर शाम';
    reasonEn = `Normal seasonal weather with moderate evaporation (${et0.toFixed(1)} mm/day). Follow standard crop growth stage irrigation.`;
    reasonHi = `सामान्य मौसमी परिस्थितियां और संतुलित वाष्पोत्सर्जन (${et0.toFixed(1)} मिमी/दिन)। फसल की अवस्था के अनुसार सामान्य सिंचाई चक्र जारी रखें।`;
  }

  return {
    status,
    windowEn,
    windowHi,
    reasonEn,
    reasonHi,
    metrics: {
      rainProb: next24hRainProbMax,
      expectedRainMm: Math.round((next24hRainSum || todayRainSum) * 10) / 10,
      et0: Math.round(et0 * 10) / 10,
      soilMoisturePercent: Math.round(soilMoist * 100),
      temperatureMax: Math.round(tempMax)
    }
  };
};

/**
 * 2. Spray Window Intelligence (Pesticide, Fungicide, Foliar nutrition)
 * Wind 3-12 km/h is safe; >15 km/h causes drift; rain washes away chemicals; heat >32°C causes leaf scorch.
 */
const calculateSprayWindow = ({ current, hourly, daily }) => {
  const windSpeed = current?.wind_speed_10m || 0;
  const windGust = current?.wind_gusts_10m || windSpeed * 1.3;
  const temp = current?.temperature_2m || 25;
  const humidity = current?.relative_humidity_2m || 60;
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;

  // Hourly search for best window in next 24 hours
  const hourlyTimes = hourly?.time?.slice(0, 24) || [];
  const suitableHours = [];
  const unsafeHours = [];

  hourlyTimes.forEach((timeStr, idx) => {
    const hTemp = hourly?.temperature_2m?.[idx] ?? 25;
    const hWind = hourly?.wind_speed_10m?.[idx] ?? 10;
    const hRainProb = hourly?.precipitation_probability?.[idx] ?? 0;
    const hRain = hourly?.precipitation?.[idx] ?? 0;
    const hHum = hourly?.relative_humidity_2m?.[idx] ?? 50;

    const date = new Date(timeStr);
    const hour = date.getHours();
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

    const isDaylight = hour >= 6 && hour <= 18;

    if (hRain > 0.1 || hRainProb > 40 || hWind >= 16 || hTemp >= 33) {
      if (isDaylight) unsafeHours.push({ hour, label: timeLabel, temp: hTemp, wind: hWind, rainProb: hRainProb });
    } else if (isDaylight && hWind >= 3 && hWind <= 12 && hTemp >= 16 && hTemp <= 30 && hRainProb <= 20) {
      suitableHours.push({ hour, label: timeLabel, temp: hTemp, wind: hWind, rainProb: hRainProb });
    }
  });

  let status = 'optimal'; // 'optimal' | 'moderate' | 'unsafe'
  let bestWindowEn = '07:00 AM - 10:30 AM (Calm winds, mild temperature)';
  let bestWindowHi = 'सुबह 07:00 से 10:30 बजे (शांत हवा, अनुकूल तापमान)';
  let unsafeWindowEn = '12:00 PM - 04:00 PM (Midday heat & rapid evaporation)';
  let unsafeWindowHi = 'दोपहर 12:00 से 04:00 बजे (तेज़ धूप, दवा का वाष्पीकरण व पत्तियों का झुलसना)';
  let reasonEn = '';
  let reasonHi = '';

  if (rainProb >= 50 || windSpeed >= 18 || (hourly?.precipitation?.slice(0, 12) || []).some((r) => r > 0.5)) {
    status = 'unsafe';
    bestWindowEn = 'No safe spray window today';
    bestWindowHi = 'आज छिड़काव के लिए कोई सुरक्षित समय नहीं है';
    reasonEn = `High spray drift or wash-off hazard. Wind speed (${Math.round(windSpeed)} km/h) and rain risk (${rainProb}%) will waste expensive agrochemicals.`;
    reasonHi = `दवा बहने या हवा से उड़ने का गंभीर खतरा। हवा की गति (${Math.round(windSpeed)} किमी/घंटा) और बारिश का जोखिम (${rainProb}%) कीटनाशक को व्यर्थ कर देगा।`;
  } else if (windSpeed >= 14 || temp >= 32 || rainProb >= 30) {
    status = 'moderate';
    if (suitableHours.length > 0) {
      const first = suitableHours[0].label;
      const last = suitableHours[suitableHours.length - 1].label;
      bestWindowEn = `${first} - ${last} (Morning calm)`;
      bestWindowHi = `${first} से ${last} (सुबह के शांत मौसम में)`;
    }
    reasonEn = `Narrow spray window. Conduct spraying strictly in early morning before midday heat (${Math.round(temp)}°C) and rising wind gusts.`;
    reasonHi = `सीमित समय उपलब्ध। केवल सुबह के समय ही छिड़काव करें, दोपहर की धूप (${Math.round(temp)}°C) और तेज़ हवा से पहले कार्य पूरा करें।`;
  } else {
    status = 'optimal';
    if (suitableHours.length >= 2) {
      const first = suitableHours[0].label;
      const last = suitableHours[Math.min(suitableHours.length - 1, 3)].label;
      bestWindowEn = `${first} - ${last} & Late afternoon (04:30 PM - 06:30 PM)`;
      bestWindowHi = `${first} से ${last} और देर शाम (04:30 से 06:30 बजे)`;
    }
    reasonEn = `Excellent conditions for foliar application. Calm wind (${Math.round(windSpeed)} km/h), zero rain threat, and gentle humidity (${Math.round(humidity)}%) ensure maximum droplet adherence.`;
    reasonHi = `छिड़काव के लिए आदर्श मौसम। शांत हवा (${Math.round(windSpeed)} किमी/घंटा), शून्य बारिश और अनुकूल नमी (${Math.round(humidity)}%) से दवा पत्तियों पर पूरी तरह चिपकेगी।`;
  }

  return {
    status,
    bestWindowEn,
    bestWindowHi,
    unsafeWindowEn,
    unsafeWindowHi,
    reasonEn,
    reasonHi,
    metrics: {
      currentWindKmH: Math.round(windSpeed),
      windGustKmH: Math.round(windGust),
      temperature: Math.round(temp),
      humidity: Math.round(humidity),
      rainProb
    }
  };
};

/**
 * 3. Field Work Suitability Windows
 * Evaluates field inspection, sowing, spraying, irrigation, and harvesting
 */
const calculateFieldWorkWindow = ({ current, daily, irrigation, spray }) => {
  const weatherCode = current?.weather_code || 0;
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const tempMax = daily?.temperature_2m_max?.[0] || 30;
  const windSpeed = current?.wind_speed_10m || 0;

  const activities = [
    {
      activity: 'inspection',
      labelEn: 'Field Inspection & Pest Scouting',
      labelHi: 'खेत निरीक्षण व कीट निगरानी',
      status: 'good',
      windowEn: '06:30 AM - 10:00 AM & 04:30 PM - 06:30 PM',
      windowHi: 'सुबह 06:30 से 10:00 बजे व शाम 04:30 से 06:30 बजे',
      reasonEn: 'Insects and leaf symptoms are most visible during mild morning sunlight without heat stress.',
      reasonHi: 'सुबह की हल्की धूप में पत्तों के नीचे कीट व फंगस आसानी से पहचाने जा सकते हैं।'
    },
    {
      activity: 'spraying',
      labelEn: 'Agrochemical Spraying',
      labelHi: 'कीटनाशक / टॉनिक छिड़काव',
      status: spray.status === 'optimal' ? 'good' : spray.status === 'moderate' ? 'caution' : 'avoid',
      windowEn: spray.bestWindowEn,
      windowHi: spray.bestWindowHi,
      reasonEn: spray.reasonEn,
      reasonHi: spray.reasonHi
    },
    {
      activity: 'irrigation',
      labelEn: 'Field Irrigation',
      labelHi: 'खेत में पानी / सिंचाई',
      status: irrigation.status === 'irrigate_now' ? 'good' : irrigation.status === 'normal' ? 'caution' : 'avoid',
      windowEn: irrigation.windowEn,
      windowHi: irrigation.windowHi,
      reasonEn: irrigation.reasonEn,
      reasonHi: irrigation.reasonHi
    },
    {
      activity: 'sowing',
      labelEn: 'Sowing & Transplanting',
      labelHi: 'बुआई व पौध रोपाई',
      status: rainProb > 65 || tempMax > 38 ? 'avoid' : rainProb > 35 ? 'caution' : 'good',
      windowEn: 'Early morning hours (06:00 AM - 09:30 AM)',
      windowHi: 'प्रातःकाल (सुबह 06:00 से 09:30 बजे)',
      reasonEn: rainProb > 65 ? 'Heavy rain can wash away sown seeds and form a crust on topsoil.' : 'Favorable temperature and seedbed moisture promote healthy germination.',
      reasonHi: rainProb > 65 ? 'भारी बारिश से बोए गए बीज बह सकते हैं और मिट्टी की ऊपरी परत सख्त हो सकती है।' : 'अनुकूल तापमान और खेत की नमी से बीजों का अंकुरण स्वस्थ होगा।'
    },
    {
      activity: 'harvesting',
      labelEn: 'Harvesting & Grain Threshing',
      labelHi: 'कटाई, मड़ाई व अनाज सुखाना',
      status: rainProb >= 40 || weatherCode >= 51 ? 'avoid' : rainProb >= 25 ? 'caution' : 'good',
      windowEn: '10:00 AM - 04:30 PM (Dry sunny hours)',
      windowHi: 'सुबह 10:00 से शाम 04:30 बजे (धूपदार शुष्क समय)',
      reasonEn: rainProb >= 40 ? 'Rain threat will increase grain moisture, causing mold and storage rotting.' : 'Dry sunny conditions ensure low grain moisture (<12%) for safe storage.',
      reasonHi: rainProb >= 40 ? 'बारिश के कारण कटे हुए अनाज में नमी आ जाएगी, जिससे फफूंद व सड़न का खतरा रहेगा।' : 'तेज़ धूप में कटी फसल अच्छी तरह सूखेगी और दाने में सुरक्षित भंडारण स्तर रहेगा।'
    }
  ];

  return {
    overallStatus: activities.filter((a) => a.status === 'good').length >= 3 ? 'favorable' : 'moderate',
    activities
  };
};

/**
 * 4. Farm Weather Risk Score (0-100)
 * Evaluates rain risk, heat risk, wind risk, humidity/disease risk, and crop stress
 */
const calculateRiskScore = ({ current, daily }) => {
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const rainSum = daily?.precipitation_sum?.[0] || 0;
  const weatherCode = current?.weather_code || 0;
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature_2m || 30;
  const windSpeed = current?.wind_speed_10m || 0;
  const windGust = current?.wind_gusts_10m || windSpeed * 1.3;
  const humidity = current?.relative_humidity_2m || 50;
  const vpd = current?.vapor_pressure_deficit || 1.2;

  // Rain risk (0-100)
  let rainRisk = Math.min(100, Math.round(rainProb * 0.7 + rainSum * 3));
  if (weatherCode >= 95) rainRisk = Math.max(rainRisk, 90); // Thunderstorm

  // Heat risk (0-100)
  let heatRisk = 10;
  if (tempMax >= 42) heatRisk = 95;
  else if (tempMax >= 39) heatRisk = 80;
  else if (tempMax >= 36) heatRisk = 55;
  else if (tempMax >= 33) heatRisk = 30;

  // Wind risk (0-100)
  let windRisk = 10;
  if (windGust >= 45 || windSpeed >= 30) windRisk = 90;
  else if (windGust >= 35 || windSpeed >= 22) windRisk = 65;
  else if (windSpeed >= 15) windRisk = 35;

  // Humidity & Disease incubation risk (0-100)
  // High humidity (70-95%) with warm temps (20-28°C) is prime fungal sweet spot
  let humidityDiseaseRisk = 15;
  if (humidity >= 78 && tempMax >= 18 && tempMax <= 30) humidityDiseaseRisk = 80;
  else if (humidity >= 68 && tempMax >= 18 && tempMax <= 32) humidityDiseaseRisk = 55;
  else if (humidity >= 60) humidityDiseaseRisk = 30;

  // Crop stress (0-100)
  let cropStressRisk = 15;
  if (vpd > 2.5 || tempMax >= 40) cropStressRisk = 85;
  else if (vpd > 1.8 || tempMax >= 36) cropStressRisk = 50;
  else if (vpd < 0.2) cropStressRisk = 40; // stagnant moist air

  // Weighted overall score
  const overall = Math.min(
    100,
    Math.max(
      5,
      Math.round(rainRisk * 0.35 + heatRisk * 0.2 + windRisk * 0.15 + humidityDiseaseRisk * 0.2 + cropStressRisk * 0.1)
    )
  );

  let level = 'low'; // 'low' | 'moderate' | 'high' | 'severe'
  let labelEn = 'Favorable Farm Conditions';
  let labelHi = 'अनुकूल कृषि मौसम';
  let summaryEn = 'Weather is stable and supportive for standard field operations.';
  let summaryHi = 'मौसम स्थिर है और सामान्य कृषि कार्यों के लिए पूरी तरह अनुकूल है।';

  if (overall >= 75) {
    level = 'severe';
    labelEn = 'High Weather Alert / Critical Risk';
    labelHi = 'उच्च मौसमी जोखिम / सतर्कता आवश्यक';
    summaryEn = 'Adverse meteorological conditions detected. Protective field measures required immediately.';
    summaryHi = 'विपरीत मौसमी परिस्थितियां। फसल सुरक्षा के लिए तुरंत आवश्यक कदम उठाएं।';
  } else if (overall >= 50) {
    level = 'high';
    labelEn = 'Elevated Risk / Action Advised';
    labelHi = 'सक्रिय जोखिम / सावधानी बरतें';
    summaryEn = 'Specific weather factors (rain, high wind, or fungal humidity) require proactive farm management.';
    summaryHi = 'बारिश, तेज़ हवा या फंगस के अनुकूल मौसम के कारण सतर्क रहने की सलाह दी जाती है।';
  } else if (overall >= 25) {
    level = 'moderate';
    labelEn = 'Moderate Seasonal Risk';
    labelHi = 'मध्यम मौसमी प्रभाव';
    summaryEn = 'Normal seasonal variations. Monitor specific micro-climate conditions.';
    summaryHi = 'सामान्य मौसमी उतार-चढ़ाव। खेत के अनुसार निगरानी बनाए रखें।';
  }

  return {
    overall,
    level,
    labelEn,
    labelHi,
    summaryEn,
    summaryHi,
    breakdown: {
      rainRisk,
      heatRisk,
      windRisk,
      humidityDiseaseRisk,
      cropStressRisk
    }
  };
};

/**
 * 5. Crop Weather Risk (Specific to farmer's crops)
 * IMPORTANT: Clearly marked as a weather-based sensitivity estimate, not a clinical disease diagnosis.
 */
const calculateCropWeatherRisk = ({ current, daily, crops = [] }) => {
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature_2m || 30;
  const tempMin = daily?.temperature_2m_min?.[0] || 18;
  const humidity = current?.relative_humidity_2m || 55;
  const windSpeed = current?.wind_speed_10m || 0;
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const rainSum = daily?.precipitation_sum?.[0] || 0;
  const weatherCode = current?.weather_code || 0;

  // Use configured crops, or sensible default Indian staple crops if farmer hasn't set crops
  const targetCrops = crops.length > 0 ? crops : ['Wheat', 'Mustard', 'Paddy / Rice', 'Potato'];

  const results = targetCrops.map((rawCrop) => {
    const matched = matchCrop(rawCrop);
    const cropKey = matched.key;
    const nameEn = matched.en;
    const nameHi = matched.hi;

    let riskLevel = 'low'; // 'low' | 'moderate' | 'high'
    let factorEn = '';
    let factorHi = '';
    let advisoryEn = '';
    let advisoryHi = '';

    switch (cropKey) {
      case 'wheat':
        if (tempMax >= 34) {
          riskLevel = 'high';
          factorEn = 'Terminal heat stress';
          factorHi = 'असमय तेज़ गर्मी / तापमान वृद्धि';
          advisoryEn = 'High temperature can cause forced grain ripening and shriveled grains. Apply light evening micro-irrigation to cool canopy.';
          advisoryHi = 'अधिक तापमान से दाना सिकुड़ने का खतरा रहता है। खेत का तापमान सामान्य रखने के लिए शाम को हल्की सिंचाई करें।';
        } else if (windSpeed >= 24 && rainProb >= 40) {
          riskLevel = 'high';
          factorEn = 'Lodging risk from wind and wet soil';
          factorHi = 'तेज़ हवा व गीली मिट्टी से फसल गिरने (लॉजिंग) का खतरा';
          advisoryEn = 'Avoid heavy irrigation before windy showers to prevent crop lodging (falling over).';
          advisoryHi = 'तेज़ हवा और बारिश की संभावना में भारी पानी न लगाएं ताकि फसल खेत में न गिरे।';
        } else if (humidity >= 75 && tempMax <= 26) {
          riskLevel = 'moderate';
          factorEn = 'Yellow/brown rust favorable conditions';
          factorHi = 'पीला/भूरा रतुआ (गेरुआ) फंगस का अनुकूल वातावरण';
          advisoryEn = 'Check lower leaves for yellow powdery pustules; keep field drainage open.';
          advisoryHi = 'निचली पत्तियों पर पीले पाउडर जैसे धब्बों की जांच करें; खेत में पानी न रुकने दें।';
        } else {
          riskLevel = 'low';
          factorEn = 'Favorable vegetative/growth weather';
          factorHi = 'वानस्पतिक बढ़वार के लिए अनुकूल मौसम';
          advisoryEn = 'Weather is conducive for tiller development and balanced nutrient uptake.';
          advisoryHi = 'फुटाव और पोषक तत्वों के अवशोषण के लिए मौसम पूरी तरह अनुकूल है।';
        }
        break;

      case 'mustard':
        if (weatherCode === 45 || weatherCode === 48 || (humidity >= 78 && tempMax <= 24)) {
          riskLevel = 'high';
          factorEn = 'Aphid (Chepa/Mahoo) & White Rust risk';
          factorHi = 'चेपा (माहू) कीट व सफेद रतुआ का उच्च जोखिम';
          advisoryEn = 'Overcast foggy weather accelerates aphid multiplication. Scout top inflorescence clusters daily; spray neem oil or recommended aphicide if threshold crossed.';
          advisoryHi = 'बादल और कोहरे वाले मौसम में माहू बहुत तेजी से बढ़ता है। फूलों और फलियों पर नज़र रखें; नीम का तेल या अनुशंसित कीटनाशक तैयार रखें।';
        } else if (rainProb >= 50 && windSpeed >= 20) {
          riskLevel = 'moderate';
          factorEn = 'Shattering of pods and lodging';
          factorHi = 'फलियां चटकने व गिरने का जोखिम';
          advisoryEn = 'Harvest mature crop early before high winds trigger pod shattering.';
          advisoryHi = 'पकी हुई फसल की जल्द कटाई करें ताकि तेज़ हवा से फलियां चटककर दाने न बिखरें।';
        } else {
          riskLevel = 'low';
          factorEn = 'Good pod-filling weather';
          factorHi = 'फलियों में दाना भरने के लिए अनुकूल';
          advisoryEn = 'Bright sunshine supports oil accumulation in developing seeds.';
          advisoryHi = 'खिली धूप से दानों में तेल की मात्रा और गुणवत्ता अच्छी बनती है।';
        }
        break;

      case 'rice':
        if (windSpeed >= 25 && tempMax >= 32) {
          riskLevel = 'high';
          factorEn = 'Lodging & moisture stress';
          factorHi = 'हवा से फसल गिरना व जल वाष्पीकरण';
          advisoryEn = 'Maintain standing water layer (3-5 cm) to anchor root system and cool microclimate.';
          advisoryHi = 'खेत में 3-5 सेमी पानी का स्तर बनाए रखें ताकि जड़ें मजबूत रहें और तापमान नियंत्रित रहे।';
        } else if (humidity >= 80 && tempMax >= 26 && tempMax <= 32) {
          riskLevel = 'moderate';
          factorEn = 'Bacterial blight & Blast weather sensitivity';
          factorHi = 'ब्लास्ट (झोंका) व जीवाणु झुलसा का मौसम';
          advisoryEn = 'High humidity fosters blast spores. Avoid excessive nitrogen fertilizer split during cloudy days.';
          advisoryHi = 'उच्च आर्द्रता में ब्लास्ट रोग के बीजाणु पनपते हैं। बादलों के मौसम में यूरिया की अधिक मात्रा न डालें।';
        } else {
          riskLevel = 'low';
          factorEn = 'Stable growing conditions';
          factorHi = 'अनुकूल विकास वातावरण';
          advisoryEn = 'Solar radiation is adequate for photosynthesis and tiller establishment.';
          advisoryHi = 'प्रकाश संश्लेषण और स्वस्थ बढ़वार के लिए परिस्थितियां अनुकूल हैं।';
        }
        break;

      case 'potato':
      case 'tomato':
        if (humidity >= 78 && tempMax >= 15 && tempMax <= 24) {
          riskLevel = 'high';
          factorEn = 'Late Blight (झुलसा) high weather trigger';
          factorHi = 'पछेती झुलसा (लेट ब्लाइट) का अति संवेदनशील मौसम';
          advisoryEn = 'Prolonged high humidity and cool temps trigger late blight spores rapidly. Apply preventive contact fungicide before rain event.';
          advisoryHi = 'लगातार नमी व ठंडे मौसम में झुलसा रोग तेजी से फैलता है। बारिश से पहले सुरक्षात्मक फफूंदनाशक का स्प्रे करें।';
        } else if (rainSum >= 10 || rainProb >= 65) {
          riskLevel = 'high';
          factorEn = 'Waterlogging and tuber/root rot';
          factorHi = 'जलभराव व कंद सड़न का खतरा';
          advisoryEn = 'Ensure clear furrows and open drainage channels; standing water rots potato tubers within 24 hours.';
          advisoryHi = 'खेत की नालियों को तुरंत साफ़ करें; खेत में रुका पानी 24 घंटे में आलू के कंद सड़ा सकता है।';
        } else {
          riskLevel = 'low';
          factorEn = 'Optimal tuber bulking conditions';
          factorHi = 'कंद विस्तार के लिए आदर्श समय';
          advisoryEn = 'Good day-night temperature differential supports starch accumulation in tubers.';
          advisoryHi = 'दिन-रात के संतुलित तापमान से आलू का आकार और वजन तेजी से बढ़ता है।';
        }
        break;

      case 'cotton':
        if (tempMax >= 40) {
          riskLevel = 'high';
          factorEn = 'Square and boll shedding';
          factorHi = 'फूल और गूलर (टिंडे) झड़ने का जोखिम';
          advisoryEn = 'Intense heat above 40°C triggers boll shedding. Light drip irrigation preserves reproductive structures.';
          advisoryHi = '40°C से ऊपर तापमान से गूलर झड़ने लगते हैं। ड्रिप या हल्की सिंचाई से नमी बनाए रखें।';
        } else if (humidity >= 72 && tempMax >= 28) {
          riskLevel = 'moderate';
          factorEn = 'Whitefly and sucking pest build-up';
          factorHi = 'सफेद मक्खी व रसचूसक कीटों की सक्रियता';
          advisoryEn = 'Warm humid spells encourage whitefly and jassids. Install yellow sticky traps in field.';
          advisoryHi = 'गर्म-उमस भरे मौसम में सफेद मक्खी बढ़ती है। खेत में पीले चिपचिपे ट्रैप (येलो स्टिकी ट्रैप) लगाएं।';
        } else {
          riskLevel = 'low';
          factorEn = 'Healthy boll maturation weather';
          factorHi = 'टिंडों के विकास के लिए उत्तम मौसम';
          advisoryEn = 'Plentiful sunshine supports uniform boll development.';
          advisoryHi = 'पर्याप्त धूप से टिंडों का विकास और रेशा मजबूत बनता है।';
        }
        break;

      default:
        // Generic crop logic
        if (rainProb >= 60 || rainSum >= 12) {
          riskLevel = 'moderate';
          factorEn = 'Excess rainfall sensitivity';
          factorHi = 'अतिरिक्त बारिश से जलभराव की संवेदनशीलता';
          advisoryEn = 'Ensure drainage outlets are unobstructed to prevent standing water near crop roots.';
          advisoryHi = 'खेत में पानी जमा न होने दें और जल निकासी की नालियां खुली रखें।';
        } else if (tempMax >= 38) {
          riskLevel = 'moderate';
          factorEn = 'High temperature moisture depletion';
          factorHi = 'उच्च तापमान व तेज वाष्पोत्सर्जन';
          advisoryEn = 'Provide timely light irrigation to prevent wilting during midday peak sun.';
          advisoryHi = 'दोपहर की चिलचिलाती धूप में मुरझाने से बचाने के लिए हल्की सिंचाई करें।';
        } else {
          riskLevel = 'low';
          factorEn = 'Stable seasonal climate';
          factorHi = 'संतुलित मौसमी परिस्थिति';
          advisoryEn = 'Current weather parameters are within safe agronomic thresholds for this crop.';
          advisoryHi = 'वर्तमान मौसमी आंकड़े इस फसल के सुरक्षित कृषि मापदंडों के भीतर हैं।';
        }
        break;
    }

    return {
      crop: nameEn,
      cropHi: nameHi,
      riskLevel,
      factorEn,
      factorHi,
      advisoryEn,
      advisoryHi,
      isEstimateNoteEn: 'Weather-based risk estimate (Not a disease diagnosis; assesses crop sensitivity under current weather).',
      isEstimateNoteHi: 'मौसम-आधारित जोखिम अनुमान (यह रोग निदान नहीं है, बल्कि वर्तमान मौसम के अनुसार फसल की संभावित संवेदनशीलता है)।'
    };
  });

  return results;
};

/**
 * 6. Today's Farm Plan
 * DO NOW (✅ तुरंत करें), AVOID (❌ आज न करें), WATCH (⚠️ निगरानी रखें)
 */
const generateTodayPlan = ({ current, hourly, daily, irrigation, spray, riskScore, crops = [] }) => {
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const rainSum = daily?.precipitation_sum?.[0] || 0;
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature_2m || 30;
  const windSpeed = current?.wind_speed_10m || 0;
  const humidity = current?.relative_humidity_2m || 50;

  const doNow = [];
  const avoid = [];
  const watch = [];

  // DO NOW
  if (spray.status === 'optimal') {
    doNow.push({
      id: 'spray_now',
      icon: 'spray',
      titleEn: 'Conduct Agro-Spray in Morning Window',
      titleHi: 'सुबह के समय आवश्यक छिड़काव पूरा करें',
      descEn: `Winds are calm (${Math.round(windSpeed)} km/h) and no rain threat. Ideal time for micronutrients or crop protection.`,
      descHi: `हवा शांत (${Math.round(windSpeed)} किमी/घंटा) है और बारिश का कोई डर नहीं है। टॉनिक या कीटनाशक छिड़कने का सही समय।`
    });
  } else {
    doNow.push({
      id: 'field_scouting',
      icon: 'field',
      titleEn: 'Early Morning Field Scouting',
      titleHi: 'सुबह खेत का मुआयना व फसल निरीक्षण',
      descEn: 'Inspect the underside of leaves and crop crowns for early pest or fungal signs before sun gets intense.',
      descHi: 'धूप तेज़ होने से पहले पत्तियों के नीचे और तनों पर कीट या फंगस के शुरुआती लक्षणों की जांच करें।'
    });
  }

  if (irrigation.status === 'irrigate_now') {
    doNow.push({
      id: 'irrigate_now',
      icon: 'irrigate',
      titleEn: 'Apply Timely Morning/Evening Irrigation',
      titleHi: 'सुबह या शाम के समय खेत में पानी लगाएं',
      descEn: `Evaporation is high (${irrigation.metrics.et0} mm/day). Supply water during cool hours to avoid stress.`,
      descHi: `वाष्पोत्सर्जन दर अधिक (${irrigation.metrics.et0} मिमी/दिन) है। धूप ढलने पर या सुबह पानी दें ताकि नमी बनी रहे।`
    });
  } else if (rainProb >= 50 || rainSum >= 5) {
    doNow.push({
      id: 'clean_drainage',
      icon: 'drain',
      titleEn: 'Clear Field Drainage Channels',
      titleHi: 'खेत की जल निकासी नालियां साफ़ करें',
      descEn: 'Rain showers expected. Remove weeds and debris from drainage outlets to prevent waterlogging.',
      descHi: 'बारिश की संभावना है। पानी के निकास वाली नालियों से घास-फूस हटा दें ताकि खेत में पानी न भरे।'
    });
  } else {
    doNow.push({
      id: 'weeding_soil',
      icon: 'hoe',
      titleEn: 'Hoeing & Weeding Operations',
      titleHi: 'खेत में निराई-गुड़ाई व खरपतवार नियंत्रण',
      descEn: 'Dry soil crust facilitates easy weeding and loosens root zone for better aeration.',
      descHi: 'मिट्टी की ऊपरी परत सूखी है, जिससे खरपतवार निकालना और जड़ों तक हवा पहुंचाना आसान होगा।'
    });
  }

  // AVOID
  if (irrigation.status === 'skip' || irrigation.status === 'postpone') {
    avoid.push({
      id: 'avoid_irrigation',
      icon: 'no_water',
      titleEn: 'Avoid Flood Irrigation Today',
      titleHi: 'आज खेत में भारी पानी / सिंचाई न लगाएं',
      descEn: irrigation.reasonEn,
      descHi: irrigation.reasonHi
    });
  } else if (tempMax >= 34) {
    avoid.push({
      id: 'avoid_afternoon_irrigation',
      icon: 'no_water',
      titleEn: 'Avoid Midday Flood Irrigation',
      titleHi: 'दोपहर की कड़ी धूप में सिंचाई न करें',
      descEn: 'Hot soil combined with water creates root scalding and high fungal rot.',
      descHi: 'तपती मिट्टी में पानी देने से जड़ें उबलने जैसी स्थिति बनती है और फंगस तेजी से लगती है।'
    });
  }

  if (spray.status === 'unsafe' || tempMax >= 32 || windSpeed >= 16) {
    avoid.push({
      id: 'avoid_spray',
      icon: 'no_spray',
      titleEn: 'Avoid Midday & Afternoon Chemical Spray',
      titleHi: 'दोपहर में किसी भी दवा का छिड़काव न करें',
      descEn: 'High temperatures cause rapid droplet evaporation and risk burning tender leaf tips.',
      descHi: 'तेज़ तापमान से दवा तुरंत सूखकर उड़ जाती है और पत्तियों के किनारे झुलसने का खतरा रहता है।'
    });
  } else {
    avoid.push({
      id: 'avoid_open_storage',
      icon: 'shield_alert',
      titleEn: 'Do Not Leave Produce or Fertilizer Open',
      titleHi: 'कटी फसल या खाद को खुले आसमान के नीचे न छोड़ें',
      descEn: 'Protect harvested produce and opened fertilizer bags from unexpected weather shifts and morning dew.',
      descHi: 'कटे हुए अनाज और यूरिया की खुली बोरियों को तिरपाल से ढकें ताकि ओस या नमी से नुकसान न हो।'
    });
  }

  // WATCH
  if (rainProb >= 35) {
    watch.push({
      id: 'watch_rain',
      icon: 'rain_cloud',
      titleEn: `Monitor Evening Cloud Build-up (${rainProb}% Rain Risk)`,
      titleHi: `शाम के बादलों पर नज़र रखें (${rainProb}% बारिश का जोखिम)`,
      descEn: 'Track local rain developments before planning night operations or fertilizer broadcasting.',
      descHi: 'रात के समय खेत में कोई कार्य या खाद डालने से पहले आसमान और बादलों का रुख देखें।'
    });
  }

  if (humidity >= 70 && tempMax <= 30) {
    watch.push({
      id: 'watch_fungus',
      icon: 'bug',
      titleEn: 'Scout for Fungal Leaf Spots & Blight',
      titleHi: 'फंगस व पत्तियों पर काले/भूरे धब्बों पर नज़र रखें',
      descEn: `Current humidity (${humidity}%) creates favorable fungal incubation. Look for damp spots on leaves.`,
      descHi: `वर्तमान में नमी (${humidity}%) अधिक है। पत्तियों पर फफूंद या झुलसे के लक्षणों पर कड़ी निगरानी रखें।`
    });
  } else if (tempMax >= 36) {
    watch.push({
      id: 'watch_heat',
      icon: 'thermometer',
      titleEn: `Peak Heat Stress Warning (${Math.round(tempMax)}°C)`,
      titleHi: `दोपहर की तीव्र गर्मी की चेतावनी (${Math.round(tempMax)}°C)`,
      descEn: 'Keep young saplings shielded; provide shade and clean drinking water for farm cattle.',
      descHi: 'छोटे पौधों को धूप से बचाएं; पशुओं को छायादार स्थान पर बांधें और पर्याप्त पानी पिलाएं।'
    });
  } else {
    watch.push({
      id: 'watch_soil_moisture',
      icon: 'droplets',
      titleEn: 'Check Soil Moisture in Root Zone',
      titleHi: 'जड़ों के पास मिट्टी की नमी की स्थिति जांचें',
      descEn: 'Dig 2-3 inches deep to check if subsoil has adequate moisture retention.',
      descHi: 'खेत में 2-3 इंच गहराई तक खुरपी से खोदकर देखें कि अंदर नमी सही है या सूख रही है।'
    });
  }

  return { doNow, avoid, watch };
};

/**
 * 7. Smart Farm Clock (24-Hour Timeline)
 * Divides actual hourly forecast into real agricultural timeline blocks
 */
const generateSmartFarmClock = ({ hourly }) => {
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return [];
  }

  const result = [];
  // Take next 24 hours, sampling every 2-3 hours or key farm transition hours
  const targetHourIndices = [0, 3, 6, 9, 12, 15, 18, 21];

  targetHourIndices.forEach((idx) => {
    if (idx >= hourly.time.length) return;

    const timeStr = hourly.time[idx];
    const date = new Date(timeStr);
    const hour = date.getHours();
    const temp = Math.round(hourly.temperature_2m?.[idx] ?? 25);
    const rainProb = hourly.precipitation_probability?.[idx] ?? 0;
    const rain = hourly.precipitation?.[idx] ?? 0;
    const wind = Math.round(hourly.wind_speed_10m?.[idx] ?? 8);
    const code = hourly.weather_code?.[idx] ?? 0;

    const timeFormatted = `${hour.toString().padStart(2, '0')}:00`;
    let ampmLabel = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;

    let labelEn = '';
    let labelHi = '';
    let status = 'optimal'; // 'optimal' | 'caution' | 'avoid'
    let icon = 'sun';
    let reasonEn = '';
    let reasonHi = '';

    if (hour >= 5 && hour <= 7) {
      icon = 'field';
      if (rain > 0.5 || rainProb > 60) {
        labelEn = 'Rain Alert / Delay Field Entry';
        labelHi = 'बारिश की आशंका / खेत कार्य स्थगित';
        status = 'avoid';
        reasonEn = 'Wet soil makes walking and machinery operation difficult.';
        reasonHi = 'खेत में कीचड़ और फिसलन से काम करना कठिन रहेगा।';
      } else {
        labelEn = 'Early Field Scouting & Weeding';
        labelHi = 'प्रातःकालीन खेत मुआयना व निराई';
        status = 'optimal';
        reasonEn = `Cool morning (${temp}°C), calm air. Best time for farmer inspection.`;
        reasonHi = `सुहावनी सुबह (${temp}°C) व शांत हवा। खेत के निरीक्षण का उत्तम समय।`;
      }
    } else if (hour >= 8 && hour <= 10) {
      if (wind <= 12 && rainProb <= 20 && temp <= 29) {
        icon = 'spray';
        labelEn = 'Optimal Spray Window & Drip Run';
        labelHi = 'स्प्रे व ड्रिप सिंचाई का श्रेष्ठ समय';
        status = 'optimal';
        reasonEn = `Gentle wind (${wind} km/h) prevents drift; foliar absorption is peak.`;
        reasonHi = `हवा शांत (${wind} किमी/घंटा) है; पत्तियों पर दवा तेजी से असर करेगी।`;
      } else {
        icon = 'irrigate';
        labelEn = 'Intercultural Field Work';
        labelHi = 'खेत के सामान्य कृषि कार्य';
        status = 'optimal';
        reasonEn = 'Pleasant daytime conditions for manual farm tasks.';
        reasonHi = 'खेत में खाद देने या निराई-गुड़ाई के लिए अनुकूल मौसम।';
      }
    } else if (hour >= 11 && hour <= 13) {
      icon = 'heat';
      if (temp >= 35) {
        labelEn = 'Heat Rising — Avoid Heavy Labor';
        labelHi = 'धूप व गर्मी में वृद्धि — भारी काम से बचें';
        status = 'caution';
        reasonEn = `Temperature reaching ${temp}°C. Rest farm animals and workers.`;
        reasonHi = `तापमान ${temp}°C तक पहुंच रहा है। पशुओं और खुद को सीधी धूप से बचाएं।`;
      } else {
        labelEn = 'Midday Farm Tasks';
        labelHi = 'दोपहर के सामान्य कृषि कार्य';
        status = 'caution';
        reasonEn = 'Perform indoor sorting, seed cleaning, or machinery maintenance.';
        reasonHi = 'छाया में बैठकर अनाज की छंटाई या औजारों की मरम्मत करें।';
      }
    } else if (hour >= 14 && hour <= 16) {
      if (temp >= 33 || wind >= 16) {
        icon = 'no_spray';
        labelEn = 'Strictly Avoid Chemical Spraying';
        labelHi = 'स्प्रे से पूरी तरह बचें — तेज़ धूप/हवा';
        status = 'avoid';
        reasonEn = `High evaporation (${temp}°C) wastes chemicals and can scorch crops.`;
        reasonHi = `तेज़ गर्मी (${temp}°C) से दवा उड़ जाएगी और पत्ते झुलस सकते हैं।`;
      } else if (rainProb >= 40) {
        icon = 'rain';
        labelEn = 'Rain Showers Expected';
        labelHi = 'बारिश व बूंदाबांदी की संभावना';
        status = 'avoid';
        reasonEn = 'Rainfall will wet foliage and interfere with field work.';
        reasonHi = 'बारिश से फसल भीगेगी; खुले में काम करने से बचें।';
      } else {
        icon = 'sun';
        labelEn = 'Barn & Storage Maintenance';
        labelHi = 'भंडारण व पशुशाला प्रबंधन';
        status = 'optimal';
        reasonEn = 'Optimal for storage organization and livestock feeding.';
        reasonHi = 'पशु आहार तैयार करने और गोदाम व्यवस्थित करने का समय।';
      }
    } else if (hour >= 17 && hour <= 19) {
      if (rainProb >= 45) {
        icon = 'rain';
        labelEn = 'Rain Watch / Evening Showers';
        labelHi = 'बारिश पर नज़र / शाम की वर्षा';
        status = 'caution';
        reasonEn = `Rain probability is ${rainProb}%. Secure equipment and covered produce.`;
        reasonHi = `बारिश की आशंका ${rainProb}% है। कृषि यंत्रों और कटे अनाज को ढकें।`;
      } else {
        icon = 'irrigate';
        labelEn = 'Evening Irrigation & Second Scouting';
        labelHi = 'शाम की सिंचाई व दूसरा निरीक्षण';
        status = 'optimal';
        reasonEn = `Cooling down to ${temp}°C. Minimal water loss from soil surface.`;
        reasonHi = `तापमान घटकर ${temp}°C हुआ। पानी की कम से कम बर्बादी होगी।`;
      }
    } else {
      icon = 'moon';
      labelEn = 'Night Cool Down / Field Rest';
      labelHi = 'रात्रि विश्राम व ग्रीनहाउस जांच';
      status = 'optimal';
      reasonEn = `Night temp ${temp}°C. Inspect polyhouse ventilation if applicable.`;
      reasonHi = `रात का तापमान ${temp}°C। पॉलीहाउस में वेंटिलेशन की जांच करें।`;
    }

    result.push({
      time: timeFormatted,
      ampmLabel,
      temp,
      rainProb,
      rain,
      wind,
      status,
      icon,
      labelEn,
      labelHi,
      reasonEn,
      reasonHi
    });
  });

  return result;
};

/**
 * 7. 7-Day Farm Calendar
 * Rich day-by-day forecast with agricultural recommendations and avoids
 */
const generate7DayCalendar = ({ daily, crops = [] }) => {
  if (!daily || !daily.time) return [];

  const daysCount = Math.min(7, daily.time.length);
  const calendar = [];

  for (let i = 0; i < daysCount; i++) {
    const dateStr = daily.time[i];
    const code = daily.weather_code?.[i] ?? 0;
    const tempMax = Math.round(daily.temperature_2m_max?.[i] ?? 30);
    const tempMin = Math.round(daily.temperature_2m_min?.[i] ?? 18);
    const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
    const rainSum = Math.round((daily.precipitation_sum?.[i] ?? daily.rain_sum?.[i] ?? 0) * 10) / 10;
    const windSpeed = Math.round(daily.wind_speed_10m_max?.[i] ?? 10);
    const et0 = Math.round((daily.et0_fao_evapotranspiration?.[i] ?? 3.5) * 10) / 10;

    let farmRisk = 'low'; // 'low' | 'moderate' | 'high'
    let recommendedEn = '';
    let recommendedHi = '';
    let avoidEn = '';
    let avoidHi = '';

    if (rainProb >= 60 || rainSum >= 8 || code >= 95) {
      farmRisk = 'high';
      recommendedEn = 'Maintain drainage trenches; secure harvested produce';
      recommendedHi = 'जल निकासी नालियां खुली रखें; कटी फसल सुरक्षित ढकें';
      avoidEn = 'Avoid any irrigation and chemical spraying';
      avoidHi = 'सिंचाई और कीटनाशक छिड़काव पूरी तरह टालें';
    } else if (tempMax >= 38) {
      farmRisk = 'high';
      recommendedEn = 'Light evening irrigation to reduce canopy heat';
      recommendedHi = 'फसल को गर्मी से बचाने के लिए शाम को हल्की सिंचाई करें';
      avoidEn = 'Avoid midday field work and harsh chemical sprays';
      avoidHi = 'दोपहर की कड़ी धूप में काम और दवा छिड़कने से बचें';
    } else if (rainProb >= 35 || windSpeed >= 20) {
      farmRisk = 'moderate';
      recommendedEn = 'Early morning hoeing and weed management';
      recommendedHi = 'सुबह के समय निराई-गुड़ाई व खरपतवार नियंत्रण करें';
      avoidEn = 'Avoid foliar spray due to wind drift or wash risk';
      avoidHi = 'हवा व बारिश की संभावना में पत्तियों पर स्प्रे न करें';
    } else {
      farmRisk = 'low';
      recommendedEn = 'Ideal for sowing, top-dressing fertilizer & spraying';
      recommendedHi = 'बुआई, खाद देने व कीटनाशक छिड़काव के लिए सर्वोत्तम दिन';
      avoidEn = 'Avoid over-irrigation beyond soil capacity';
      avoidHi = 'खेत में ज़रूरत से ज़्यादा पानी लगाने से बचें';
    }

    calendar.push({
      date: dateStr,
      dayIndex: i,
      tempMax,
      tempMin,
      rainProb,
      rainSum,
      windSpeed,
      et0,
      farmRisk,
      recommendedEn,
      recommendedHi,
      avoidEn,
      avoidHi
    });
  }

  return calendar;
};

/**
 * 8. Transparent "Why this Recommendation?" Rationale
 * Bridges raw data and farmer intuition
 */
const generateWhyRecommendations = ({ current, daily, irrigation, spray, riskScore }) => {
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const rainSum = daily?.precipitation_sum?.[0] || 0;
  const et0 = daily?.et0_fao_evapotranspiration?.[0] || 3.5;
  const windSpeed = current?.wind_speed_10m || 8;
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature_2m || 30;
  const humidity = current?.relative_humidity_2m || 55;
  const soilMoist = irrigation.metrics?.soilMoisturePercent || 22;

  return [
    {
      topicEn: 'Irrigation Decision',
      topicHi: 'सिंचाई का निर्णय',
      recommendationEn: irrigation.windowEn,
      recommendationHi: irrigation.windowHi,
      status: irrigation.status,
      factors: [
        {
          nameEn: 'Rain Probability',
          nameHi: 'बारिश की संभावना',
          value: `${rainProb}%`,
          impact: rainProb >= 50 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Expected Rainfall',
          nameHi: 'अनुमानित वर्षा',
          value: `${rainSum.toFixed(1)} mm`,
          impact: rainSum >= 5 ? 'warning' : 'neutral'
        },
        {
          nameEn: 'Daily Evaporation (ET0)',
          nameHi: 'दैनिक वाष्पोत्सर्जन (ET0)',
          value: `${et0.toFixed(1)} mm/day`,
          impact: et0 >= 4.0 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Topsoil Moisture',
          nameHi: 'ऊपरी मिट्टी की नमी',
          value: `${soilMoist}%`,
          impact: soilMoist < 18 ? 'warning' : 'positive'
        }
      ],
      conclusionEn: irrigation.reasonEn,
      conclusionHi: irrigation.reasonHi
    },
    {
      topicEn: 'Spraying Window',
      topicHi: 'छिड़काव की अनुकूलता',
      recommendationEn: spray.bestWindowEn,
      recommendationHi: spray.bestWindowHi,
      status: spray.status,
      factors: [
        {
          nameEn: 'Wind Speed',
          nameHi: 'हवा की गति',
          value: `${Math.round(windSpeed)} km/h`,
          impact: windSpeed >= 15 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Peak Daytime Temp',
          nameHi: 'अधिकतम तापमान',
          value: `${Math.round(tempMax)}°C`,
          impact: tempMax >= 33 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Relative Humidity',
          nameHi: 'हवा में नमी',
          value: `${Math.round(humidity)}%`,
          impact: humidity >= 80 || humidity < 35 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Rain Threat',
          nameHi: 'बारिश का खतरा',
          value: `${rainProb}%`,
          impact: rainProb >= 40 ? 'warning' : 'positive'
        }
      ],
      conclusionEn: spray.reasonEn,
      conclusionHi: spray.reasonHi
    },
    {
      topicEn: 'Overall Farm Risk Assessment',
      topicHi: 'समग्र खेत जोखिम विश्लेषण',
      recommendationEn: riskScore.labelEn,
      recommendationHi: riskScore.labelHi,
      status: riskScore.level,
      factors: [
        {
          nameEn: 'Overall Risk Score',
          nameHi: 'कुल जोखिम स्कोर',
          value: `${riskScore.overall} / 100`,
          impact: riskScore.overall >= 50 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Rain Risk',
          nameHi: 'बारिश का जोखिम',
          value: `${riskScore.breakdown.rainRisk}%`,
          impact: riskScore.breakdown.rainRisk >= 50 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Heat Stress Risk',
          nameHi: 'गर्मी का तनाव',
          value: `${riskScore.breakdown.heatRisk}%`,
          impact: riskScore.breakdown.heatRisk >= 50 ? 'warning' : 'positive'
        },
        {
          nameEn: 'Humidity / Fungal Risk',
          nameHi: 'फंगस व बीमारी का जोखिम',
          value: `${riskScore.breakdown.humidityDiseaseRisk}%`,
          impact: riskScore.breakdown.humidityDiseaseRisk >= 50 ? 'warning' : 'positive'
        }
      ],
      conclusionEn: riskScore.summaryEn,
      conclusionHi: riskScore.summaryHi
    }
  ];
};

/**
 * 9. Deterministic Weather Alerts
 * Triggers alerts only when verified mathematical/physical criteria are met
 */
const generateWeatherAlerts = ({ current, daily, irrigation, spray, riskScore }) => {
  const alerts = [];
  const rainProb = daily?.precipitation_probability_max?.[0] || 0;
  const rainSum = daily?.precipitation_sum?.[0] || 0;
  const weatherCode = current?.weather_code || 0;
  const tempMax = daily?.temperature_2m_max?.[0] || current?.temperature_2m || 30;
  const windSpeed = current?.wind_speed_10m || 0;
  const windGust = current?.wind_gusts_10m || windSpeed * 1.3;
  const humidity = current?.relative_humidity_2m || 55;
  const soilMoist = irrigation.metrics?.soilMoisturePercent || 22;

  // 1. Heavy Rain Alert
  if (rainSum >= 15 || (rainProb >= 70 && rainSum >= 8)) {
    alerts.push({
      id: 'heavy_rain',
      type: 'heavy_rain',
      severity: 'danger',
      titleEn: '🌧️ Heavy Rain Warning',
      titleHi: '🌧️ भारी बारिश की चेतावनी',
      messageEn: `Expected precipitation of ${rainSum.toFixed(1)} mm with ${rainProb}% certainty. Clear drainage exits immediately; suspend harvest drying.`,
      messageHi: `लगभग ${rainSum.toFixed(1)} मिमी वर्षा की संभावना (${rainProb}% आशंका)। खेत से पानी निकलने का रास्ता खोलें और कटी फसल सुरक्षित स्थान पर रखें।`,
      metrics: `${rainSum.toFixed(1)} mm | ${rainProb}%`
    });
  }

  // 2. Heat Stress Alert
  if (tempMax >= 38) {
    alerts.push({
      id: 'heat_stress',
      type: 'heat_stress',
      severity: 'warning',
      titleEn: '🔥 High Heat Stress Alert',
      titleHi: '🔥 तेज गर्मी व लू की चेतावनी',
      messageEn: `Maximum temperature forecasted to reach ${Math.round(tempMax)}°C. Irrigate lightly in evening to cool root zone; provide ample water and shade to farm livestock.`,
      messageHi: `अधिकतम तापमान ${Math.round(tempMax)}°C तक जाने की संभावना। शाम को हल्की सिंचाई करें और पशुओं को धूप से बचाकर स्वच्छ पानी पिलाएं।`,
      metrics: `${Math.round(tempMax)}°C`
    });
  }

  // 3. Strong Wind / Gale Alert
  if (windSpeed >= 20 || windGust >= 35) {
    alerts.push({
      id: 'strong_wind',
      type: 'strong_wind',
      severity: 'warning',
      titleEn: '💨 Strong Gusty Wind Advisory',
      titleHi: '💨 तेज़ हवाओं व झोंकों की चेतावनी',
      messageEn: `Wind speeds reaching ${Math.round(windSpeed)} km/h (gusts up to ${Math.round(windGust)} km/h). Severe spray drift danger; do not irrigate tall crops to prevent lodging.`,
      messageHi: `हवा की गति ${Math.round(windSpeed)} किमी/घंटा (झोंके ${Math.round(windGust)} किमी/घंटा)। छिड़काव न करें और लंबी फसलों में पानी न लगाएं ताकि फसल गिरे नहीं।`,
      metrics: `${Math.round(windSpeed)} km/h`
    });
  }

  // 4. Thunderstorm Alert
  if (weatherCode >= 95) {
    alerts.push({
      id: 'thunderstorm',
      type: 'storm',
      severity: 'danger',
      titleEn: '⛈️ Thunderstorm & Squall Warning',
      titleHi: '⛈️ आंधी-तूफान व गरज-चमक की चेतावनी',
      messageEn: 'Severe convective storm detected. Do not stand near metal poles or trees; halt tractor operations and take shelter indoors.',
      messageHi: 'आंधी और बिजली कड़कने की चेतावनी। खुले खेत में काम बंद करें और बिजली के खंभों या पेड़ों के नीचे खड़े न हों।',
      metrics: 'Code ' + weatherCode
    });
  }

  // 5. Fungal Disease Incubation Alert
  if (humidity >= 78 && tempMax >= 18 && tempMax <= 28) {
    alerts.push({
      id: 'disease_risk',
      type: 'disease_risk',
      severity: 'warning',
      titleEn: '🦠 Fungal Disease Spore Germination Risk',
      titleHi: '🦠 फफूंद व रोग संक्रमण का संवेदनशील मौसम',
      messageEn: `High ambient humidity (${humidity}%) at ${Math.round(tempMax)}°C provides prime conditions for rust, blight, and mildew. Monitor leaf undersides closely.`,
      messageHi: `हवा में अत्यधिक नमी (${humidity}%) और संतुलित तापमान में फंगस/झुलसा तेजी से पनपता है। पत्तियों के नीचे ध्यान से जांच करें।`,
      metrics: `${humidity}% RH`
    });
  }

  // 6. Good Spray Window Alert (positive alert)
  if (spray.status === 'optimal' && alerts.length === 0) {
    alerts.push({
      id: 'spray_window',
      type: 'spray_window',
      severity: 'success',
      titleEn: '🧪 Prime Agrochemical Spray Window Active',
      titleHi: '🧪 कीटनाशक/पोषक तत्व छिड़काव का सबसे अनुकूल समय',
      messageEn: `Calm wind (${Math.round(windSpeed)} km/h) and dry weather. Excellent adherence and efficiency for foliar spray until 10:30 AM.`,
      messageHi: `शांत हवा (${Math.round(windSpeed)} किमी/घंटा) और साफ़ मौसम। सुबह 10:30 बजे तक किसी भी आवश्यक स्प्रे के लिए बहुत अच्छा समय।`,
      metrics: `${Math.round(windSpeed)} km/h wind`
    });
  }

  // 7. Irrigation Opportunity Alert
  if (irrigation.status === 'irrigate_now') {
    alerts.push({
      id: 'irrigation_opp',
      type: 'irrigation_opp',
      severity: 'info',
      titleEn: '💧 Timely Irrigation Opportunity',
      titleHi: '💧 खेत में सिंचाई का उत्तम अवसर',
      messageEn: `Soil moisture is low (${soilMoist}%) and no rain forecasted. Apply scheduled water during cool morning or evening hours.`,
      messageHi: `मिट्टी में नमी कम (${soilMoist}%) है और बारिश नहीं है। सुबह या शाम को खेत में पानी लगाना लाभकारी रहेगा।`,
      metrics: `${soilMoist}% Moisture`
    });
  }

  return alerts;
};

/**
 * Main Deterministic Engine orchestrator
 */
const runFarmIntelligenceEngine = ({ current, hourly, daily, crops = [] }) => {
  const irrigation = calculateIrrigationIntelligence({ current, hourly, daily, crops });
  const spray = calculateSprayWindow({ current, hourly, daily });
  const fieldWork = calculateFieldWorkWindow({ current, daily, irrigation, spray });
  const riskScore = calculateRiskScore({ current, daily });
  const cropRisk = calculateCropWeatherRisk({ current, daily, crops });
  const todayPlan = generateTodayPlan({ current, hourly, daily, irrigation, spray, riskScore, crops });
  const smartFarmClock = generateSmartFarmClock({ hourly });
  const farmCalendar = generate7DayCalendar({ daily, crops });
  const whyRecommendations = generateWhyRecommendations({ current, daily, irrigation, spray, riskScore });
  const alerts = generateWeatherAlerts({ current, daily, irrigation, spray, riskScore });

  return {
    irrigation,
    sprayWindow: spray,
    fieldWork,
    riskScore,
    cropRisk,
    todayPlan,
    smartFarmClock,
    farmCalendar,
    whyRecommendations,
    alerts
  };
};

module.exports = {
  runFarmIntelligenceEngine,
  calculateIrrigationIntelligence,
  calculateSprayWindow,
  calculateFieldWorkWindow,
  calculateRiskScore,
  calculateCropWeatherRisk,
  generateTodayPlan,
  generateSmartFarmClock,
  generate7DayCalendar,
  generateWhyRecommendations,
  generateWeatherAlerts,
  matchCrop
};
