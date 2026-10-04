const Transaction = require('../models/Transaction');

// @desc Get user's transactions with optional filtering
// @route GET /api/finance/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, limit = 100 } = req.query;

    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      total: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add a new transaction
// @route POST /api/finance/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || amount === undefined || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required.' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: "Type must be either 'income' or 'expense'." });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: Math.abs(Number(amount)),
      category: category.trim(),
      description: description ? description.trim() : '',
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({
      message: 'Transaction saved successfully.',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update a transaction
// @route PUT /api/finance/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this transaction.' });
    }

    const { type, amount, category, description, date } = req.body;

    if (type !== undefined && ['income', 'expense'].includes(type)) transaction.type = type;
    if (amount !== undefined) transaction.amount = Math.abs(Number(amount));
    if (category !== undefined) transaction.category = category.trim();
    if (description !== undefined) transaction.description = description.trim();
    if (date !== undefined) transaction.date = new Date(date);

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully.',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete a transaction
// @route DELETE /api/finance/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this transaction.' });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc Get financial summary, category breakdowns and monthly trends
// @route GET /api/finance/summary
const getFinanceSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const transactions = await Transaction.find({ user: userId }).sort({ date: 1 });

    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    const categoryBreakdown = {
      income: {},
      expense: {}
    };

    // 12 months for current year
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0,
      net: 0
    }));

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const isThisMonth = txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      const isThisYear = txDate.getFullYear() === currentYear;

      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (isThisMonth) thisMonthIncome += tx.amount;
        categoryBreakdown.income[tx.category] = (categoryBreakdown.income[tx.category] || 0) + tx.amount;

        if (isThisYear) {
          const m = txDate.getMonth();
          monthlyTrends[m].income += tx.amount;
        }
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        if (isThisMonth) thisMonthExpense += tx.amount;
        categoryBreakdown.expense[tx.category] = (categoryBreakdown.expense[tx.category] || 0) + tx.amount;

        if (isThisYear) {
          const m = txDate.getMonth();
          monthlyTrends[m].expense += tx.amount;
        }
      }
    });

    monthlyTrends.forEach((m) => {
      m.net = m.income - m.expense;
    });

    const netBalance = totalIncome - totalExpense;
    const thisMonthNet = thisMonthIncome - thisMonthExpense;

    res.json({
      totalIncome,
      totalExpense,
      netBalance,
      thisMonth: {
        income: thisMonthIncome,
        expense: thisMonthExpense,
        net: thisMonthNet
      },
      categoryBreakdown,
      monthlyTrends,
      totalTransactions: transactions.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinanceSummary
};
