const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  categories: [
    {
      _id: false,
      category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      expenses: [
        {
          _id: false,
          expense: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
        },
      ],
      budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
      categoryExpenses: { type: Number },
    },
  ],
  totalExpenses: { type: Number, required: true },
  generatedAt: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
