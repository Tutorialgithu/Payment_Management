const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  downloadReceiptPDF
} = require('../controllers/paymentsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getPayments).post(createPayment);
router.get('/:id', getPaymentById);
router.get('/:id/pdf', downloadReceiptPDF);

module.exports = router;
