const express = require('express');
const router = express.Router();
const { analyzeFarmImage, isGeminiConfigured, isGroqConfigured } = require('../services/imageAiService');

/**
 * @route   POST /api/digital-services/image-analyze
 * @desc    Analyze crop, pest, disease, leaf, package, or agricultural document image using AI vision
 * @access  Public
 */
router.post('/image-analyze', async (req, res, next) => {
  try {
    const { imageBase64, mimeType, language, userNotes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data (imageBase64) is required.'
      });
    }

    const analysis = await analyzeFarmImage({
      imageBase64,
      mimeType,
      language: language || 'hi',
      userNotes: userNotes || ''
    });

    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('[DigitalServicesRoute] Error analyzing image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze image with AI vision.'
    });
  }
});

/**
 * @route   GET /api/digital-services/status
 * @desc    Get status of digital services and vision AI provider
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    visionConfigured: isGeminiConfigured() || isGroqConfigured(),
    providers: {
      gemini: isGeminiConfigured(),
      groq: isGroqConfigured()
    },
    services: [
      'image-ai',
      'images-to-pdf',
      'smart-scanner',
      'file-compressor'
    ]
  });
});

module.exports = router;
