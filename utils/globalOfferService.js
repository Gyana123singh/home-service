const Offer = require("../models/Offer");

// ================= GET ACTIVE GLOBAL OFFER =================
async function getActiveGlobalOffer() {
  const now = new Date();

  const offer = await Offer.findOne({
    applicableType: "global",
    status: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ createdAt: -1 }); // optional safety

  return offer;
}

// ================= APPLY GLOBAL DISCOUNT =================
function applyGlobalDiscount(price, offer) {
  // Safety check
  if (!price || price <= 0) {
    return { finalAmount: 0, discountAmount: 0 };
  }

  if (!offer) {
    return { finalAmount: price, discountAmount: 0 };
  }

  let discountAmount = 0;

  if (offer.discountType === "percentage") {
    discountAmount = (price * offer.discountValue) / 100;
  } else if (offer.discountType === "flat") {
    discountAmount = offer.discountValue;
  }

  // Prevent negative price
  const finalAmount = Math.max(price - discountAmount, 0);

  return {
    finalAmount: Number(finalAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
  };
}

module.exports = {
  getActiveGlobalOffer,
  applyGlobalDiscount,
};
