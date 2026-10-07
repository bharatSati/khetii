const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

/**
 * Check if Gemini AI is configured
 */
const isGeminiConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
};

/**
 * Check if Groq AI is configured (as secondary provider)
 */
const isGroqConfigured = () => {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
};

/**
 * Fast deterministic language detector (Hindi vs Hinglish vs English)
 */
const detectLanguageStyle = (text) => {
  if (!text || typeof text !== 'string') return 'english';
  const trimmed = text.trim();

  // 1. Check for Devanagari Unicode range
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return 'hindi';
  }

  // 2. Common Romanized Hindi (Hinglish) tokens
  const hinglishTokens = new Set([
    'kya', 'kare', 'karein', 'kaise', 'hoga', 'hogi', 'rahe', 'raha', 'rahi',
    'hai', 'hain', 'mein', 'me', 'ke', 'ki', 'ka', 'ko', 'se', 'paani', 'pani',
    'khet', 'kheti', 'dawa', 'dawakhana', 'patte', 'patti', 'pattiyan', 'pili',
    'peele', 'peela', 'kharab', 'rog', 'keeda', 'kida', 'ped', 'paudha', 'paudhe',
    'batao', 'lag', 'gaya', 'gayi', 'dalu', 'daalein', 'spray', 'tamatar',
    'sarson', 'dhan', 'gehu', 'aloo', 'kisaan', 'chahiye', 'bhai', 'sabji',
    'sukh', 'sukha', 'jhulsa', 'mahu', 'ilaj', 'upay', 'dalna', 'kaatna', 'mar'
  ]);

  const words = trimmed.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
  let matchCount = 0;
  for (const w of words) {
    if (hinglishTokens.has(w)) matchCount++;
  }

  if (matchCount >= 2 || (words.length <= 4 && matchCount >= 1)) {
    return 'hinglish';
  }

  return 'english';
};

/**
 * Extract keywords, crop, symptoms and semantic search terms from a rough farmer query.
 * Flow:
 * 1. Primary: Google Gemini API (if GEMINI_API_KEY configured)
 * 2. Secondary: Groq API (if GROQ_API_KEY configured)
 * 3. Fallback: Fast deterministic semantic rule engine
 */
const extractKeywordsWithAI = async (rawQuery) => {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      detectedLanguage: 'english',
      detectedCrop: null,
      detectedCategory: null,
      symptoms: [],
      searchKeywords: [],
      isAgriculturalQuery: false
    };
  }

  const cleanQuery = rawQuery.trim();
  const ruleBasedLang = detectLanguageStyle(cleanQuery);

  const extractionPrompt = `You are an expert AI agronomist analyzing raw queries from Indian farmers.
Farmers often describe problems in rough Hinglish (e.g. "tamatar ke patte peele pad ke mud rahe hai kya daalu"), Hindi (Devanagari), or English.

Farmer Query: "${cleanQuery}"

TASK:
1. Detect user's language style: "hinglish" (Roman Hindi), "hindi" (Devanagari), or "english".
2. Identify the specific crop (e.g. "Tomato", "Potato", "Mustard", "Rice / Paddy", "Wheat", "Chilli", "Brinjal", "Cotton", etc.) or null.
3. Identify category: "Pest & Insect Control", "Disease & Fungus Control", "Nutrient & Fertilizer Management", "Seed Varieties & Sowing", "Weed Management", "Animal Health & Breeding", or null.
4. Extract observed symptoms (e.g. ["yellow leaves", "leaf curl", "drying"]).
5. Generate a list of targeted English search keywords and synonyms specifically suited to find matching historical records in the Indian Kisan Call Centre (KCC) dataset (e.g. ["tomato", "yellow leaf curl", "curl virus", "whitefly", "rogor", "dimethoate"]).
6. Determine if this is an agricultural/farming-related question (boolean).

Respond STRICTLY in JSON:
{
  "detectedLanguage": "hinglish" | "hindi" | "english",
  "detectedCrop": "Crop Name" or null,
  "detectedCategory": "Category Name" or null,
  "symptoms": ["symptom1", "symptom2"],
  "primaryProblem": "brief description of problem in English",
  "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "isAgriculturalQuery": true
}`;

  // 1. Try Gemini
  if (isGeminiConfigured()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const result = await model.generateContent(extractionPrompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.searchKeywords) && parsed.searchKeywords.length > 0) {
        return {
          detectedLanguage: parsed.detectedLanguage || ruleBasedLang,
          detectedCrop: parsed.detectedCrop || null,
          detectedCategory: parsed.detectedCategory || null,
          symptoms: parsed.symptoms || [],
          primaryProblem: parsed.primaryProblem || '',
          searchKeywords: parsed.searchKeywords,
          isAgriculturalQuery: parsed.isAgriculturalQuery !== false,
          provider: 'gemini'
        };
      }
    } catch (err) {
      console.warn('[Gemini Service] Gemini keyword extraction failed, trying fallback:', err.message);
    }
  }

  // 2. Try Groq as secondary LLM
  if (isGroqConfigured()) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an agricultural keyword extraction engine. Always output valid JSON only.' },
          { role: 'user', content: extractionPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 350
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content);
      if (parsed && Array.isArray(parsed.searchKeywords) && parsed.searchKeywords.length > 0) {
        return {
          detectedLanguage: parsed.detectedLanguage || ruleBasedLang,
          detectedCrop: parsed.detectedCrop || null,
          detectedCategory: parsed.detectedCategory || null,
          symptoms: parsed.symptoms || [],
          primaryProblem: parsed.primaryProblem || '',
          searchKeywords: parsed.searchKeywords,
          isAgriculturalQuery: parsed.isAgriculturalQuery !== false,
          provider: 'groq'
        };
      }
    } catch (err) {
      console.warn('[Gemini Service] Groq fallback keyword extraction failed:', err.message);
    }
  }

  // 3. Deterministic rule-based extraction
  return {
    detectedLanguage: ruleBasedLang,
    detectedCrop: null,
    detectedCategory: null,
    symptoms: [],
    primaryProblem: cleanQuery,
    searchKeywords: cleanQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    isAgriculturalQuery: true,
    provider: 'rule-based'
  };
};

/**
 * Synthesize Farmer Advisory strictly in the farmer's native language style (Hinglish / Hindi / English).
 * Clearly explains:
 * 1. Match Accuracy percentage (e.g. 88% vs 25%)
 * 2. Whether the record was found in the official Kisan Call Centre (KCC) dataset or not.
 * 3. Exact diagnosis & action steps.
 * 4. Official Kisan Call Centre Toll-Free helpline (1800-180-1551).
 */
const synthesizeAdvisoryInUserLanguage = async ({
  rawQuery,
  detectedLanguage = 'hinglish',
  results = [],
  matchAccuracy = 0,
  isAvailableInKcc = true,
  detectedCrop = null,
  detectedCategory = null
}) => {
  const langStyle = detectedLanguage || detectLanguageStyle(rawQuery);
  const isHinglish = langStyle === 'hinglish';
  const isHindi = langStyle === 'hindi';
  const isEnglish = !isHinglish && !isHindi;

  // Build deterministic fallback in the corresponding language style
  const buildDeterministicResponse = () => {
    let explanation = '';
    let actionSteps = [];
    let matchNote = '';

    const top = results[0];
    const second = results[1];

    if (isAvailableInKcc && top) {
      if (isHinglish) {
        matchNote = `🎯 KCC Match Accuracy: ${matchAccuracy}% (Satyapit KCC Advisory Record Mil Gaya Hai)`;
        explanation = `Aapke dwara batayi gayi samasya ke liye Kisan Call Centre (KCC) ke official record ke anusaar prathmik salah ye hai: "${top.answer}". ${second ? 'Atirikt salah: ' + second.answer : ''}`;
        actionSteps = [
          top.answer,
          second?.answer || 'Khet me niyamit roop se rog ke lakshano ki jaanch karein aur dawai ka chhidkaav subah ya shaam ke samay karein.'
        ];
      } else if (isHindi) {
        matchNote = `🎯 KCC मैच सटीकता: ${matchAccuracy}% (सत्यापित केसीसी रिकॉर्ड उपलब्ध)`;
        explanation = `किसान कॉल सेंटर (KCC) के सत्यापित आंकड़ों के अनुसार, इस समस्या का प्राथमिक समाधान: "${top.answer}" है। ${second ? 'अतिरिक्त परामर्श: ' + second.answer : ''}`;
        actionSteps = [
          top.answer,
          second?.answer || 'रासायनिक दवा का छिड़काव अनुशंसित मात्रा में सुबह या शाम के समय ही करें।'
        ];
      } else {
        matchNote = `🎯 KCC Match Accuracy: ${matchAccuracy}% (Verified Kisan Call Centre Record Found)`;
        explanation = `According to verified Kisan Call Centre (KCC) records, the primary recommended action is: "${top.answer}". ${second ? 'Supplementary advisory: ' + second.answer : ''}`;
        actionSteps = [
          top.answer,
          second?.answer || 'Apply recommended chemicals only in prescribed doses during morning or evening hours.'
        ];
      }
    } else {
      // NOT available in KCC / Low accuracy
      if (isHinglish) {
        matchNote = `⚠️ KCC Database Match: ${matchAccuracy}% (Is exact samasya ka direct KCC record uplabdh nahi hai)`;
        explanation = `Kisan Call Centre ke 1.7 lakh+ call records me is specific sawal ka direct match nahi mila (Accuracy: ${matchAccuracy}%). Ho sakta hai ye kheti se juda na ho ya kisi anya vishisht bimari ka mamla ho. Niche di gayi samanya kheti salah dekhein ya KCC toll-free helpline par call karein.`;
        actionSteps = [
          'Nazdeeki Krishi Vigyan Kendra (KVK) ya Block Krishi Adhikari se sampark karein.',
          'Kisan Call Centre ke toll-free number 1800-180-1551 par call karke kheti visheshagya se seedhi baat karein.'
        ];
      } else if (isHindi) {
        matchNote = `⚠️ KCC डेटाबेस मैच: ${matchAccuracy}% (इस विशिष्ट समस्या का सीधा केसीसी रिकॉर्ड उपलब्ध नहीं है)`;
        explanation = `किसान कॉल सेंटर के 1.7 लाख+ ऐतिहासिक रिकॉर्ड्स में इस विशिष्ट प्रश्न का सीधा मिलान नहीं मिला (सटीकता: ${matchAccuracy}%)। विस्तृत परामर्श के लिए नीचे दिए गए टोल-फ्री नंबर पर कॉल करें।`;
        actionSteps = [
          'अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या खंड कृषि अधिकारी से संपर्क करें।',
          'किसान कॉल सेंटर के टोल-फ्री नंबर 1800-180-1551 पर कॉल करके कृषि वैज्ञानिक से सीधी सलाह लें।'
        ];
      } else {
        matchNote = `⚠️ KCC Database Match: ${matchAccuracy}% (No direct KCC record found for this specific inquiry)`;
        explanation = `No direct historical record matched this specific query in the 1.7 Lakh+ Kisan Call Centre records (Accuracy: ${matchAccuracy}%). Please contact your local agricultural extension center or call the KCC toll-free helpline.`;
        actionSteps = [
          'Consult your nearest Krishi Vigyan Kendra (KVK) or local Agricultural Extension Officer.',
          'Call the official Kisan Call Centre toll-free helpline at 1800-180-1551 to speak with an agricultural expert.'
        ];
      }
    }

    return {
      matchAccuracy,
      matchQuality: isAvailableInKcc ? (matchAccuracy >= 70 ? 'high' : 'moderate') : 'low',
      isAvailableInKcc,
      languageStyle: langStyle,
      matchNote,
      explanation,
      actionSteps,
      sourceNote: isHinglish
        ? 'Kisan Call Centre (Govt of India) Historical Data'
        : isHindi
        ? 'किसान कॉल सेंटर (भारत सरकार) ऐतिहासिक डेटाबेस'
        : 'Kisan Call Centre (Govt of India) Historical Dataset',
      kccHelpline: '1800-180-1551',
      disclaimer: isHinglish
        ? 'Ye salah historical KCC records par aadharit hai. Khet me dawai dalne se pehle dose apne local KVK se verify karein.'
        : isHindi
        ? 'यह परामर्श ऐतिहासिक केसीसी रिकॉर्ड पर आधारित है। रासायनिक दवाओं का उपयोग करने से पहले स्थानीय केवीके से खुराक सत्यापित करें।'
        : 'This advisory is derived from historical KCC call records. Always verify exact dosages with your local KVK.'
    };
  };

  // If no AI configured, return deterministic response
  if (!isGeminiConfigured() && !isGroqConfigured()) {
    return buildDeterministicResponse();
  }

  // Format KCC retrieved results context
  const kccContext = results.slice(0, 3).map((r, i) => `${i + 1}. [${r.crop || 'General'}] Q: "${r.question}" | Ans: "${r.answer}"`).join('\n');

  // Build language prompt instruction
  let targetLangDesc = 'simple, friendly English';
  if (isHinglish) {
    targetLangDesc = 'natural, conversational Hinglish (Hindi written in Roman/English alphabet, like "Aapke tamatar ke paudho me... KCC records ke anusaar...")';
  } else if (isHindi) {
    targetLangDesc = 'clear Hindi in Devanagari script (हिंदी लिपि)';
  }

  const prompt = `You are Khetii's Senior Agronomist communicating directly with an Indian farmer.

FARMER'S ORIGINAL QUERY: "${rawQuery}"
DETECTED LANGUAGE STYLE: ${langStyle.toUpperCase()} (You MUST reply in ${targetLangDesc})
MATCH ACCURACY WITH KCC DATA: ${matchAccuracy}%
IS DIRECT KCC RECORD AVAILABLE: ${isAvailableInKcc ? 'YES' : 'NO'}

RETRIEVED KISAN CALL CENTRE (KCC) HISTORICAL ADVISORIES:
${kccContext || '(No direct matches found)'}

RULES:
1. LANGUAGE: Respond strictly in ${targetLangDesc}. Do NOT switch languages. If the user asked in Hinglish, write natural farmer Hinglish. If Hindi, write Devanagari Hindi. If English, write English.
2. ACCURACY DISCLOSURE:
   - If IS DIRECT KCC RECORD AVAILABLE is YES (Match accuracy ${matchAccuracy}%): Explain the diagnosis and practical KCC remedy based strictly on the retrieved records.
   - If IS DIRECT KCC RECORD AVAILABLE is NO (Match accuracy ${matchAccuracy}%): Explicitly inform the farmer that this specific problem does not have a direct record in the 1.7 Lakh+ Kisan Call Centre database. Provide sound general advice and tell them to call the official KCC toll-free helpline 1800-180-1551.
3. OUTPUT FORMAT: Respond ONLY with valid JSON matching:
{
  "explanation": "2-3 empathetic sentences in ${langStyle} explaining the diagnosis and remedy/status",
  "actionSteps": ["Step 1 with dosage and application timing", "Step 2 (preventive/management step)"],
  "matchNote": "Short badge text mentioning the match accuracy % and status in ${langStyle}",
  "sourceNote": "Source attribution in ${langStyle}"
}`;

  // 1. Try Gemini synthesis
  if (isGeminiConfigured()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.explanation && Array.isArray(parsed.actionSteps)) {
        return {
          matchAccuracy,
          matchQuality: isAvailableInKcc ? (matchAccuracy >= 70 ? 'high' : 'moderate') : 'low',
          isAvailableInKcc,
          languageStyle: langStyle,
          matchNote: parsed.matchNote || (isAvailableInKcc ? `🎯 KCC Match Accuracy: ${matchAccuracy}%` : `⚠️ KCC Database Match: ${matchAccuracy}%`),
          explanation: parsed.explanation,
          actionSteps: parsed.actionSteps,
          sourceNote: parsed.sourceNote || 'Kisan Call Centre (Govt of India)',
          kccHelpline: '1800-180-1551',
          disclaimer: isHinglish
            ? 'Ye salah KCC records par aadharit hai. Khet me dawai dalne se pehle dose apne local KVK se verify karein.'
            : isHindi
            ? 'यह परामर्श ऐतिहासिक केसीसी रिकॉर्ड पर आधारित है। रासायनिक दवाओं का उपयोग करने से पहले स्थानीय केवीके से खुराक सत्यापित करें।'
            : 'Advisory derived from historical KCC call records. Verify exact doses with your local KVK.',
          provider: 'gemini'
        };
      }
    } catch (err) {
      console.warn('[Gemini Service] Gemini synthesis failed, trying Groq fallback:', err.message);
    }
  }

  // 2. Try Groq synthesis
  if (isGroqConfigured()) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: `You are Khetii Senior Agronomist. Respond only in valid JSON in ${targetLangDesc}.` },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content);
      if (parsed && parsed.explanation && Array.isArray(parsed.actionSteps)) {
        return {
          matchAccuracy,
          matchQuality: isAvailableInKcc ? (matchAccuracy >= 70 ? 'high' : 'moderate') : 'low',
          isAvailableInKcc,
          languageStyle: langStyle,
          matchNote: parsed.matchNote || (isAvailableInKcc ? `🎯 KCC Match Accuracy: ${matchAccuracy}%` : `⚠️ KCC Database Match: ${matchAccuracy}%`),
          explanation: parsed.explanation,
          actionSteps: parsed.actionSteps,
          sourceNote: parsed.sourceNote || 'Kisan Call Centre (Govt of India)',
          kccHelpline: '1800-180-1551',
          disclaimer: isHinglish
            ? 'Ye salah KCC records par aadharit hai. Khet me dawai dalne se pehle dose apne local KVK se verify karein.'
            : isHindi
            ? 'यह परामर्श ऐतिहासिक केसीसी रिकॉर्ड पर आधारित है। रासायनिक दवाओं का उपयोग करने से पहले स्थानीय केवीके से खुराक सत्यापित करें।'
            : 'Advisory derived from historical KCC call records. Verify exact doses with your local KVK.',
          provider: 'groq'
        };
      }
    } catch (err) {
      console.warn('[Gemini Service] Groq synthesis failed:', err.message);
    }
  }

  // 3. Fallback to deterministic
  return buildDeterministicResponse();
};

module.exports = {
  isGeminiConfigured,
  detectLanguageStyle,
  extractKeywordsWithAI,
  synthesizeAdvisoryInUserLanguage
};
