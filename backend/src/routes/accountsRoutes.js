const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/accountsController');
const { getEMIScheduleByAccount } = require('../controllers/emiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getAccounts).post(createAccount);
router.route('/:id').get(getAccountById).put(updateAccount).delete(deleteAccount);
router.get('/:id/emi', getEMIScheduleByAccount);

module.exports = router;
