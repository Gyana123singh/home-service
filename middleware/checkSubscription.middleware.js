const User = require("../models/User");

exports.checkVendorSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== "vendor") return next();

    // 🔓 Allow going offline without checking subscription status
    if (req.originalUrl && req.originalUrl.includes("/set-online-status") && req.body && req.body.isOnline === false) {
      return next();
    }

    // 🔓 By default, bypass subscription checks unless ENABLE_SUBSCRIPTION_CHECK=true is set
    if (process.env.ENABLE_SUBSCRIPTION_CHECK !== "true") {
      return next();
    }

    const sub = user.subscription;

    if (sub && sub.status === "active" && sub.endDate) {
      const now = new Date();

      // ⛔ Auto-expire if date passed
      if (new Date(sub.endDate) < now) {
        sub.status = "expired";
        user.isOnline = false;
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