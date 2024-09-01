const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth");
const User = require("../model/User");
const Budget = require("../model/Budget");
const Expense = require("../model/Expense");

// GET BUDGET BY USER
router.get("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const today = new Date();
    const budgets = await Budget.find({ user: user._id }).populate("category");
    const budgetsWithExpenses = [];

    for (let budget of budgets) {
      if (today > new Date(budget.endDate)) {
        budget.isActive = false;
      }

      const totalExpenses = await Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(user._id),
            category: new mongoose.Types.ObjectId(budget.category._id),

            date: {
              $gte: new Date(budget.startDate),
              $lte: new Date(budget.endDate),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      const totalAmount =
        totalExpenses.length > 0 ? totalExpenses[0].totalAmount : 0;

      if (totalAmount > budget.amount) {
        budget.isOverspent = true;
      }

      budget.totalExpenses = totalAmount;

      await budget.save();
      budgetsWithExpenses.push({
        ...budget.toObject(),
        totalExpenses: totalAmount,
      });
    }

    budgetsWithExpenses.sort((a, b) => {
      const categoryA = a.category.name.toUpperCase();
      const categoryB = b.category.name.toUpperCase();

      if (categoryA < categoryB) {
        return -1;
      }
      if (categoryA > categoryB) {
        return 1;
      }
      return 0;
    });

    return res.status(200).json(budgetsWithExpenses);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get budgets by you.", error: e.message });
  }
});

// GET BUDGET BY ID
router.get("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const budget = await Budget.findById(req.params.id).populate("category");
    if (!budget) return res.status(400).json({ msg: "Budget not found" });

    const today = new Date();

    if (today > new Date(budget.endDate)) {
      budget.isActive = false;
    }

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          category: budget.category,
          date: {
            $gte: new Date(budget.startDate),
            $lte: new Date(budget.endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalAmount =
      totalExpenses.length > 0 ? totalExpenses[0].totalAmount : 0;

    if (totalAmount > budget.amount) {
      budget.isOverspent = true;
    }

    budget.totalExpenses = totalAmount;

    await budget.save();
    return res.status(200).json({
      ...budget.toObject(),
      totalExpenses: totalAmount,
    });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get budget by you.", error: e.message });
  }
});

// CREATE BUDGET
router.post("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const { category, amount, startDate, endDate } = req.body;

    if (!category || !amount || !startDate || !endDate) {
      return res.status(400).json({
        msg: "Category, amount, start date and end date are required.",
      });
    }

    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);

    const existingBudgets = await Budget.find({
      user: user._id,
      category,
      $or: [
        {
          $and: [
            { startDate: { $lte: newEndDate } },
            { endDate: { $gte: newStartDate } },
          ],
        },
      ],
    });

    if (existingBudgets.length > 0) {
      return res
        .status(400)
        .json({ msg: "Budget period overlaps with an existing budget." });
    }

    const newBudget = await Budget.create({
      user: user._id,
      category,
      amount,
      startDate,
      endDate,
    });

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          category: newBudget.category,
          date: {
            $gte: new Date(newBudget.startDate),
            $lte: new Date(newBudget.endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalAmount =
      totalExpenses.length > 0 ? totalExpenses[0].totalAmount : 0;

    if (totalAmount > newBudget.amount) {
      newBudget.isOverspent = true;
    }

    newBudget.totalExpenses = totalAmount;

    const today = new Date();
    if (today > new Date(newBudget.endDate)) {
      newBudget.isActive = false;
    }

    await newBudget.save();
    return res.status(200).json(newBudget);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to create new budget.", error: e.message });
  }
});

// EDIT BUDGET
router.put("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(400).json({ msg: "Budget not found" });

    if (budget.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't edit this budget." });
    }

    const { category, amount, startDate, endDate } = req.body;

    if (startDate && endDate) {
      const newStartDate = new Date(startDate);
      const newEndDate = new Date(endDate);
      const today = new Date().toISOString().split("T")[0];

      if (newStartDate.toISOString().split("T")[0] < today) {
        return res
          .status(400)
          .json({ msg: "Start date cannot be before today." });
      }

      if (newEndDate < newStartDate) {
        return res
          .status(400)
          .json({ msg: "End date cannot be before start date." });
      }

      const existingBudgets = await Budget.find({
        user: user._id,
        category,
        _id: { $ne: budget._id },
        $or: [
          {
            $and: [
              { startDate: { $lte: newEndDate } },
              { endDate: { $gte: newStartDate } },
            ],
          },
        ],
      });

      if (existingBudgets.length > 0) {
        return res
          .status(400)
          .json({ msg: "Budget period overlaps with an existing budget." });
      }

      budget.category = category || budget.category;
      budget.amount = amount || budget.amount;
      budget.startDate = startDate || budget.startDate;
      budget.endDate = endDate || budget.endDate;
    }

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          category: budget.category,
          date: {
            $gte: new Date(budget.startDate),
            $lte: new Date(budget.endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalAmount =
      totalExpenses.length > 0 ? totalExpenses[0].totalAmount : 0;

    if (totalAmount > budget.amount) {
      budget.isOverspent = true;
    } else {
      budget.isOverspent = false;
    }

    budget.totalExpenses = totalAmount;

    const today = new Date();
    if (today > new Date(budget.endDate)) {
      budget.isActive = false;
    }

    await budget.save();
    return res.status(200).json(budget);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to edit budget.", error: e.message });
  }
});

// DELETE BUDGET
router.delete("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(400).json({ msg: "Budget not found" });

    if (budget.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't delete this budget." });
    }

    await Budget.findByIdAndDelete(budget._id);
    return res.status(200).json({ msg: "Deleted budget successfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to delete budget.", error: e.message });
  }
});

module.exports = router;
