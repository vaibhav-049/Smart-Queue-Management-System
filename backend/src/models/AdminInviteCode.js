const mongoose = require('mongoose');

const adminInviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  service: {
    type: String,
    required: true,
    enum: ['hospital', 'college', 'salon'],
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('AdminInviteCode', adminInviteCodeSchema);
