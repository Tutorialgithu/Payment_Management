const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: ''
    },
    alternateMobile: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    idProofType: {
      type: String,
      enum: ['', 'Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Other'],
      default: ''
    },
    idProofNumber: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  { timestamps: true }
);

PersonSchema.index({ name: 'text', mobile: 'text', email: 'text' });

module.exports = mongoose.model('Person', PersonSchema);
