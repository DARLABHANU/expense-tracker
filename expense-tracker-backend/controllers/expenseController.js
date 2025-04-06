const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    console.error('Get Expenses Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Public
const addExpense = async (req, res) => {
  const { description, amount } = req.body;

  // Validation
  if (!description || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both description and amount'
    });
  }

  try {
    const newExpense = new Expense({
      description,
      amount
    });

    const savedExpense = await newExpense.save();
    
    res.status(201).json({
      success: true,
      data: savedExpense
    });
  } catch (err) {
    console.error('Add Expense Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense ID format'
    });
  }

  try {
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: deletedExpense
    });
  } catch (err) {
    console.error('Delete Expense Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense
};