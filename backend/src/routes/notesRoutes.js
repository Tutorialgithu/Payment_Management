const express = require('express');
const router = express.Router();
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  clearAllNotes
} = require('../controllers/notesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote)
  .delete(clearAllNotes);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
