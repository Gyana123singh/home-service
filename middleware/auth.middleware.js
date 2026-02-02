const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // admin from env
    if (decoded.role === "admin" && decoded.id === "admin") {
      req.user = decoded;
      return next();
    }

    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
