const WithdrawRequest = require("../../models/WithdrawRequest");
const Wallet = require("../../models/Wallet");
const User = require("../../models/User");

exports.requestWithdraw = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { amount, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount",
      });
    }

    const withdrawMethod = method || "UPI";
    if (!["UPI", "BANK"].includes(withdrawMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method. Choose UPI or BANK.",
      });
    }

    const wallet = await Wallet.findOne({ user: vendorId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const requestData = {
      vendor: vendorId,
      amount,
      method: withdrawMethod,
      status: "pending",
    };

    if (withdrawMethod === "UPI") {
      if (!vendor.upiId) {
        return res.status(400).json({
          success: false,
          message: "Please configure your UPI ID in profile before withdrawing.",
        });
      }
      requestData.upiId = vendor.upiId;
    } else {
      if (!vendor.bankDetails || !vendor.bankDetails.accountNumber || !vendor.bankDetails.ifsc) {
        return res.status(400).json({
          success: false,
          message: "Please configure your Bank Details in profile before withdrawing.",
        });
      }
      requestData.bankDetails = vendor.bankDetails;
    }

    // 🔹 Create withdraw request
    const withdrawRequest = await WithdrawRequest.create(requestData);

    // 🔹 Deduct wallet balance
    wallet.balance -= amount;
    wallet.withdrawnAmount += amount;

    // 🔹 Add wallet transaction
    wallet.transactions.push({
      type: "debit",
      amount,
      description: `Withdrawal Request (${withdrawMethod})`,
    });

    await wallet.save();

    return res.json({
      success: true,
      message: "Withdraw request submitted",
      data: withdrawRequest,
      balance: wallet.balance,
    });
  } catch (error) {
    console.error("WITHDRAW ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getVendorWallet = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const wallet = await Wallet.findOne({ user: vendorId });

    if (!wallet) {
      return res.json({
        success: true,
        balance: 0,
        transactions: [],
      });
    }

    const recentTransactions = wallet.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    return res.json({
      success: true,
      balance: wallet.balance,
      transactions: recentTransactions,
    });
  } catch (error) {
    console.error("GET WALLET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const wallet = await Wallet.findOne({ user: vendorId });

    if (!wallet) {
      return res.json({
        success: true,
        data: [],
      });
    }

    return res.json({
      success: true,
      data: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    console.error("TRANSACTION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
