const WithdrawRequest = require("../../models/WithdrawRequest");
const Wallet = require("../../models/Wallet");

exports.getAllWithdrawRequests = async (req, res) => {
  const requests = await WithdrawRequest.find()
    .populate("vendor", "firstName lastName phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
};

exports.approveWithdraw = async (req, res) => {
  const { id } = req.params;

  const request = await WithdrawRequest.findById(id);
  if (!request) {
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });
  }

  if (request.status !== "pending") {
    return res
      .status(400)
      .json({ success: false, message: "Already processed" });
  }

  const wallet = await Wallet.findOne({ user: request.vendor });
  if (!wallet || wallet.balance < request.amount) {
    return res
      .status(400)
      .json({ success: false, message: "Insufficient wallet balance" });
  }

  // 💸 Deduct from wallet
  wallet.balance -= request.amount;
  wallet.transactions.push({
    type: "debit",
    amount: request.amount,
    description: "Withdraw payout",
  });
  await wallet.save();

  // ✅ Mark as paid
  request.status = "paid";
  await request.save();

  // ⚠️ Here you can integrate real UPI/Bank payout API later

  return res.json({
    success: true,
    message: "Withdraw approved and paid",
  });
};

exports.rejectWithdraw = async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body;

  const request = await WithdrawRequest.findById(id);
  if (!request) {
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });
  }

  if (request.status !== "pending") {
    return res
      .status(400)
      .json({ success: false, message: "Already processed" });
  }

  request.status = "rejected";
  request.adminNote = adminNote || "Rejected by admin";
  await request.save();

  return res.json({
    success: true,
    message: "Withdraw request rejected",
  });
};
