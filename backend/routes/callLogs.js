const express = require('express');
const router = express.Router();
const CallLog = require('../models/CallLog');
const { protect, isManager } = require('../middleware/auth');
const getPusher = require('../lib/pusher');

// POST /api/calls/sync — employee sends batch of call logs
router.post('/sync', protect, async (req, res) => {
  try {
    const { calls } = req.body;
    if (!Array.isArray(calls) || calls.length === 0) {
      return res.status(400).json({ success: false, error: 'calls array required' });
    }
    const docs = calls.map((c) => ({
      ...c,
      employeeId: req.user._id,
      employeeName: req.user.name,
      employeePhone: req.user.phone || '',
      deviceId: req.user.deviceId || c.deviceId || '',
      synced: true
    }));
    const inserted = await CallLog.insertMany(docs, { ordered: false });

    // push real-time event to managers via Pusher
    const pusher = getPusher();
    if (pusher) {
      for (const log of inserted) {
        await pusher.trigger('managers', 'new_call_log', {
          employeeId: log.employeeId.toString(),
          employeeName: log.employeeName,
          callType: log.callType,
          duration: log.duration,
          timestamp: log.timestamp,
          contactNumber: log.contactNumber,
          contactName: log.contactName
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: { synced: inserted.length },
      message: `${inserted.length} call logs synced`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls — all call logs with filters (manager)
router.get('/', protect, isManager, async (req, res) => {
  try {
    const { employeeId, callType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (callType) filter.callType = callType;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [calls, total] = await Promise.all([
      CallLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      CallLog.countDocuments(filter)
    ]);
    return res.json({
      success: true,
      data: { calls, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/stats — dashboard stats (manager)
router.get('/stats', protect, isManager, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalToday, missedToday, allToday] = await Promise.all([
      CallLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } }),
      CallLog.countDocuments({ callType: 'missed', timestamp: { $gte: today, $lt: tomorrow } }),
      CallLog.find({ timestamp: { $gte: today, $lt: tomorrow } })
    ]);

    const totalDuration = allToday.reduce((sum, c) => sum + (c.duration || 0), 0);
    const avgDuration = allToday.length > 0 ? Math.round(totalDuration / allToday.length) : 0;

    const dialerMap = {};
    allToday.forEach((c) => {
      const id = c.employeeId.toString();
      if (!dialerMap[id]) dialerMap[id] = { employeeId: id, employeeName: c.employeeName, count: 0 };
      dialerMap[id].count++;
    });
    const topDialers = Object.values(dialerMap).sort((a, b) => b.count - a.count).slice(0, 5);
    const activeEmployees = Object.keys(dialerMap).length;

    const callsPerHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    allToday.forEach((c) => {
      const h = new Date(c.timestamp).getHours();
      callsPerHour[h].count++;
    });

    return res.json({
      success: true,
      data: { totalToday, missedToday, avgDuration, activeEmployees, topDialers, callsPerHour }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/realtime — latest 50 calls (manager)
router.get('/realtime', protect, isManager, async (req, res) => {
  try {
    const calls = await CallLog.find().sort({ timestamp: -1 }).limit(50);
    return res.json({ success: true, data: calls });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/employee/:id — calls of specific employee (manager)
router.get('/employee/:id', protect, isManager, async (req, res) => {
  try {
    const { callType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { employeeId: req.params.id };
    if (callType) filter.callType = callType;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [calls, total] = await Promise.all([
      CallLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      CallLog.countDocuments(filter)
    ]);

    const allCalls = await CallLog.find({ employeeId: req.params.id });
    const totalDuration = allCalls.reduce((s, c) => s + (c.duration || 0), 0);
    const avgDuration = allCalls.length > 0 ? Math.round(totalDuration / allCalls.length) : 0;
    const missed = allCalls.filter((c) => c.callType === 'missed').length;

    return res.json({
      success: true,
      data: {
        calls,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        stats: { total: allCalls.length, missed, avgDuration }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
