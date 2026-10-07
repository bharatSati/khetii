const fs = require('fs');
const path = require('path');
const { isGroqConfigured } = require('./groqWeatherService');
const Groq = require('groq-sdk');

const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'raw_kcc.csv');

// Common agricultural crops in India for classification and search boost
const CROP_DEFINITIONS = [
  { name: 'Tomato', hi: 'टमाटर', keywords: ['tomato', 'tamatar', 'टमाटर'] },
  { name: 'Potato', hi: 'आलू', keywords: ['potato', 'aloo', 'alu', 'आलू'] },
  { name: 'Mustard', hi: 'सरसों', keywords: ['mustard', 'sarson', 'rai', 'toria', 'सरसों', 'राई'] },
  { name: 'Rice / Paddy', hi: 'धान / चावल', keywords: ['rice', 'paddy', 'dhan', 'chawal', 'ahu', 'sali', 'boro', 'धान', 'चावल'] },
  { name: 'Wheat', hi: 'गेहूं', keywords: ['wheat', 'gehu', 'gehoon', 'गेहूं'] },
  { name: 'Chilli', hi: 'मिर्च', keywords: ['chilli', 'chili', 'mirch', 'mirchi', 'मिर्च'] },
  { name: 'Brinjal', hi: 'बैंगन', keywords: ['brinjal', 'eggplant', 'baingan', 'बैंगन'] },
  { name: 'Coconut', hi: 'नारियल', keywords: ['coconut', 'nariyal', 'नारियल'] },
  { name: 'Banana', hi: 'केला', keywords: ['banana', 'kela', 'केला'] },
  { name: 'Maize / Corn', hi: 'मक्का', keywords: ['maize', 'corn', 'makka', 'bhutta', 'मक्का'] },
  { name: 'Cotton', hi: 'कपास', keywords: ['cotton', 'kapas', 'कपास'] },
  { name: 'Cattle & Dairy', hi: 'पशुपालन व डेयरी', keywords: ['cow', 'cattle', 'dairy', 'milk', 'calf', 'heifer', 'buffalo', 'गाय', 'भैंस', 'दुधारू'] },
  { name: 'Fisheries', hi: 'मत्स्य पालन', keywords: ['fish', 'fingerling', 'carp', 'pond', 'breeding', 'मछली', 'मत्स्य'] },
  { name: 'Poultry', hi: 'कुक्कुट / मुर्गी पालन', keywords: ['poultry', 'chicken', 'broiler', 'layer', 'duck', 'मुर्गी'] },
  { name: 'Gram & Pulses', hi: 'चना व दलहन', keywords: ['gram', 'chana', 'pulse', 'moong', 'urad', 'arhar', 'tur', 'pea', 'चना', 'दाल', 'मटर'] },
  { name: 'Onion & Garlic', hi: 'प्याज व लहसुन', keywords: ['onion', 'garlic', 'pyaj', 'lahsun', 'प्याज', 'लहसुन'] },
  { name: 'Mango', hi: 'आम', keywords: ['mango', 'aam', 'आम'] },
  { name: 'Ginger & Turmeric', hi: 'अदरक व हल्दी', keywords: ['ginger', 'turmeric', 'haldi', 'adrak', 'अदरक', 'हल्दी'] }
];

// Problem/advisory categories
const CATEGORY_DEFINITIONS = [
  {
    name: 'Pest & Insect Control',
    hi: 'कीट एवं पतंग नियंत्रण',
    keywords: ['aphid', 'borer', 'caterpillar', 'hispa', 'hopper', 'thrips', 'mite', 'whitefly', 'weevil', 'pest', 'insect', 'infestation', 'spray', 'rogor', 'malathion', 'decis', 'chlorpyriphos', 'dimethoate', 'monocrotophos', 'कीड़ा', 'कीट', 'माहू', 'चेपा', 'इल्ली']
  },
  {
    name: 'Disease & Fungus Control',
    hi: 'रोग एवं फफूंद प्रबंधन',
    keywords: ['blight', 'rot', 'wilt', 'rust', 'mildew', 'blast', 'canker', 'fungus', 'fungal', 'leaf spot', 'damping', 'bavistin', 'saaf', 'dithane', 'ridomil', 'indofil', 'copper', 'antracol', 'mancozeb', 'yellow leaf', 'curl', 'virus', 'झुलसा', 'रतुआ', 'सड़न', 'फफूंद', 'धब्बा', 'मरोड़िया']
  },
  {
    name: 'Nutrient & Fertilizer Management',
    hi: 'उर्वरक एवं पोषण प्रबंधन',
    keywords: ['fertilizer', 'urea', 'ssp', 'mop', 'npk', 'zinc', 'borax', 'manure', 'compost', 'vermicompost', 'deficiency', 'dose', 'soil', 'खाद', 'उर्वरक', 'यूरिया', 'जिंक', 'बोरॉन', 'गोबर']
  },
  {
    name: 'Seed Varieties & Sowing',
    hi: 'बीज किस्में व बुआई',
    keywords: ['variety', 'seed', 'sowing', 'nursery', 'germination', 'hybrid', 'pusa', 'transplanting', 'spacing', 'बीज', 'किस्म', 'बुआई', 'नर्सरी']
  },
  {
    name: 'Weed Management',
    hi: 'खरपतवार नियंत्रण',
    keywords: ['weed', 'herbicide', 'weeding', 'glyphosate', 'roundup', 'gramoxone', 'butachlor', 'खरपतवार', 'निराई', 'गुड़ाई']
  },
  {
    name: 'Animal Health & Breeding',
    hi: 'पशु स्वास्थ्य व देखभाल',
    keywords: ['cow', 'milk', 'fever', 'vaccine', 'deworming', 'feed', 'fodder', 'mastitis', 'insemination', 'bolus', 'पशु', 'बीमारी', 'टीकाकरण', 'दूध']
  },
  {
    name: 'Fisheries & Aquaculture',
    hi: 'मछली पालन व तालाब प्रबंधन',
    keywords: ['fingerling', 'fish', 'pond', 'plankton', 'breeding', 'netting', 'lime', 'मछली', 'तालाब', 'जीरा']
  },
  {
    name: 'Govt Schemes & Credit',
    hi: 'सरकारी योजनाएं व केसीसी ऋण',
    keywords: ['kcc', 'kisan credit', 'loan', 'scheme', 'subsidy', 'bank', 'insurance', 'branch', 'ऋण', 'योजना', 'सब्सिडी', 'कर्ज']
  }
];

// Common stopwords to exclude from word index
const STOPWORDS = new Set([
  'the', 'and', 'for', 'about', 'him', 'her', 'his', 'asking', 'suggested',
  'advised', 'recommended', 'control', 'measure', 'applied', 'with', 'per',
  'litre', 'water', 'that', 'has', 'not', 'got', 'proper', 'from', 'also',
  'solution', 'gram', 'dose', 'what', 'should', 'how', 'when', 'which', 'are',
  'this', 'was', 'were', 'have', 'been', 'will', 'problem', 'crops', 'plant'
]);

// Hindi to English translation map for semantic query understanding
const HINDI_SYNONYM_MAP = {
  'टमाटर': 'tomato',
  'आलू': 'potato',
  'सरसों': 'mustard',
  'राई': 'mustard',
  'धान': 'rice paddy',
  'चावल': 'rice paddy',
  'गेहूं': 'wheat',
  'मिर्च': 'chilli',
  'बैंगन': 'brinjal',
  'प्याज': 'onion',
  'लहसुन': 'garlic',
  'केला': 'banana',
  'नारियल': 'coconut',
  'मक्का': 'maize',
  'कपास': 'cotton',
  'गाय': 'cow cattle dairy',
  'भैंस': 'cow cattle buffalo',
  'पशु': 'cow cattle',
  'मछली': 'fish fingerling',
  'चना': 'gram',
  'माहू': 'aphid',
  'चेपा': 'aphid',
  'झुलसा': 'blight',
  'पीला': 'yellow',
  'पीले': 'yellow',
  'पीली': 'yellow',
  'पत्ते': 'leaf leaves',
  'पत्ती': 'leaf leaves',
  'पत्तियों': 'leaf leaves',
  'कीड़ा': 'pest borer insect',
  'कीट': 'pest borer insect',
  'तना': 'shoot stem',
  'छेदक': 'borer',
  'सड़न': 'rot',
  'उकठा': 'wilt',
  'फफूंद': 'fungus fungal',
  'खाद': 'fertilizer urea',
  'उर्वरक': 'fertilizer',
  'सिंचाई': 'irrigation water',
  'पानी': 'irrigation water',
  'दवा': 'spray medicine',
  'छिड़काव': 'spray',
  'फल': 'fruit',
  'फूल': 'flower',
  'झड़ना': 'drop falling',
  'गिरना': 'drop falling'
};

// In-memory state
let isInitialized = false;
let isLoading = false;
let records = []; // array of { id, q, a, crop, category, isInformative }
let invertedIndex = new Map(); // word -> Array<number> (record ids)
let cropIndex = new Map(); // cropName -> Array<number>
let categoryIndex = new Map(); // categoryName -> Array<number>

// Query result cache (TTL 30 min)
const queryCache = new Map();
const QUERY_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Classify crop from text
 */
const detectCropFromText = (text) => {
  const lower = (text || '').toLowerCase();
  for (const c of CROP_DEFINITIONS) {
    if (c.keywords.some((k) => lower.includes(k))) {
      return c.name;
    }
  }
  return 'General Crop';
};

/**
 * Classify category from text
 */
const detectCategoryFromText = (text) => {
  const lower = (text || '').toLowerCase();
  for (const cat of CATEGORY_DEFINITIONS) {
    if (cat.keywords.some((k) => lower.includes(k))) {
      return cat.name;
    }
  }
  return 'General Agriculture Advisory';
};

/**
 * Check if answer is specific/informative rather than a generic brush-off
 */
const isInformativeAnswer = (ans) => {
  const lower = (ans || '').toLowerCase();
  if (lower.length < 15) return false;
  if (lower.startsWith('explained in detail') || lower === 'explained in details.' || lower.startsWith('advised him to visit')) {
    return false;
  }
  return true;
};

/**
 * Initialize KCC service: parse CSV and build memory-efficient inverted index
 */
const initKCC = async () => {
  if (isInitialized || isLoading) return;
  isLoading = true;

  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.warn(`[KCC Service] CSV file not found at ${CSV_FILE_PATH}. KCC feature disabled.`);
      isLoading = false;
      return;
    }

    console.log('[KCC Service] Initializing Kisan Call Centre (KCC) index...');
    const startTime = Date.now();

    const buffer = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    // Parse CSV with quotes support
    let inQuote = false;
    let field = '';
    let row = [];
    const parsedRecords = [];

    for (let i = 0; i < buffer.length; i++) {
      const c = buffer[i];
      if (c === '\"') {
        if (inQuote && buffer[i + 1] === '\"') {
          field += '\"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        row.push(field);
        field = '';
      } else if ((c === '\n' || c === '\r') && !inQuote) {
        if (c === '\r' && buffer[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        if (row.length >= 2) {
          const q = row[0].trim().replace(/^\"|\"$/g, '');
          const a = row.slice(1).join(',').trim().replace(/^\"|\"$/g, '');
          if (q && a && q !== 'questions') {
            const crop = detectCropFromText(`${q} ${a}`);
            const category = detectCategoryFromText(`${q} ${a}`);
            const informative = isInformativeAnswer(a);

            parsedRecords.push({
              id: parsedRecords.length,
              q,
              a,
              crop,
              category,
              isInformative: informative
            });
          }
        }
        row = [];
      } else {
        field += c;
      }
    }

    if (row.length >= 2) {
      const q = row[0].trim().replace(/^\"|\"$/g, '');
      const a = row.slice(1).join(',').trim().replace(/^\"|\"$/g, '');
      if (q && a && q !== 'questions') {
        const crop = detectCropFromText(`${q} ${a}`);
        const category = detectCategoryFromText(`${q} ${a}`);
        parsedRecords.push({
          id: parsedRecords.length,
          q,
          a,
          crop,
          category,
          isInformative: isInformativeAnswer(a)
        });
      }
    }

    // Build inverted index and secondary indexes
    const tempIndex = new Map();
    const tempCropIndex = new Map();
    const tempCategoryIndex = new Map();

    for (let id = 0; id < parsedRecords.length; id++) {
      const rec = parsedRecords[id];

      // Index tokens from question and answer
      const qTokens = rec.q.toLowerCase().match(/[a-z0-9]+/g) || [];
      const seen = new Set();

      for (const t of qTokens) {
        if (t.length >= 3 && !STOPWORDS.has(t) && !seen.has(t)) {
          seen.add(t);
          let list = tempIndex.get(t);
          if (!list) {
            list = [];
            tempIndex.set(t, list);
          }
          list.push(id);
        }
      }

      // Index crop
      let cList = tempCropIndex.get(rec.crop);
      if (!cList) {
        cList = [];
        tempCropIndex.set(rec.crop, cList);
      }
      cList.push(id);

      // Index category
      let catList = tempCategoryIndex.get(rec.category);
      if (!catList) {
        catList = [];
        tempCategoryIndex.set(rec.category, catList);
      }
      catList.push(id);
    }

    records = parsedRecords;
    invertedIndex = tempIndex;
    cropIndex = tempCropIndex;
    categoryIndex = tempCategoryIndex;
    isInitialized = true;
    isLoading = false;

    console.log(
      `[KCC Service] Successfully indexed ${records.length.toLocaleString()} KCC advisories across ${invertedIndex.size.toLocaleString()} unique terms in ${Date.now() - startTime}ms`
    );
  } catch (err) {
    console.error('[KCC Service] Failed to initialize KCC index:', err.message);
    isLoading = false;
  }
};

/**
 * Expand and normalize farmer query (handling Hindi transliterations and synonyms)
 */
const normalizeFarmerQuery = (query) => {
  let expanded = (query || '').toLowerCase().trim();

  // Expand Hindi terms
  for (const [hiTerm, enEquiv] of Object.entries(HINDI_SYNONYM_MAP)) {
    if (expanded.includes(hiTerm.toLowerCase())) {
      expanded += ' ' + enEquiv;
    }
  }

  // Extract clean keywords of length >= 3, skipping common stopwords
  const tokens = (expanded.match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t)
  );

  return {
    raw: query,
    expanded,
    tokens: [...new Set(tokens)]
  };
};

/**
 * Search KCC advisories by query with ranking and filtering
 */
const searchKCC = async ({
  query = '',
  crop = '',
  category = '',
  state = '',
  limit = 6,
  minRelevance = 0.40
}) => {
  if (!isInitialized) {
    await initKCC();
  }

  if (!records || records.length === 0) {
    return {
      query,
      totalMatches: 0,
      results: [],
      message: 'KCC dataset is not loaded or unavailable.'
    };
  }

  const cleanQuery = (query || '').trim();
  if (!cleanQuery && !crop && !category) {
    return {
      query: '',
      totalMatches: 0,
      results: [],
      message: 'Please provide a farming question or select a crop filter.'
    };
  }

  // Check query cache
  const cacheKey = `${cleanQuery.toLowerCase()}_${crop}_${category}_${state}_${limit}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
    return cached.data;
  }

  const { expanded, tokens } = normalizeFarmerQuery(cleanQuery);
  const detectedCrop = crop || detectCropFromText(expanded);
  const detectedCategory = category || detectCategoryFromText(expanded);

  // Candidate scoring map: docId -> score
  const candidateScores = new Map();

  // If crop filter provided, seed with crop matches
  let eligibleDocs = null;
  if (crop && crop !== 'All' && crop !== 'General Crop') {
    const list = cropIndex.get(crop);
    if (list) eligibleDocs = new Set(list);
  }

  // If category filter provided, intersect with category matches
  if (category && category !== 'All' && category !== 'General Agriculture Advisory') {
    const list = categoryIndex.get(category);
    if (list) {
      const catSet = new Set(list);
      if (eligibleDocs) {
        eligibleDocs = new Set([...eligibleDocs].filter((id) => catSet.has(id)));
      } else {
        eligibleDocs = catSet;
      }
    }
  }

  // Token matching across inverted index
  for (const token of tokens) {
    const docIds = invertedIndex.get(token) || [];
    const tokenWeight = token.length >= 5 ? 1.5 : 1.0;

    for (const id of docIds) {
      if (eligibleDocs && !eligibleDocs.has(id)) continue;

      const currentScore = candidateScores.get(id) || 0;
      candidateScores.set(id, currentScore + tokenWeight);
    }
  }

  // If no token hits (e.g., query had only generic words or only crop was selected)
  if (candidateScores.size === 0 && eligibleDocs && eligibleDocs.size > 0) {
    let count = 0;
    for (const id of eligibleDocs) {
      candidateScores.set(id, records[id].isInformative ? 2.0 : 1.0);
      count++;
      if (count > 200) break;
    }
  }

  // Calculate final ranking scores
  const scoredResults = [];
  const maxPossibleTokens = Math.max(tokens.length, 1);

  for (const [id, matchScore] of candidateScores.entries()) {
    const rec = records[id];
    let score = matchScore;

    // Boost: match in question text
    const qLower = rec.q.toLowerCase();
    const aLower = rec.a.toLowerCase();

    // Phrase boost (if query phrase appears directly)
    if (tokens.length >= 2) {
      const phrase = tokens.slice(0, 3).join(' ');
      if (qLower.includes(phrase)) score += 4.0;
    }

    // Crop match boost
    if (detectedCrop && detectedCrop !== 'General Crop' && rec.crop === detectedCrop) {
      score += 3.0;
    }

    // Category match boost
    if (detectedCategory && detectedCategory !== 'General Agriculture Advisory' && rec.category === detectedCategory) {
      score += 1.5;
    }

    // Informative answer bonus
    if (rec.isInformative) {
      score += 2.0;
    } else {
      score -= 2.5; // De-prioritize "explained in details"
    }

    // Normalized relevance score between 0.40 and 0.98
    const normalizedRelevance = Math.min(
      0.98,
      Math.max(0.40, Math.round(((score / (maxPossibleTokens * 2.5 + 4.0)) * 0.5 + 0.45) * 100) / 100)
    );

    if (normalizedRelevance >= minRelevance) {
      scoredResults.push({
        id: rec.id,
        question: rec.q,
        answer: rec.a,
        crop: rec.crop,
        category: rec.category,
        relevanceScore: normalizedRelevance,
        source: 'Kisan Call Centre (KCC)'
      });
    }
  }

  // Sort descending by relevance
  scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const topResults = scoredResults.slice(0, limit);

  const responseData = {
    query: cleanQuery,
    detectedCrop: detectedCrop !== 'General Crop' ? detectedCrop : (crop || 'General'),
    detectedCategory: detectedCategory !== 'General Agriculture Advisory' ? detectedCategory : (category || 'General'),
    totalMatches: scoredResults.length,
    results: topResults,
    message:
      topResults.length === 0
        ? 'No direct Kisan Call Centre historical advisory matched this specific query. You may also call the KCC toll-free helpline at 1800-180-1551.'
        : undefined
  };

  // Cache response
  queryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

  return responseData;
};

/**
 * Synthesize AI Explanation using existing Groq integration (or deterministic fallback)
 */
const summarizeKccAdvisories = async ({ query, results = [], lang = 'hi' }) => {
  const isHindi = lang.startsWith('hi');

  if (!results || results.length === 0) {
    return {
      explanation: isHindi
        ? 'इस प्रश्न के लिए कोई सीधा केसीसी ऐतिहासिक रिकॉर्ड नहीं मिला। आप किसान कॉल सेंटर के टोल-फ्री नंबर 1800-180-1551 पर विशेषज्ञ से संपर्क कर सकते हैं।'
        : 'No specific Kisan Call Centre historical record found for this query. You may contact the official Kisan Call Centre toll-free at 1800-180-1551.',
      actionSteps: [],
      sourceNote: isHindi ? 'किसान कॉल सेंटर (भारत सरकार)' : 'Kisan Call Centre (Govt of India)',
      disclaimer: isHindi
        ? 'यह परामर्श ऐतिहासिक केसीसी रिकॉर्ड पर आधारित है। अंतिम उपयोग से पहले अपने स्थानीय कृषि विस्तार अधिकारी या केवीके से खुराक सत्यापित करें।'
        : 'This advisory is derived from historical Kisan Call Centre records. Always verify exact chemical doses with your local Krishi Vigyan Kendra.'
    };
  }

  // If Groq is not configured, generate deterministic agronomist synthesis
  const generateDeterministicSummary = () => {
    const top = results[0];
    const second = results[1];

    const actions = [];
    if (top?.answer) actions.push(top.answer);
    if (second?.answer && second.answer !== top.answer) actions.push(second.answer);

    const explanation = isHindi
      ? `किसान कॉल सेंटर (KCC) के सत्यापित आंकड़ों के अनुसार, इस समस्या के लिए अनुशंसित समाधान: "${top.answer}" है। ${second ? 'अतिरिक्त परामर्श: ' + second.answer : ''}`
      : `According to verified Kisan Call Centre records, the primary recommended action is: "${top.answer}". ${second ? 'Supplementary advisory: ' + second.answer : ''}`;

    return {
      explanation,
      actionSteps: actions,
      sourceNote: isHindi ? 'किसान कॉल सेंटर (भारत सरकार) ऐतिहासिक डेटाबेस' : 'Kisan Call Centre (Govt of India) Historical Dataset',
      disclaimer: isHindi
        ? 'यह परामर्श ऐतिहासिक केसीसी कॉल रिकॉर्ड्स से संकलित है। रासायनिक दवाओं का छिड़काव अनुशंसित मात्रा में और सुरक्षात्मक साधनों के साथ ही करें।'
        : 'Advisory compiled from historical KCC call records. Apply agrochemicals only in recommended doses using protective gear.'
    };
  };

  if (!isGroqConfigured()) {
    return generateDeterministicSummary();
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const kccContext = results.slice(0, 4).map((r, i) => `${i + 1}. [${r.crop} - ${r.category}] Q: ${r.question} | Advisory: ${r.answer}`).join('\n');

    const prompt = `You are Khetii's Senior Agronomist summarizing official Kisan Call Centre (KCC) farmer advisories.
Farmer Query: "${query}"

RETRIEVED AUTHENTIC KCC ADVISORIES:
${kccContext}

INSTRUCTIONS:
1. Synthesize a practical, empathetic, and clear agricultural action plan based STRICTLY on the KCC advisories provided above.
2. DO NOT hallucinate chemicals, dosages, or practices not supported by the KCC data.
3. Respond in ${isHindi ? 'clear Hindi (Devanagari script)' : 'simple, friendly English'}.
4. Respond in valid JSON matching:
{
  "explanation": "2-3 sentences explaining the diagnosis and recommended KCC remedy in simple farmer terms",
  "actionSteps": ["Action step 1 with dose & timing", "Action step 2 (preventive/cultural)"],
  "sourceNote": "Synthesized from Kisan Call Centre dataset",
  "disclaimer": "Agricultural advisory derived from historical KCC records; verify local conditions with your KVK."
}`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are Khetii AI Senior Agricultural Advisor. Respond only in JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 600
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content);
    if (parsed && parsed.explanation && Array.isArray(parsed.actionSteps)) {
      return parsed;
    }

    return generateDeterministicSummary();
  } catch (err) {
    console.warn('[KCC Service] Groq AI synthesis error (using deterministic fallback):', err.message);
    return generateDeterministicSummary();
  }
};

/**
 * Get KCC Metadata (supported crops, categories, total records)
 */
const getKCCMetadata = async () => {
  if (!isInitialized) {
    await initKCC();
  }

  return {
    totalRecords: records.length,
    crops: CROP_DEFINITIONS.map((c) => ({ name: c.name, hi: c.hi })),
    categories: CATEGORY_DEFINITIONS.map((c) => ({ name: c.name, hi: c.hi })),
    isReady: isInitialized
  };
};

/**
 * Get popular curated KCC sample advisories for quick guidance
 */
const getPopularAdvisories = async () => {
  if (!isInitialized) {
    await initKCC();
  }

  const sampleIds = [0, 1, 8, 25, 42, 60, 120, 180, 250, 400];
  const sampleList = sampleIds
    .filter((id) => id < records.length && records[id]?.isInformative)
    .map((id) => ({
      id: records[id].id,
      question: records[id].q,
      answer: records[id].a,
      crop: records[id].crop,
      category: records[id].category,
      source: 'Kisan Call Centre (KCC)'
    }));

  return sampleList;
};

// Non-blocking initialization on load
setTimeout(() => {
  initKCC().catch((e) => console.warn('[KCC Service] Async init note:', e.message));
}, 100);

module.exports = {
  initKCC,
  searchKCC,
  summarizeKccAdvisories,
  getKCCMetadata,
  getPopularAdvisories,
  detectCropFromText,
  detectCategoryFromText
};
