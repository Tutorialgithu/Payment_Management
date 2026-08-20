const Note = require('../models/Note');

// @desc    Get all quick notes for logged in admin
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ adminId: req.admin._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res, next) => {
  try {
    const { personName, remainingAmount, noteText } = req.body;

    if (!noteText && !personName && !remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Note detail or borrower name or remaining amount is required'
      });
    }

    const note = await Note.create({
      adminId: req.admin._id,
      personName: personName ? personName.trim() : '',
      remainingAmount: remainingAmount ? remainingAmount.trim() : '',
      noteText: noteText ? noteText.trim() : '',
      isResolved: false
    });

    res.status(201).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findOne({ _id: req.params.id, adminId: req.admin._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const { personName, remainingAmount, noteText, isResolved } = req.body;

    if (personName !== undefined) note.personName = personName.trim();
    if (remainingAmount !== undefined) note.remainingAmount = remainingAmount.trim();
    if (noteText !== undefined) note.noteText = noteText.trim();
    if (isResolved !== undefined) note.isResolved = Boolean(isResolved);

    await note.save();

    res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, adminId: req.admin._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notes
// @route   DELETE /api/notes
// @access  Private
exports.clearAllNotes = async (req, res, next) => {
  try {
    await Note.deleteMany({ adminId: req.admin._id });

    res.status(200).json({
      success: true,
      message: 'All notes cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
