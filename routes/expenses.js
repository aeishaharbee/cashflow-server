const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth");
const User = require("../model/User");
const Expense = require("../model/Expense");

// GET EXPENSES BY USER
router.get("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const expenses = await Expense.find({ user: user._id })
      .populate("category")
      .exec();

    expenses.sort((a, b) => {
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

    return res.status(200).json(expenses);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get expenses by you.", error: e.message });
  }
});

// GET EXPENSES BY ID
router.get("/:id", isAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate("category");
    return res.status(200).json(expense);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get expenses by you.", error: e.message });
  }
});

// CREATE NEW EXPENSES
router.post("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const { category, amount, date, description } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ msg: "Category and amount are required." });
    }

    const newExpense = await Expense.create({
      user: user._id,
      category,
      amount,
      date,
      description: description || null,
    });

    await newExpense.save();
    return res.status(200).json(newExpense);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to create new expenses.", error: e.message });
  }
});

// EDIT EXPENSES
router.put("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(400).json({ msg: "Expense not found" });

    if (expense.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't edit this expense." });
    }

    const fieldsToUpdate = ["category", "amount", "date", "description"];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();
    return res.status(200).json(expense);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to edit expenses.", error: e.message });
  }
});

// DELETE EXPENSES
router.delete("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(400).json({ msg: "Expense not found" });

    if (expense.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't delete this expense." });
    }

    await Expense.findByIdAndDelete(expense._id);
    return res.status(200).json({ msg: "Deleted expense successfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to delete expenses.", error: e.message });
  }
});

module.exports = router;
