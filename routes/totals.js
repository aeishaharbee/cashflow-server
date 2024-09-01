const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth");
const User = require("../model/User");
const Expense = require("../model/Expense");
const Budget = require("../model/Budget");

function getCurrentMonthDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { startOfMonth, endOfMonth };
}

router.get("/spending", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();

    const totalSpending = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
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

    const spendingByCategory = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $project: {
          _id: 0,
          category: "$categoryDetails.name",
          totalAmount: 1,
        },
      },
    ]);

    return res.status(200).json({
      totalSpending:
        totalSpending.length > 0 ? totalSpending[0].totalAmount : 0,
      spendingByCategory,
    });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to retrieve spending data.", error: e.message });
  }
});

module.exports = router;
