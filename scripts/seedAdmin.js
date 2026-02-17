const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // adjust path
require("dotenv").config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("✅ Admin already exists");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash("Admin@123", 12);

    await User.create({
      email: "adminhomeservice@gmail.com",
      password: passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin created: adminhomeservice@gmail.com / Admin@123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedAdmin();
