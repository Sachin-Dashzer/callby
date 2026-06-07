const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, deviceId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, phone, deviceId });
    const token = signToken(user._id);
    return res.status(201).json({ success: true, data: { user, token }, message: 'Account created' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    const userObj = user.toJSON();
    return res.json({ success: true, data: { user: userObj, token }, message: 'Login successful' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    return res.json({ success: true, data: req.user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
