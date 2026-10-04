const path = require('path');
const fs = require('fs');

const insuranceFilePath = path.join(__dirname, '..', 'data', 'insurance.json');

// @desc Get PMFBY crop insurance guide data
// @route GET /api/insurance
const getInsuranceGuide = async (req, res, next) => {
  try {
    const raw = fs.readFileSync(insuranceFilePath, 'utf-8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsuranceGuide
};
