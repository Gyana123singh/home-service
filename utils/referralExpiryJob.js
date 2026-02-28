const Referral = require("../models/Referral");

exports.expireReferrals = async () => {
  const now = new Date();

  await Referral.updateMany(
    {
      status: "pending",
      expiresAt: { $lte: now },
    },
    { status: "expired" }
  );

  console.log("Expired old referrals");
};