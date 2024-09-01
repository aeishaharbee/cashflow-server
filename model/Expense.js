const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
});

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;
