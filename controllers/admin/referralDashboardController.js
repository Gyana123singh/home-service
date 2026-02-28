const Referral = require("../../models/Referral");
const User = require("../../models/User");

exports.getReferralLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $match: { status: "credited" } },
      {
        $group: {
          _id: "$referrer",
          totalEarnings: { $sum: "$rewardAmount" },
          totalReferrals: { $sum: 1 },
        },
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 20 },
    ]);

    const populated = await User.populate(leaderboard, {
      path: "_id",
      select: "firstName email",
    });

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getReferralDashboardStats = async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    const totalRewards = await Referral.aggregate([
      { $match: { status: "credited" } },
      { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
    ]);

    const pendingReferrals = await Referral.countDocuments({
      status: "pending",
    });

    res.json({
      success: true,
      data: {
        totalReferrals,
        totalRewards: totalRewards[0]?.total || 0,
        pendingReferrals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
