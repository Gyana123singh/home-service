const WithdrawRequest = require("../../models/WithdrawRequest");
const Wallet = require("../../models/Wallet");

// ================= GET ALL WITHDRAW REQUESTS =================
exports.getAllWithdrawRequests = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate("vendor", "firstName lastName phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("GET WITHDRAW REQUESTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= APPROVE WITHDRAW =================
exports.approveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await WithdrawRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    // ✅ Mark request as paid
    request.status = "paid";
    request.paidAt = new Date();

    await request.save();

    // ⚠️ Here you can integrate Razorpay / Bank payout API

    res.json({
      success: true,
      message: "Withdraw approved and marked as paid",
    });
  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= REJECT WITHDRAW =================
exports.rejectWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const request = await WithdrawRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    const wallet = await Wallet.findOne({ user: request.vendor });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // 🔁 Refund wallet because request rejected
    wallet.balance += request.amount;

    wallet.transactions.push({
      type: "credit",
      amount: request.amount,
      description: "Withdraw rejected refund",
    });

    await wallet.save();

    request.status = "rejected";
    request.adminNote = adminNote || "Rejected by admin";

    await request.save();

    res.json({
      success: true,
      message: "Withdraw request rejected and amount refunded",
    });
  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
