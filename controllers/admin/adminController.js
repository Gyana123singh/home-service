const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // env credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // check email
    if (email !== adminEmail) {
      return res.status(401).json({ message: "Invalid admin email" });
    }

    // compare password
    const isPasswordMatch = password === adminPassword;

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    // generate token
    const token = jwt.sign(
      {
        id: "admin",
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        email: adminEmail,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
