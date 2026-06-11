const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: [true, 'Service slug is required'],
      unique: true,
      lowercase: true,
    },
    currentServing: {
      type: String,
      default: null, // displayId of current token (e.g. A089)
    },
    upcoming: {
      type: [String],
      default: [], // array of displayId of waiting tokens (e.g. ['A090', 'A091'])
    },
    totalInQueue: {
      type: Number,
      default: 0,
    },
    avgWait: {
      type: Number,
      default: 0, // average wait time in minutes
    },
    isActive: {
      type: Boolean,
      default: true, // If service queue is closed/active
    },
  },
  {
    timestamps: true,
  }
);

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;
