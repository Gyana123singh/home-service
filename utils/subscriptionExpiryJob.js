const User = require("../models/User");

exports.expireSubscriptions = async () => {
  try {
    const now = new Date();
    // Find active vendors whose subscription has expired
    const expiredVendors = await User.find({
      role: "vendor",
      "subscription.status": "active",
      "subscription.endDate": { $lt: now }
    });

    console.log(`Checking expired subscriptions. Found ${expiredVendors.length} expired vendors.`);

    for (const vendor of expiredVendors) {
      vendor.subscription.status = "expired";
      vendor.isOnline = false;
      await vendor.save();
      console.log(`Expired subscription for vendor: ${vendor.firstName} ${vendor.lastName || ""} (${vendor.email || vendor.phone})`);
    }
  } catch (error) {
    console.error("EXPIRE SUBSCRIPTIONS JOB ERROR:", error);
  }
};
