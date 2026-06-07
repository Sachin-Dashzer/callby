require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const callLogRoutes = require('./routes/callLogs');
const leadRoutes = require('./routes/leads');
const { protect, isManager } = require('./middleware/auth');
const User = require('./models/User');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.set('trust proxy', 1);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// connect MongoDB once and reuse across serverless invocations
let isConnected = false;
app.use(async (_req, _res, next) => {
  if (isConnected) return next();
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  next();
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callLogRoutes);
app.use('/api/leads', leadRoutes);

// employees
app.get('/api/employees', protect, isManager, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).sort({ name: 1 });
    return res.json({ success: true, data: employees });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/employees', protect, isManager, async (req, res) => {
  try {
    const { name, email, password, phone, deviceId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });
    const user = await User.create({ name, email, password, role: 'employee', phone, deviceId });
    return res.status(201).json({ success: true, data: user, message: 'Employee created' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/employees/:id', protect, isManager, async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    return res.json({ success: true, data: employee });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/employees/:id/status', protect, isManager, async (req, res) => {
  try {
    const { isActive } = req.body;
    const employee = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    return res.json({ success: true, data: employee });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'CallTrack API running' }));

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// local dev only — Vercel handles listening itself
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
