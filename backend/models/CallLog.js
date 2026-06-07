const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, required: true },
  employeePhone: { type: String },
  callType: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed', 'rejected'],
    required: true
  },
  contactNumber: { type: String, required: true },
  contactName: { type: String, default: 'Unknown' },
  duration: { type: Number, default: 0 },
  timestamp: { type: Date, required: true },
  deviceId: { type: String },
  synced: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

callLogSchema.index({ employeeId: 1, timestamp: -1 });
callLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
