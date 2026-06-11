const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      required: [true, 'Token display ID (e.g. A089) is required'],
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    service: {
      type: String,
      required: [true, 'Service slug (e.g. hospital) is required'],
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'serving', 'completed', 'cancelled'],
      default: 'waiting',
    },
    priority: {
      type: String,
      enum: ['normal', 'senior', 'vip', 'emergency'],
      default: 'normal',
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    sequenceNumber: {
      type: Number,
      required: [true, 'Sequence number is required for daily resets'],
    },
    waitTime: {
      type: Number,
      default: 0, // In minutes
    },
    name: {
      type: String,
      required: [true, 'User full name is required on the token'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required on the token'],
    },
    qrCodeUrl: {
      type: String, // Base64 representation of QR code
    },
  },
  {
    timestamps: true,
  }
);

// Add index on service + status + createdAt for fast queries
tokenSchema.index({ service: 1, status: 1, createdAt: 1 });

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
