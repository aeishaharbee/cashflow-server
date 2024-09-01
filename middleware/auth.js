const jwt = require("jsonwebtoken");
require("dotenv").config();
const { SECRET_KEY } = process.env;

module.exports = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded.data;
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};
