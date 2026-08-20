const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true
    },
    personName: {
      type: String,
      trim: true,
      default: ''
    },
    remainingAmount: {
      type: String,
      trim: true,
      default: ''
    },
    noteText: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true
    },
    isResolved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Note', NoteSchema);
