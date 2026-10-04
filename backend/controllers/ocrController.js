const OcrScan = require('../models/OcrScan');
const { extractTextWithOcr } = require('../services/ocrService');

// @desc Process uploaded image or PDF with OCR
// @route POST /api/ocr
const processDocumentOcr = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file (JPG, PNG, WEBP) or PDF.' });
    }

    const language = req.body.language || req.user?.language || 'eng';

    // Extract text via external OCR.space API
    const ocrResult = await extractTextWithOcr(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      language
    );

    let savedScan = null;
    if (req.user) {
      savedScan = await OcrScan.create({
        user: req.user._id,
        fileName: req.file.originalname,
        extractedText: ocrResult.text
      });
    }

    // Explicit project constraint: Uploaded files are processed and discarded; do NOT store raw files.

    res.json({
      success: true,
      message: 'Text extracted successfully.',
      fileName: req.file.originalname,
      extractedText: ocrResult.text,
      scanId: savedScan?._id || null,
      createdAt: savedScan?.createdAt || new Date()
    });
  } catch (error) {
    res.status(502).json({
      success: false,
      message: error.message || 'OCR processing failed. Please check your image clarity and server configuration.'
    });
  }
};

// @desc Get current user's OCR scan history (for recent activity)
// @route GET /api/ocr/history
const getOcrHistory = async (req, res, next) => {
  try {
    const scans = await OcrScan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(scans);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processDocumentOcr,
  getOcrHistory
};
