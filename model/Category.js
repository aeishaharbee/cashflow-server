const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  availableFor: { type: String, enum: ["Everyone", "User"] },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
