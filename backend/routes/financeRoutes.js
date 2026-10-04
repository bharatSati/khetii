const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinanceSummary
} = require('../controllers/financeController');

// All finance routes are private (user-scoped)
router.use(auth);

router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);
router.get('/summary', getFinanceSummary);

module.exports = router;
