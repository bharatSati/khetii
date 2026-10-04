const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'kheti_default_secret_key';
  return jwt.sign({ id: userId }, secret, { expiresIn: '30d' });
};

// @desc Register a new farmer
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      language,
      state,
      district,
      city,
      latitude,
      longitude,
      locationRecorded,
      landSizeAcres,
      mainCrops
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Constraint 13: Store password in plain text - DO NOT HASH
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      language: language === 'en' ? 'en' : 'hi',
      state: state ? state.trim() : 'Delhi',
      district: district ? district.trim() : 'New Delhi',
      city: city ? city.trim() : 'Delhi',
      latitude: latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : 28.6139,
      longitude: longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : 77.2090,
      locationRecorded: Boolean(locationRecorded),
      landSizeAcres: Number(landSizeAcres) || 0,
      mainCrops: Array.isArray(mainCrops) ? mainCrops : mainCrops ? mainCrops.split(',').map((c) => c.trim()) : []
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login farmer
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Constraint 13: Direct plain-text comparison
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Logged in successfully.',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current authenticated user profile
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile & preferences
// @route PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, language, state, district, city, latitude, longitude, locationRecorded, landSizeAcres, mainCrops } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name !== undefined) user.name = name.trim();
    if (language !== undefined && ['en', 'hi'].includes(language)) user.language = language;
    if (state !== undefined) user.state = state.trim();
    if (district !== undefined) user.district = district.trim();
    if (city !== undefined) user.city = city.trim();
    if (latitude !== undefined && !isNaN(Number(latitude))) user.latitude = Number(latitude);
    if (longitude !== undefined && !isNaN(Number(longitude))) user.longitude = Number(longitude);
    if (locationRecorded !== undefined) user.locationRecorded = Boolean(locationRecorded);
    if (landSizeAcres !== undefined) user.landSizeAcres = Number(landSizeAcres);
    if (mainCrops !== undefined) {
      user.mainCrops = Array.isArray(mainCrops)
        ? mainCrops
        : mainCrops.split(',').map((c) => c.trim()).filter(Boolean);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe
};
