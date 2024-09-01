const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth");
const User = require("../model/User");
const Report = require("../model/Report");
const Expense = require("../model/Expense");
const Budget = require("../model/Budget");
const Category = require("../model/Category");

function getDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET LATEST REPORT BY USER
router.get("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const latestReport = await Report.findOne({ user: user._id })
      .sort({ generatedAt: -1 })
      .populate({
        path: "categories.category",
        model: "Category",
      })
      .populate({
        path: "categories.expenses.expense",
        model: "Expense",
      })
      .populate({
        path: "categories.budget",
        model: "Budget",
      });

    if (!latestReport)
      return res.status(404).json({ msg: "No report found for the user." });

    return res.status(200).json(latestReport);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get your latest report.", error: e.message });
  }
});

// GENERATE REPORT
router.post("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ msg: "Start date and end date are required" });
    }

    const { start, end } = getDateRange(startDate, endDate);

    const expenses = await Expense.find({
      user: user._id,
      date: { $gte: start, $lte: end },
    });

    if (expenses.length === 0) {
      return res
        .status(400)
        .json({ msg: "No expenses found for the last 30 days." });
    }

    const categoriesMap = new Map();

    for (const expense of expenses) {
      const categoryId = expense.category.toString();
      if (!categoriesMap.has(categoryId)) {
        const budget = await Budget.findOne({
          user: user._id,
          category: expense.category,
        });
        categoriesMap.set(categoryId, {
          category: expense.category,
          expenses: [],
          budget: budget ? budget._id : null,
          categoryExpenses: 0,
        });
      }
      const categoryData = categoriesMap.get(categoryId);
      categoryData.expenses.push({ expense: expense._id });
      categoryData.categoryExpenses += expense.amount;
    }

    const categories = Array.from(categoriesMap.values());
    const totalExpenses = categories.reduce(
      (sum, category) => sum + category.categoryExpenses,
      0
    );

    const report = new Report({
      user: user._id,
      startDate: start,
      endDate: end,
      categories: categories,
      totalExpenses: totalExpenses,
    });

    await report.save();

    return res.status(201).json(report);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to generate report.", error: e.message });
  }
});

module.exports = router;
