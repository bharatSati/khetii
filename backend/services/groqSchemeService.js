const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { detectLanguageStyle } = require('./geminiService');

/**
 * Check if Groq AI is configured
 */
const isGroqConfigured = () => {
  const isEnabled = process.env.GROQ_AI_ENABLED !== 'false';
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  return isEnabled && hasKey;
};

/**
 * Check if Gemini AI is configured (secondary fallback)
 */
const isGeminiConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
};

/**
 * Deterministic scheme Q&A when AI is unavailable or offline
 */
const buildDeterministicSchemeAnswer = ({ scheme, question = '', lang = 'hi' }) => {
  const detectedLang = detectLanguageStyle(question);
  const isHinglish = detectedLang === 'hinglish';
  const isHindi = detectedLang === 'hindi';
  const qLower = question.toLowerCase();

  const schemeName = scheme.name[isHindi ? 'hi' : 'en'] || scheme.name.en || scheme.id;
  const benefits = scheme.benefits[isHindi ? 'hi' : 'en'] || scheme.benefits.en || '';
  const eligibility = scheme.eligibility[isHindi ? 'hi' : 'en'] || scheme.eligibility.en || '';
  const howToApply = scheme.howToApply[isHindi ? 'hi' : 'en'] || scheme.howToApply.en || '';
  const docs = (scheme.documentsRequired?.[isHindi ? 'hi' : 'en'] || scheme.documentsRequired?.en || []);

  let answer = '';
  let keyPoints = [];

  // 1. Documents inquiry
  if (/document|dastavez|kagaz|aadhar|aadhaar|patra|दस्तावेज|कागजात|आधार/.test(qLower)) {
    if (isHinglish) {
      answer = `${schemeName} ke liye mukhya dastavez ye hain. Kripya inki original aur photocopy dono taiyar rakhein.`;
    } else if (isHindi) {
      answer = `${schemeName} के लिए आवश्यक दस्तावेज निम्नलिखित हैं। आवेदन के समय इनकी स्व-प्रमाणित प्रति संलग्न करें।`;
    } else {
      answer = `The required documents for ${schemeName} are listed below. Keep both originals and photocopies ready.`;
    }
    keyPoints = docs.length > 0 ? docs : ['Aadhaar Card', 'Land Records / Khasra-Khatauni', 'Active Bank Account', 'Passport Photo'];
  }
  // 2. Eligibility inquiry
  else if (/eligible|patra|kaun|apply kar sakta|zameen|paatra|पात्र|पात्रता|जमीन|भूमि/.test(qLower)) {
    if (isHinglish) {
      answer = `${schemeName} ki patrata shartein: ${eligibility}`;
      keyPoints = [
        'Kheti yogya zameen aavedak ke naam honi chahiye (landholding)',
        'Sarkari karmachari aur aaykar daata samanyatah iske daayre se bahar hain',
        'Bank khata Aadhaar se link hona anivarya hai'
      ];
    } else if (isHindi) {
      answer = `${schemeName} की पात्रता शर्तें: ${eligibility}`;
      keyPoints = [
        'खेती योग्य भूमि आवेदक के नाम दर्ज होनी चाहिए',
        'बैंक खाता आधार से लिंक (डीबीटी सक्रिय) होना अनिवार्य है',
        'संस्थागत भूमिधारक और आयकरदाता अपात्र हैं'
      ];
    } else {
      answer = `Eligibility criteria for ${schemeName}: ${eligibility}`;
      keyPoints = [
        'Must possess cultivable landholding in own name',
        'Bank account must be Aadhaar-linked for DBT transfers',
        'Institutional landholders and income tax payers are excluded'
      ];
    }
  }
  // 3. Benefits / Subsidy inquiry
  else if (/benefit|subsidy|paisa|rupaye|amount|kist|labh|rupay|लाभ|रुपये|पैसा|सब्सिडी|किस्त/.test(qLower)) {
    if (isHinglish) {
      answer = `${schemeName} ke anusaar milne wala laabh: ${benefits}`;
      keyPoints = [
        benefits,
        `Official portal: ${scheme.officialLink || 'sarkari portal'} par status check kar sakte hain.`
      ];
    } else if (isHindi) {
      answer = `${schemeName} के तहत मिलने वाले लाभ: ${benefits}`;
      keyPoints = [
        benefits,
        `आधिकारिक पोर्टल: ${scheme.officialLink || 'सरकारी पोर्टल'} पर जाकर स्थिति देख सकते हैं।`
      ];
    } else {
      answer = `Financial and practical benefits under ${schemeName}: ${benefits}`;
      keyPoints = [
        benefits,
        `Direct DBT transfer to registered bank account.`
      ];
    }
  }
  // 4. How to apply inquiry
  else if (/apply|aavedan|form|portal|csc|kaise kare|आवेदन|फॉर्म|रजिस्ट्रेशन/.test(qLower)) {
    if (isHinglish) {
      answer = `${schemeName} me aavedan karne ka tarika: ${howToApply}`;
      keyPoints = [
        `Online aavedan: ${scheme.officialLink || 'Official Website'}`,
        'Offline aavedan: Nazdeeki CSC (Jan Seva Kendra) ya Block Krishi Karyalaya me sampark karein.'
      ];
    } else if (isHindi) {
      answer = `${schemeName} में आवेदन करने की विधि: ${howToApply}`;
      keyPoints = [
        `ऑनलाइन आवेदन: ${scheme.officialLink || 'आधिकारिक वेबसाइट'}`,
        'ऑफलाइन: निकटतम जन सेवा केंद्र (सीएससी) या खंड कृषि कार्यालय में संपर्क करें।'
      ];
    } else {
      answer = `Application procedure for ${schemeName}: ${howToApply}`;
      keyPoints = [
        `Online registration: ${scheme.officialLink || 'Official Portal'}`,
        'Offline: Visit nearest Common Service Centre (CSC) or district agriculture office.'
      ];
    }
  }
  // 5. General Scheme Overview
  else {
    const desc = scheme.shortDescription[isHindi ? 'hi' : 'en'] || scheme.shortDescription.en;
    if (isHinglish) {
      answer = `${schemeName}: ${desc}. Iska laabh lene ke liye aavedan portal ya CSC se karein.`;
      keyPoints = [
        `Mukhya Laabh: ${benefits}`,
        `Patrata: ${eligibility}`
      ];
    } else if (isHindi) {
      answer = `${schemeName}: ${desc}। योजना का लाभ लेने हेतु पात्रता व नियमों की जांच करें।`;
      keyPoints = [
        `मुख्य लाभ: ${benefits}`,
        `पात्रता: ${eligibility}`
      ];
    } else {
      answer = `${schemeName}: ${desc}`;
      keyPoints = [
        `Primary Benefit: ${benefits}`,
        `Eligibility: ${eligibility}`
      ];
    }
  }

  return {
    success: true,
    schemeId: scheme.id,
    question,
    language: detectedLang,
    answer,
    keyPoints: keyPoints.filter(Boolean),
    officialLink: scheme.officialLink,
    source: 'Official Govt Scheme Dataset',
    disclaimer: isHinglish
      ? 'Ye jankari sarkari guidelines par aadharit hai. Antim niyam official portal par dekhein.'
      : isHindi
      ? 'यह जानकारी सरकारी मार्गदर्शिकाओं पर आधारित है। नवीनतम स्थिति हेतु आधिकारिक पोर्टल देखें।'
      : 'This information is based on official government guidelines. Verify latest deadlines on official portal.',
    provider: 'deterministic'
  };
};

/**
 * Ask AI (Groq with Gemini/deterministic fallback) about a Government Scheme
 */
const askSchemeGroqAI = async ({ scheme, question, lang = 'hi' }) => {
  if (!scheme) {
    throw new Error('Scheme details are required.');
  }

  const cleanQuestion = (question || '').trim();
  if (!cleanQuestion) {
    return buildDeterministicSchemeAnswer({ scheme, question: 'Overview', lang });
  }

  const detectedLang = detectLanguageStyle(cleanQuestion);
  const isHinglish = detectedLang === 'hinglish';
  const isHindi = detectedLang === 'hindi';

  let targetLangDesc = 'simple, friendly English';
  if (isHinglish) {
    targetLangDesc = 'natural conversational Hinglish (Hindi written in Roman/English alphabet, like "Aap is yojana ke liye aavedan online ya CSC se kar sakte hain...")';
  } else if (isHindi) {
    targetLangDesc = 'clear Hindi in Devanagari script (हिंदी लिपि)';
  }

  // Scheme Context String
  const schemeContext = `
SCHEME NAME: ${scheme.name.en} / ${scheme.name.hi}
CATEGORY: ${scheme.category} | LEVEL: ${scheme.level}
SHORT SUMMARY: ${scheme.shortDescription.en} | ${scheme.shortDescription.hi}
FULL DETAILS: ${scheme.description.en} | ${scheme.description.hi}
BENEFITS / SUBSIDY: ${scheme.benefits.en} | ${scheme.benefits.hi}
ELIGIBILITY: ${scheme.eligibility.en} | ${scheme.eligibility.hi}
DOCUMENTS REQUIRED: ${(scheme.documentsRequired?.en || []).join(', ')}
HOW TO APPLY: ${scheme.howToApply.en} | ${scheme.howToApply.hi}
OFFICIAL PORTAL: ${scheme.officialLink}
SPECIAL NOTES: ${scheme.notes?.en || ''} | ${scheme.notes?.hi || ''}
`;

  const prompt = `You are Khetii's Senior Government Scheme Advisor assisting an Indian farmer.
A farmer is viewing the official scheme details and has asked a specific question.

SCHEME OFFICIAL CONTEXT:
${schemeContext}

FARMER'S QUESTION: "${cleanQuestion}"
FARMER'S LANGUAGE STYLE: ${detectedLang.toUpperCase()} (You MUST reply strictly in ${targetLangDesc})

INSTRUCTIONS:
1. Ground your answer 100% on the official scheme details provided above. Do NOT hallucinate rules, eligibility, or fake deadlines.
2. Reply strictly in ${targetLangDesc}. If the farmer asked in Hinglish, reply in natural farmer Hinglish. If in Hindi, reply in Devanagari Hindi. If in English, reply in English.
3. Be direct, clear, empathetic, and encouraging. Explain complex government terminology in simple rural terms.
4. Provide 2-4 practical bullet points in "keyPoints".
5. Respond ONLY with valid JSON matching this schema:
{
  "answer": "2-3 clear, conversational sentences answering the farmer's question directly",
  "keyPoints": ["Actionable point 1", "Actionable point 2", "Actionable point 3"],
  "officialLink": "${scheme.officialLink}",
  "disclaimer": "Short disclaimer in ${detectedLang}"
}`;

  // 1. Try Groq AI (Primary)
  if (isGroqConfigured()) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are Khetii AI Government Scheme Advisor. Always respond with valid JSON only in ${targetLangDesc}.`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content);
      if (parsed && parsed.answer && Array.isArray(parsed.keyPoints)) {
        return {
          success: true,
          schemeId: scheme.id,
          question: cleanQuestion,
          language: detectedLang,
          answer: parsed.answer,
          keyPoints: parsed.keyPoints,
          officialLink: scheme.officialLink,
          source: 'Groq AI Scheme Advisor (Grounded in Govt Dataset)',
          disclaimer: parsed.disclaimer || (isHinglish
            ? 'Ye salah sarkari disha-nirdeshon par aadharit hai. Aavedan se pehle official portal par rules verify karein.'
            : isHindi
            ? 'यह परामर्श आधिकारिक सरकारी दिशा-निर्देशों पर आधारित है। आवेदन करने से पहले आधिकारिक वेबसाइट देखें।'
            : 'Advisory based on official government scheme guidelines. Verify latest updates on the official portal.'),
          provider: 'groq'
        };
      }
    } catch (err) {
      console.warn('[Scheme AI] Groq completion notice (falling back):', err.message);
    }
  }

  // 2. Try Gemini AI (Secondary fallback)
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

      if (parsed && parsed.answer && Array.isArray(parsed.keyPoints)) {
        return {
          success: true,
          schemeId: scheme.id,
          question: cleanQuestion,
          language: detectedLang,
          answer: parsed.answer,
          keyPoints: parsed.keyPoints,
          officialLink: scheme.officialLink,
          source: 'Gemini AI Scheme Advisor',
          disclaimer: parsed.disclaimer || 'Advisory based on official government guidelines.',
          provider: 'gemini'
        };
      }
    } catch (err) {
      console.warn('[Scheme AI] Gemini completion notice (falling back):', err.message);
    }
  }

  // 3. Fallback to deterministic
  return buildDeterministicSchemeAnswer({ scheme, question: cleanQuestion, lang });
};

module.exports = {
  isGroqConfigured,
  askSchemeGroqAI,
  buildDeterministicSchemeAnswer
};
