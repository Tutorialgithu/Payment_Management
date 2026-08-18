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

router.use(protect);

router.route('/').get(getPeople).post(createPerson);
router.route('/:id').get(getPersonById).put(updatePerson).delete(deletePerson);

module.exports = router;
