const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Service slug ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    branchId: {
      type: String,
      required: [true, 'Branch ID is required'],
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    icon: {
      type: String,
      required: [true, 'Service icon (emoji/unicode) is required'],
    },
    color: {
      type: String,
      required: [true, 'Service primary color theme is required'],
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
    },
    prefix: {
      type: String,
      required: [true, 'Token prefix letter is required'],
      unique: true,
      uppercase: true,
    },
    avgServiceTime: {
      type: Number,
      default: 10, // Average service time in minutes
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
