const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { protect, isManager } = require('../middleware/auth');

// POST /api/leads — create lead (manager)
router.post('/', protect, isManager, async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    return res.status(201).json({ success: true, data: lead, message: 'Lead created' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Phone number already exists' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/leads — all leads with filters (manager)
router.get('/', protect, isManager, async (req, res) => {
  try {
    const { status, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Lead.countDocuments(filter)
    ]);
    return res.json({
      success: true,
      data: { leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/leads/:id — update lead (manager + assigned employee)
router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const isOwner = lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString();
    if (req.user.role !== 'manager' && !isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'name email');
    return res.json({ success: true, data: updated, message: 'Lead updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/leads/:id — delete lead (manager only)
router.delete('/:id', protect, isManager, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    return res.json({ success: true, data: null, message: 'Lead deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leads/:id/note — add note to lead
router.post('/:id/note', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Note text required' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const isOwner = lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString();
    if (req.user.role !== 'manager' && !isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    lead.notes.push({ text, addedBy: req.user._id, addedAt: new Date() });
    await lead.save();
    return res.json({ success: true, data: lead, message: 'Note added' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/leads/assigned — leads assigned to current employee
router.get('/assigned', protect, async (req, res) => {
  try {
    const leads = await Lead.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: leads });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
