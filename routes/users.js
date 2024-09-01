const express = require("express");
const User = require("../model/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const isAuth = require("../middleware/auth");

require("dotenv").config();
const { SECRET_KEY } = process.env;

// GET OWN USER INFO
router.get("/", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    return res.status(200).json(user);
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to get own user info", error: e.message });
  }
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let emailExist = await User.findOne({ email });
    let usernameExist = await User.findOne({ username });

    if (emailExist)
      return res.status(400).json({ msg: "Email already registered" });
    if (usernameExist)
      return res.status(400).json({ msg: "Username already exist" });

    let salt = bcrypt.genSaltSync(10);
    let hashedPassword = bcrypt.hashSync(password, salt);
    let newUser = new User({ ...req.body, password: hashedPassword });
    newUser.save();

    return res.json({ msg: "Registered Successfully", user: newUser });
  } catch (e) {
    return res
      .status(400)
      .json({ msg: "Failed to register", error: e.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    let userFound = await User.findOne({ username });

    if (!userFound) return res.status(400).json({ msg: "Invalid Credentials" });

    let isMatch = bcrypt.compareSync(password, userFound.password);

    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    jwt.sign(
      { data: userFound },
      SECRET_KEY,
      { expiresIn: "24h" },
      (err, token) => {
        if (err)
          return res
            .status(400)
            .json({ msg: "Failed to login", error: e.message });
        return res.json({
          token,
          user: userFound,
          msg: "Logged In Successfully",
        });
      }
    );
  } catch (e) {
    return res.status(400).json({ msg: "Invalid Credentials" });
  }
});

module.exports = router;
