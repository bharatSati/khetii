const Groq = require('groq-sdk');

// Cache AI briefings in memory (15 min TTL) to avoid wasteful repetitive LLM calls
const aiBriefingCache = new Map();
const BRIEFING_CACHE_TTL_MS = 15 * 60 * 1000;

const isGroqConfigured = () => {
  const isEnabled = process.env.GROQ_AI_ENABLED !== 'false';
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  return isEnabled && hasKey;
};

const getGroqClient = () => {
  if (!isGroqConfigured()) return null;
  return new Groq({
    apiKey: process.env.GROQ_API_KEY.trim()
  });
};

const getModelName = () => {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
};

/**
 * Deterministic AI Briefing Generator (Bulletproof fallback when Groq is unset or unreachable)
 */
const generateDeterministicBriefing = ({ weatherData, farmContext, lang = 'hi' }) => {
  const isHindi = lang.startsWith('hi');
  const intel = weatherData.farmIntelligence || {};
  const irrigation = intel.irrigation || {};
  const spray = intel.sprayWindow || {};
  const risk = intel.riskScore || {};
  const current = weatherData.current || {};
  const crops = farmContext.mainCrops?.length > 0 ? farmContext.mainCrops.join(', ') : (isHindi ? 'गेहूं, सरसों, धान' : 'Wheat, Mustard, Paddy');
  const location = `${farmContext.district || farmContext.city || 'Delhi'}, ${farmContext.state || 'India'}`;

  const headline = isHindi
    ? `आज का खेत परामर्श (${location}) - ${risk.labelHi || 'सामान्य मौसम'}`
    : `Today's Farm Briefing (${location}) - ${risk.labelEn || 'Stable Conditions'}`;

  const summary = isHindi
    ? `वर्तमान तापमान ${current.temperature}°C है। ${irrigation.reasonHi || ''} ${spray.bestWindowHi ? 'छिड़काव: ' + spray.bestWindowHi : ''}`
    : `Current temperature is ${current.temperature}°C. ${irrigation.reasonEn || ''} ${spray.bestWindowEn ? 'Spraying window: ' + spray.bestWindowEn : ''}`;

  const priority = risk.overall >= 60 ? 'HIGH' : risk.overall >= 30 ? 'MEDIUM' : 'NORMAL';

  const actionsNow = (intel.todayPlan?.doNow || []).map((item) => (isHindi ? item.titleHi : item.titleEn));
  if (actionsNow.length === 0) {
    actionsNow.push(isHindi ? 'सुबह खेत का मुआयना करें' : 'Conduct morning field inspection');
  }

  const avoidToday = (intel.todayPlan?.avoid || []).map((item) => (isHindi ? item.titleHi : item.titleEn));
  if (avoidToday.length === 0) {
    avoidToday.push(isHindi ? 'दोपहर की कड़ी धूप में छिड़काव न करें' : 'Avoid midday chemical spraying');
  }

  const tomorrowForecast = weatherData.forecast?.[1];
  const tomorrowPlan = tomorrowForecast
    ? isHindi
      ? `कल अधिकतम तापमान ${tomorrowForecast.tempMax}°C व बारिश की संभावना ${tomorrowForecast.rainProb}% रहेगी। ${tomorrowForecast.recommendedHi || 'सामान्य कृषि कार्य जारी रखें।'}`
      : `Tomorrow's high will be ${tomorrowForecast.tempMax}°C with ${tomorrowForecast.rainProb}% rain probability. ${tomorrowForecast.recommendedEn || 'Continue routine operations.'}`
    : isHindi
      ? 'कल सामान्य कृषि कार्य जारी रखें।'
      : 'Continue routine field management tomorrow.';

  const cropAdvice = (intel.cropRisk || []).map((cr) => ({
    crop: isHindi ? cr.cropHi : cr.crop,
    status: cr.riskLevel,
    advice: isHindi ? cr.advisoryHi : cr.advisoryEn
  }));

  const alerts = (intel.alerts || []).map((a) => (isHindi ? a.titleHi : a.titleEn));

  const reasoning = isHindi
    ? `सिफारिशें वर्षा संभावना (${irrigation.metrics?.rainProb || 0}%), हवा की गति (${spray.metrics?.currentWindKmH || 0} किमी/घंटा), और दैनिक वाष्पोत्सर्जन (${irrigation.metrics?.et0 || 0} मिमी) के वैज्ञानिक विश्लेषण पर आधारित हैं।`
    : `Recommendations are derived from live rain probability (${irrigation.metrics?.rainProb || 0}%), wind speed (${spray.metrics?.currentWindKmH || 0} km/h), and ET0 evapotranspiration (${irrigation.metrics?.et0 || 0} mm/day).`;

  return {
    headline,
    summary,
    priority,
    actionsNow,
    avoidToday,
    tomorrowPlan,
    cropAdvice,
    alerts,
    reasoning,
    source: 'deterministic_engine'
  };
};

/**
 * Generate Structured AI Daily Briefing via Groq
 */
const generateStructuredAiBriefing = async ({ weatherData, farmContext = {}, lang = 'hi' }) => {
  const isHindi = lang.startsWith('hi');
  const cacheKey = `${weatherData.location?.latitude?.toFixed(2)}_${weatherData.location?.longitude?.toFixed(2)}_${(farmContext.mainCrops || []).join('-')}_${isHindi ? 'hi' : 'en'}`;

  const cached = aiBriefingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < BRIEFING_CACHE_TTL_MS) {
    return cached.data;
  }

  const groq = getGroqClient();
  if (!groq) {
    const fallback = generateDeterministicBriefing({ weatherData, farmContext, lang });
    aiBriefingCache.set(cacheKey, { timestamp: Date.now(), data: fallback });
    return fallback;
  }

  try {
    const intel = weatherData.farmIntelligence || {};
    const contextPrompt = {
      location: `${farmContext.district || farmContext.city || 'Delhi'}, ${farmContext.state || 'India'} (Lat: ${weatherData.location?.latitude}, Lon: ${weatherData.location?.longitude})`,
      farmSizeAcres: farmContext.landSizeAcres || 'Not specified',
      mainCrops: farmContext.mainCrops || ['Wheat', 'Mustard', 'Paddy'],
      language: isHindi ? 'Hindi (हिन्दी)' : 'English',
      liveWeather: {
        temp: weatherData.current?.temperature,
        feelsLike: weatherData.current?.feelsLike,
        humidity: weatherData.current?.humidity,
        windSpeed: weatherData.current?.windSpeed,
        condition: isHindi ? weatherData.current?.conditionHi : weatherData.current?.condition,
        soilMoisture: weatherData.current?.soilMoisture,
        et0: weatherData.current?.et0,
        rainProbToday: weatherData.forecast?.[0]?.rainProb
      },
      deterministicIntelligence: {
        irrigationStatus: intel.irrigation?.status,
        irrigationWindow: isHindi ? intel.irrigation?.windowHi : intel.irrigation?.windowEn,
        irrigationReason: isHindi ? intel.irrigation?.reasonHi : intel.irrigation?.reasonEn,
        sprayStatus: intel.sprayWindow?.status,
        sprayWindow: isHindi ? intel.sprayWindow?.bestWindowHi : intel.sprayWindow?.bestWindowEn,
        farmRiskScore: intel.riskScore?.overall,
        farmRiskLevel: intel.riskScore?.level
      }
    };

    const systemPrompt = `You are Khetii's Chief Agricultural Meteorologist and Agronomy Advisor for Indian farmers.
Your job is to provide an empowering, practical, realistic daily agricultural advisory tailored to the farmer's crops and weather.
STRICT RULES:
1. NEVER invent or hallucinate weather data. Rely ONLY on the verified meteorological parameters provided in the context.
2. Provide output in ${isHindi ? 'clear, respectful Hindi (Devanagari script)' : 'simple, clear English'}.
3. Respond ONLY with a valid JSON object matching the requested schema. No markdown formatting outside the JSON, no backticks, no preamble.

Schema:
{
  "headline": "Brief catchy 1-line headline",
  "summary": "2-3 sentences summarising what the farmer should do today based on weather",
  "priority": "NORMAL" | "MEDIUM" | "HIGH",
  "actionsNow": ["Action 1", "Action 2"],
  "avoidToday": ["Avoid 1", "Avoid 2"],
  "tomorrowPlan": "1-2 sentences on tomorrow's preparation",
  "cropAdvice": [
    { "crop": "Crop Name", "status": "low" | "moderate" | "high", "advice": "Specific weather-based advice" }
  ],
  "alerts": ["Alert text if severe weather, else empty array"],
  "reasoning": "Clear 1-2 sentence explanation of why these decisions were reached using the rain/wind/ET0 data"
}`;

    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(contextPrompt) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    // Validate structured fields
    if (parsed && parsed.headline && parsed.summary && Array.isArray(parsed.actionsNow)) {
      const result = {
        headline: parsed.headline,
        summary: parsed.summary,
        priority: parsed.priority || 'NORMAL',
        actionsNow: parsed.actionsNow,
        avoidToday: Array.isArray(parsed.avoidToday) ? parsed.avoidToday : [],
        tomorrowPlan: parsed.tomorrowPlan || '',
        cropAdvice: Array.isArray(parsed.cropAdvice) ? parsed.cropAdvice : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        reasoning: parsed.reasoning || '',
        source: 'groq_ai'
      };
      aiBriefingCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    throw new Error('Groq structured JSON validation failed');
  } catch (err) {
    console.warn('Groq AI briefing error (using deterministic fallback):', err.message);
    const fallback = generateDeterministicBriefing({ weatherData, farmContext, lang });
    return fallback;
  }
};

/**
 * Interactive AI Farm Advisor Q&A (Answers farmer's specific question)
 */
const askAiFarmAdvisor = async ({ query, weatherData, farmContext = {}, lang = 'hi' }) => {
  const isHindi = lang.startsWith('hi');
  const userQuery = (query || '').trim();

  if (!userQuery) {
    return {
      answer: isHindi ? 'कृपया अपना प्रश्न पूछें।' : 'Please ask a question regarding your farm weather.',
      priority: 'NORMAL',
      directAction: '',
      why: '',
      warning: ''
    };
  }

  const groq = getGroqClient();
  const intel = weatherData.farmIntelligence || {};
  const irrigation = intel.irrigation || {};
  const spray = intel.sprayWindow || {};
  const current = weatherData.current || {};
  const crops = farmContext.mainCrops?.length > 0 ? farmContext.mainCrops.join(', ') : (isHindi ? 'मुख्य फसलें' : 'Main crops');

  // Fallback answer generator if Groq is not configured or fails
  const getDeterministicAnswer = () => {
    const qLower = userQuery.toLowerCase();
    let answer = '';
    let directAction = '';
    let why = '';
    let warning = '';
    let priority = 'NORMAL';

    if (qLower.includes('पानी') || qLower.includes('सिंचाई') || qLower.includes('irrigate') || qLower.includes('water')) {
      if (irrigation.status === 'skip' || irrigation.status === 'postpone') {
        answer = isHindi
          ? `आज खेत में पानी लगाने की आवश्यकता नहीं है। ${irrigation.reasonHi}`
          : `Irrigation is not recommended today. ${irrigation.reasonEn}`;
        directAction = isHindi ? 'सिंचाई टालें' : 'Postpone irrigation';
        why = isHindi ? irrigation.reasonHi : irrigation.reasonEn;
        warning = isHindi ? 'अनावश्यक पानी लगाने से जड़ गलन और खाद बहने का खतरा है।' : 'Excess water risks root rot and nutrient leaching.';
      } else {
        answer = isHindi
          ? `हाँ, आप पानी लगा सकते हैं। ${irrigation.windowHi}। ${irrigation.reasonHi}`
          : `Yes, you can irrigate. ${irrigation.windowEn}. ${irrigation.reasonEn}`;
        directAction = isHindi ? irrigation.windowHi : irrigation.windowEn;
        why = isHindi ? irrigation.reasonHi : irrigation.reasonEn;
      }
    } else if (qLower.includes('स्प्रे') || qLower.includes('दवा') || qLower.includes('कीटनाशक') || qLower.includes('spray') || qLower.includes('pesticide')) {
      if (spray.status === 'unsafe') {
        answer = isHindi
          ? `आज किसी भी दवा या कीटनाशक का छिड़काव न करें। ${spray.reasonHi}`
          : `Do not spray agrochemicals today. ${spray.reasonEn}`;
        directAction = isHindi ? 'स्प्रे स्थगित रखें' : 'Suspend spraying';
        why = isHindi ? spray.reasonHi : spray.reasonEn;
        warning = isHindi ? 'हवा या बारिश से दवा धुल जाएगी या बह जाएगी।' : 'Wind or rain will wash off or drift chemicals.';
        priority = 'HIGH';
      } else {
        answer = isHindi
          ? `छिड़काव के लिए सर्वोत्तम समय: ${spray.bestWindowHi}। ${spray.reasonHi}`
          : `Best spray window: ${spray.bestWindowEn}. ${spray.reasonEn}`;
        directAction = isHindi ? spray.bestWindowHi : spray.bestWindowEn;
        why = isHindi ? spray.reasonHi : spray.reasonEn;
      }
    } else if (qLower.includes('बारिश') || qLower.includes('rain') || qLower.includes('कल')) {
      const tomorrow = weatherData.forecast?.[1] || {};
      answer = isHindi
        ? `कल बारिश की संभावना ${tomorrow.rainProb ?? 0}% है। अधिकतम तापमान ${tomorrow.tempMax ?? 30}°C रहेगा। ${tomorrow.recommendedHi || 'मौसम सामान्य रहने की उम्मीद है।'}`
        : `Tomorrow's rain probability is ${tomorrow.rainProb ?? 0}%. High of ${tomorrow.tempMax ?? 30}°C. ${tomorrow.recommendedEn || 'Weather expected to remain stable.'}`;
      directAction = tomorrow.rainProb >= 50
        ? (isHindi ? 'नालियां साफ़ रखें' : 'Clear field drainage')
        : (isHindi ? 'सामान्य कार्य जारी रखें' : 'Continue planned work');
      why = isHindi
        ? `अनुमानित वर्षा: ${tomorrow.rainSum ?? 0} मिमी, हवा: ${tomorrow.windSpeed ?? 0} किमी/घंटा।`
        : `Expected rain: ${tomorrow.rainSum ?? 0} mm, wind: ${tomorrow.windSpeed ?? 0} km/h.`;
    } else if (qLower.includes('3 दिन') || qLower.includes('3 days') || qLower.includes('हफ्ता') || qLower.includes('week')) {
      const next3 = (weatherData.forecast || []).slice(0, 3).map((d, i) => {
        const dayLabel = i === 0 ? (isHindi ? 'आज' : 'Today') : i === 1 ? (isHindi ? 'कल' : 'Tomorrow') : (isHindi ? 'परसों' : 'Day 3');
        return `${dayLabel}: ${d.tempMax}°C, बारिश ${d.rainProb}% (${isHindi ? d.recommendedHi : d.recommendedEn})`;
      }).join(' | ');
      answer = isHindi
        ? `अगले 3 दिनों का कृषि परिदृश्य: ${next3}`
        : `Next 3 days outlook: ${next3}`;
      directAction = isHindi ? 'दैनिक मौसम अनुसार कार्य करें' : 'Follow daily weather cues';
      why = isHindi ? 'आगामी 72 घंटों के मौसम मॉडल के आधार पर।' : 'Based on 72-hour forecast projection.';
    } else {
      answer = isHindi
        ? `वर्तमान में खेत का तापमान ${current.temperature}°C है। आज का मुख्य सुझाव: ${irrigation.status === 'skip' ? 'सिंचाई न करें' : 'हल्की सिंचाई अनुकूल'} व ${spray.status === 'optimal' ? 'सुबह स्प्रे अनुकूल है' : 'दोपहर में स्प्रे से बचें'}।`
        : `Current field temperature is ${current.temperature}°C. Key advice today: ${irrigation.status === 'skip' ? 'skip irrigation' : 'irrigation is favorable'} and ${spray.status === 'optimal' ? 'morning spray is optimal' : 'avoid midday spray'}.`;
      directAction = (intel.todayPlan?.doNow?.[0]) ? (isHindi ? intel.todayPlan.doNow[0].titleHi : intel.todayPlan.doNow[0].titleEn) : '';
      why = isHindi ? (intel.whyRecommendations?.[0]?.conclusionHi || '') : (intel.whyRecommendations?.[0]?.conclusionEn || '');
    }

    return {
      answer,
      priority,
      directAction,
      why,
      warning,
      source: 'deterministic_engine'
    };
  };

  if (!groq) {
    return getDeterministicAnswer();
  }

  try {
    const systemPrompt = `You are "Khetii AI" - Senior Indian Agricultural Advisor and Agri-Meteorologist.
Farmer query: "${userQuery}"
Farmer location: ${farmContext.district || farmContext.city || 'Delhi'}, ${farmContext.state || 'India'}
Farm size: ${farmContext.landSizeAcres || 0} acres
Farmer crops: ${crops}
Selected language: ${isHindi ? 'Hindi (हिन्दी)' : 'English'}

LIVE VERIFIED WEATHER DATA (DO NOT HALLUCINATE OR CONTRADICT THIS DATA):
- Current temp: ${current.temperature}°C, Feels like: ${current.feelsLike}°C
- Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h
- Today rain probability: ${weatherData.forecast?.[0]?.rainProb}%
- Today expected rain: ${weatherData.forecast?.[0]?.rainSum || 0} mm
- Tomorrow rain probability: ${weatherData.forecast?.[1]?.rainProb}%
- Irrigation calculated status: ${irrigation.status} (Reason: ${irrigation.reasonEn})
- Spray window calculated status: ${spray.status} (Reason: ${spray.reasonEn})
- Farm Risk Score: ${intel.riskScore?.overall}/100 (${intel.riskScore?.level})

CRITICAL INSTRUCTIONS:
1. Answer the farmer's question directly, practically, and empathetically.
2. If asking about irrigation, explicitly state whether to irrigate and explain the rainfall/evapotranspiration reasons.
3. If asking about spraying, provide safe wind and temperature timeframes.
4. Keep the explanation grounded in the live numbers above.
5. Respond in ${isHindi ? 'simple conversational Hindi (Devanagari script)' : 'simple conversational English'}.
6. Respond with a valid JSON object matching:
{
  "answer": "Clear, friendly direct answer (2-4 sentences)",
  "priority": "NORMAL" | "MEDIUM" | "HIGH",
  "directAction": "Single immediate actionable takeaway",
  "why": "Brief explanation citing live weather parameters",
  "warning": "Safety or caution note if any, else empty string"
}`;

    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content);
    if (parsed && parsed.answer) {
      return {
        answer: parsed.answer,
        priority: parsed.priority || 'NORMAL',
        directAction: parsed.directAction || '',
        why: parsed.why || '',
        warning: parsed.warning || '',
        source: 'groq_ai'
      };
    }

    return getDeterministicAnswer();
  } catch (err) {
    console.warn('Groq AI advisor answer error (using deterministic fallback):', err.message);
    return getDeterministicAnswer();
  }
};

module.exports = {
  generateStructuredAiBriefing,
  askAiFarmAdvisor,
  generateDeterministicBriefing,
  isGroqConfigured
};
