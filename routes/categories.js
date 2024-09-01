const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth");
const Category = require("../model/Category");
const User = require("../model/User");

// GET ALL CATEGORIES
router.get("/", isAuth, async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ availableFor: "Everyone" }, { user: req.user._id }],
    });

    return res.status(200).json(categories);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to create new expenses.", error: e.message });
  }
});

// CREATE NEW CATEGORIES
router.post("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ msg: "Name and amount are required." });
    }

    const newCategory = await Category.create({
      user: user._id,
      name,
      description,
      availableFor: "User",
    });

    await newCategory.save();
    return res.status(200).json(newCategory);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to create new expenses.", error: e.message });
  }
});

// EDIT CATEGORIES MADE
router.put("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(400).json({ msg: "Category not found" });

    if (category.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't edit this category." });
    }

    const fieldsToUpdate = ["name", "description"];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await category.save();
    return res.status(200).json(category);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to edit your category.", error: e.message });
  }
});

// DELETE CATEGORIES MADE
router.delete("/:id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(400).json({ msg: "Category not found" });

    if (!category.user || category.user.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: "You can't delete this category." });
    }

    await Category.findByIdAndDelete(category._id);
    return res.status(200).json({ msg: "Category deleted successfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to delete your category.", error: e.message });
  }
});

module.exports = router;
