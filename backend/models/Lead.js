const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  source: { type: String },
  status: {
    type: String,
    enum: ['new', 'contacted', 'interested', 'not_interested', 'converted', 'lost'],
    default: 'new'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [noteSchema],
  lastCallAt: { type: Date },
  followUpDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema);
