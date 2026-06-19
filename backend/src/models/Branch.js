const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Branch ID (slug) is required'],
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
    },
    location: {
      type: String,
      required: [true, 'Branch location is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;
