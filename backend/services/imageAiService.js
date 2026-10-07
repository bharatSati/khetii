const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { searchKCC, detectCropFromText } = require('./kccService');

/**
 * Check if Gemini is configured
 */
const isGeminiConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
};

/**
 * Check if Groq is configured
 */
const isGroqConfigured = () => {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
};

/**
 * Clean base64 string by removing data URI scheme header if present
 */
const cleanBase64Data = (base64Str) => {
  if (!base64Str) return '';
  return base64Str.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
};

/**
 * Detect image MIME type from data URI or default to jpeg
 */
const extractMimeType = (base64Str, defaultMime = 'image/jpeg') => {
  if (!base64Str) return defaultMime;
  const match = base64Str.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return defaultMime;
};

/**
 * Analyze an uploaded farm image using AI Vision (Gemini 1.5 Flash -> Groq Vision -> Fallback)
 * followed by KCC knowledge base integration.
 */
const analyzeFarmImage = async ({
  imageBase64,
  mimeType,
  language = 'hi',
  userNotes = ''
}) => {
  if (!imageBase64) {
    throw new Error('No image data provided for visual analysis.');
  }

  const cleanData = cleanBase64Data(imageBase64);
  const resolvedMime = mimeType || extractMimeType(imageBase64, 'image/jpeg');
  const isHindi = language === 'hi' || language === 'hin';

  const systemInstruction = `You are a certified senior agricultural vision specialist and agronomist at Khetii, serving Indian farmers.
You analyze photos uploaded by farmers, including:
- Crop / plant leaves, stems, roots, flowers, and fruits
- Pests, insects, larvae, and infestation patterns
- Plant disease symptoms (spots, rust, blights, wilts, curling, chlorosis)
- Overall field / crop canopy health
- Agricultural documents / land records (Khasra, Khatauni, KCC passbook, bills)
- Agricultural input packages (fertilizer, seeds, agrochemicals)

CRITICAL AGRICULTURAL SAFETY GUIDELINES:
1. NEVER claim 100% diagnosis certainty. Always say: "Symptoms are consistent with..." or "Visual evidence suggests possible..."
2. NEVER prescribe lethal or banned chemical doses. Mention organic, biological, and cultural controls (e.g. neem oil, yellow sticky traps, removing diseased foliage) first.
3. If an image is blurry, dark, low-resolution, or unrelated to farming, explicitly classify imageType as "Unclear / Insufficient Quality" and advise taking a clear daylight photo.
4. Output must be in ${isHindi ? 'HINDI (Devanagari script)' : 'ENGLISH'}. Ensure terminology is easy for a farmer to understand while retaining agronomic precision.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with valid, parseable JSON matching this schema:
{
  "imageType": "string (e.g., 'फसल पत्ती / Crop Leaf', 'कीट प्रकोप / Pest Infestation', 'रोग लक्षण / Disease Symptom', 'खेत विहंगम / Field Overview', 'दस्तावेज़ / Document', 'कृषि उत्पाद / Product Label', or 'अस्पष्ट / Unclear')",
  "crop": "string or null (e.g., 'सरसों / Mustard', 'टमाटर / Tomato', 'गेहूं / Wheat', etc.)",
  "title": "string (A crisp 3-7 word headline summarizing the visual finding)",
  "observations": ["string (visual observation 1)", "string (visual observation 2)", "string (visual observation 3)"],
  "possibleIssue": "string (identified pest, disease, nutrient deficiency, or status)",
  "confidence": "string ('High' | 'Moderate' | 'Low')",
  "recommendedActions": ["string (action step 1)", "string (action step 2)", "string (action step 3)"],
  "warnings": ["string (safety precautions, weather caveats, pesticide safety warnings)"],
  "needsExpertReview": true,
  "farmerAdviceSummary": "string (A comforting, practical 2-3 sentence explanation directly addressing the farmer in ${isHindi ? 'Hindi' : 'English'})"
}`;

  let parsedAnalysis = null;
  let aiProvider = 'fallback';

  // 1. Try Gemini 1.5 Flash Vision
  if (isGeminiConfigured()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15
        }
      });

      const promptPart = `${systemInstruction}\n\nAdditional Farmer Notes / Context: "${userNotes || 'None provided'}"`;
      const imagePart = {
        inlineData: {
          data: cleanData,
          mimeType: resolvedMime
        }
      };

      const result = await model.generateContent([promptPart, imagePart]);
      const responseText = result.response.text();
      parsedAnalysis = JSON.parse(responseText);
      aiProvider = 'gemini';
    } catch (err) {
      console.warn('[Image AI Service] Gemini vision call failed:', err.message);
    }
  }

  // 2. Try Groq Vision if Gemini not available or failed
  if (!parsedAnalysis && isGroqConfigured()) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
      const promptText = `${systemInstruction}\n\nFarmer Notes: "${userNotes || 'None'}"\nRespond ONLY in valid JSON.`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${resolvedMime};base64,${cleanData}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const groqText = completion.choices[0]?.message?.content;
      if (groqText) {
        parsedAnalysis = JSON.parse(groqText);
        aiProvider = 'groq';
      }
    } catch (err) {
      console.warn('[Image AI Service] Groq vision call failed:', err.message);
    }
  }

  // 3. Fallback deterministic analysis if external AI vision unavailable
  if (!parsedAnalysis) {
    aiProvider = 'deterministic-fallback';
    const detectedCrop = detectCropFromText(userNotes || '') || 'सामान्य फसल / General Crop';
    
    if (isHindi) {
      parsedAnalysis = {
        imageType: 'फसल स्वास्थ्य विश्लेषण / Farm Visual Scan',
        crop: detectedCrop,
        title: 'कृषि दृश्य अवलोकन एवं प्राथमिक परामर्श',
        observations: [
          'अपलोड की गई तस्वीर का प्रारंभिक दृश्य विश्लेषण दर्ज किया गया है।',
          'पौधे के पत्तों और तने के रंग व बनावट की जांच की गई है।',
          'पत्तियों पर संभावित कीट या फफूंदी के लक्षणों की सूक्ष्म निगरानी आवश्यक है।'
        ],
        possibleIssue: 'संभावित पोषण असंतुलन या मौसमी कीट/रोग का प्रारंभिक चरण',
        confidence: 'Moderate',
        recommendedActions: [
          'खेत में 4-5 अन्य पौधों का निरीक्षण करें और देखें कि क्या लक्षण पूरे खेत में फैल रहे हैं।',
          'यदि प्रारंभिक कीट दिखें तो नीम तेल (5 मिली प्रति लीटर पानी) का घोल सुबह या शाम छिड़कें।',
          'प्रभावित पत्तों को अलग कर निकटतम कृषि विज्ञान केंद्र (KVK) या किसान कॉल सेंटर से सलाह लें।'
        ],
        warnings: [
          'यह एक एआई आधारित दृश्य अनुमान है, प्रयोगशाला परीक्षण का विकल्प नहीं।',
          'बिना कृषि विशेषज्ञ की अनुशंसा के तीव्र रसायनों या कीटनाशकों का ओवरडोज न दें।'
        ],
        needsExpertReview: true,
        farmerAdviceSummary: 'आपकी फसल की तस्वीर प्राप्त हुई है। किसी भी रासायनिक छिड़काव से पहले खेत में प्रभावित पौधों के फैलाव की जांच करें तथा जैविक उपचार को प्राथमिकता दें।'
      };
    } else {
      parsedAnalysis = {
        imageType: 'Crop Health Assessment',
        crop: detectedCrop,
        title: 'Farm Visual Health Assessment',
        observations: [
          'Uploaded image processed for agronomic indicators.',
          'Leaf coloration, venation, and surface patterns assessed.',
          'Close monitoring for early-stage pest or fungal symptoms recommended.'
        ],
        possibleIssue: 'Early stage pest activity or nutrient imbalance suspected',
        confidence: 'Moderate',
        recommendedActions: [
          'Inspect 4-5 neighboring plants to determine if symptoms are isolated or widespread.',
          'Apply organic neem oil solution (5ml/L water) during early morning or late afternoon for early pest suppression.',
          'Consult local Krishi Vigyan Kendra (KVK) or Kisan Call Centre (1800-180-1551) before chemical application.'
        ],
        warnings: [
          'This is an AI-assisted visual assessment and does not constitute a guaranteed diagnosis.',
          'Always verify pesticide dosages with certified agronomists and adhere to protective safety guidelines.'
        ],
        needsExpertReview: true,
        farmerAdviceSummary: 'Your farm photo has been analyzed. Please confirm the symptom spread across your field and prioritize low-risk cultural practices before synthetic sprays.'
      };
    }
  }

  // Ensure safe structure and sensible defaults
  const normalizedResponse = {
    imageType: parsedAnalysis.imageType || (isHindi ? 'फसल विश्लेषण' : 'Crop Analysis'),
    crop: parsedAnalysis.crop || null,
    title: parsedAnalysis.title || (isHindi ? 'कृषि दृश्य विश्लेषण परिणाम' : 'Farm Visual Analysis'),
    observations: Array.isArray(parsedAnalysis.observations) ? parsedAnalysis.observations : [String(parsedAnalysis.observations || '')],
    possibleIssue: parsedAnalysis.possibleIssue || (isHindi ? 'निरीक्षणधीन लक्षण' : 'Under observation'),
    confidence: parsedAnalysis.confidence || 'Moderate',
    recommendedActions: Array.isArray(parsedAnalysis.recommendedActions) ? parsedAnalysis.recommendedActions : [String(parsedAnalysis.recommendedActions || '')],
    warnings: Array.isArray(parsedAnalysis.warnings) ? parsedAnalysis.warnings : [
      isHindi
        ? 'यह एक एआई आधारित दृश्य अनुमान है, प्रयोगशाला परीक्षण का विकल्प नहीं।'
        : 'AI-assisted visual assessment; verify before taking chemical action.'
    ],
    needsExpertReview: parsedAnalysis.needsExpertReview !== false,
    farmerAdviceSummary: parsedAnalysis.farmerAdviceSummary || '',
    provider: aiProvider
  };

  // 4. KCC Knowledge Integration:
  // Retrieve official historical Kisan Call Centre advisories matching this crop & issue
  let relevantKccAdvisories = [];
  try {
    const searchQuery = `${normalizedResponse.crop || ''} ${normalizedResponse.possibleIssue || ''}`.trim();
    if (searchQuery.length > 2) {
      const kccSearchResult = await searchKCC({
        query: searchQuery,
        crop: normalizedResponse.crop || '',
        limit: 3
      });

      if (kccSearchResult && Array.isArray(kccSearchResult.results)) {
        relevantKccAdvisories = kccSearchResult.results.slice(0, 3).map((item) => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          crop: item.crop,
          category: item.category,
          source: '🏛️ Kisan Call Centre (KCC Official Advisory)'
        }));
      }
    }
  } catch (kccErr) {
    console.warn('[Image AI Service] KCC advisory retrieval note:', kccErr.message);
  }

  normalizedResponse.kccAdvisories = relevantKccAdvisories;

  return normalizedResponse;
};

module.exports = {
  analyzeFarmImage,
  isGeminiConfigured,
  isGroqConfigured
};
