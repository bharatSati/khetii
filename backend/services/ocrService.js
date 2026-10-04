const axios = require('axios');
const FormData = require('form-data');

/**
 * Extract text from image or PDF buffer using OCR.space API
 * @param {Buffer} fileBuffer
 * @param {string} originalname
 * @param {string} mimetype
 * @param {string} language - 'eng' or 'hin'
 */
const extractTextWithOcr = async (fileBuffer, originalname, mimetype, language = 'eng') => {
  const apiKey = process.env.OCR_API_KEY;
  const apiUrl = process.env.OCR_API_URL || 'https://api.ocr.space/parse/image';

  if (!apiKey) {
    throw new Error('OCR_API_KEY is not configured on the server. Please add your key to server .env.');
  }

  // Map language to OCR.space language codes
  // 'en' -> 'eng', 'hi' -> 'hin'
  let ocrLang = 'eng';
  if (language === 'hi' || language === 'hin') {
    ocrLang = 'hin';
  }

  const formData = new FormData();
  formData.append('apikey', apiKey);
  formData.append('language', ocrLang);
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', ocrLang === 'hin' ? '2' : '1'); // Engine 2 often better for Devanagari

  // Append file buffer
  formData.append('file', fileBuffer, {
    filename: originalname,
    contentType: mimetype
  });

  try {
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 25000 // OCR may take up to 25s for large documents
    });

    const data = response.data;

    if (data.IsErroredOnProcessing) {
      const errorMsg = data.ErrorMessage ? data.ErrorMessage.join(', ') : 'OCR processing failed on OCR.space';
      throw new Error(`OCR Processing Error: ${errorMsg}`);
    }

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      return {
        text: '',
        message: 'No readable text was detected in the document.'
      };
    }

    const fullText = data.ParsedResults.map((r) => r.ParsedText).join('\n\n').trim();

    return {
      text: fullText,
      exitCode: data.OCRExitCode,
      processingTimeInMilliseconds: data.ProcessingTimeInMilliseconds
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('OCR service request timed out. Please try with a clearer or smaller file.');
    }
    if (error.response) {
      if (error.response.status === 403 || error.response.status === 401) {
        throw new Error('Invalid or expired OCR_API_KEY.');
      }
    }
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};

module.exports = {
  extractTextWithOcr
};
