const User = require("../models/User");

exports.checkVendorSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== "vendor") return next();

    const sub = user.subscription;

    if (sub && sub.status === "active" && sub.endDate) {
      const now = new Date();

      // ⛔ Auto-expire if date passed
      if (new Date(sub.endDate) < now) {
        sub.status = "expired";
        await user.save();
      }
    }

    // 🚫 Block access if not active
    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to access this feature",
      });
    }

    next();
  } catch (err) {
    console.error("Subscription check error:", err);
    res.status(500).json({ message: "Subscription check failed" });
  }
};