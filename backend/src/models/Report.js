const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
      unique: true,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    completedTokens: {
      type: Number,
      default: 0,
    },
    cancelledTokens: {
      type: Number,
      default: 0,
    },
    avgWaitTime: {
      type: Number,
      default: 0, // In minutes
    },
    satisfactionRate: {
      type: Number,
      default: 95.0, // Percentage
    },
    serviceUsage: {
      type: Map,
      of: Number,
      default: {}, // e.g. { hospital: 35, bank: 25 }
    },
    hourlyVisitors: {
      type: Map,
      of: Number,
      default: {}, // e.g. { '9AM': 15, '10AM': 22 }
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
