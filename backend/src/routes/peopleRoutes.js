const express = require('express');
const router = express.Router();
const {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson
} = require('../controllers/peopleController');
const { protect } = require('../middleware/auth');
const { uploadBorrowerDocuments } = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/').get(getPeople).post(uploadBorrowerDocuments, createPerson);
router.route('/:id').get(getPersonById).put(uploadBorrowerDocuments, updatePerson).delete(deletePerson);

module.exports = router;
