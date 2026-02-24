const Coupon = require("../../models/Coupon");

exports.getAvailableCoupons = async (req, res) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  }).select("code title description discountType discountValue maxDiscount");

  res.json({ success: true, data: coupons });
};

