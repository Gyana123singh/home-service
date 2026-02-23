const WithdrawRequest = require("../../models/WithdrawRequest");
const Wallet = require("../../models/Wallet");


// api for vendor request withdraw
exports.requestWithdraw = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { amount, method, upiId, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const wallet = await Wallet.findOne({ user: vendorId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    if (method === "UPI" && !upiId) {
      return res
        .status(400)
        .json({ success: false, message: "UPI ID required" });
    }

    if (method === "BANK" && !bankDetails?.accountNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Bank details required" });
    }

    const request = await WithdrawRequest.create({
      vendor: vendorId,
      amount,
      method,
      upiId,
      bankDetails,
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Withdraw request submitted",
      data: request,
    });
  } catch (err) {
    console.error("REQUEST WITHDRAW ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// api for vendor get withdraw requests
exports.getMyWithdrawRequests = async (req, res) => {
  const vendorId = req.user._id;

  const requests = await WithdrawRequest.find({ vendor: vendorId }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    data: requests,
  });
};
