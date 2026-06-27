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

    const adminEmail = process.env.ADMIN_EMAIL || "adminhomeservice@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await User.create({
      email: adminEmail,
      password: passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedAdmin();
