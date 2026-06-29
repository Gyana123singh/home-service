const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const Booking = require("../../models/Booking");

// ==========================================
// SETTLEMENTS (PROVIDER BALANCES)
// ==========================================

// GET /api/admin/settlement
exports.getSettlements = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" });
    const settlementsData = [];

    for (const vendor of vendors) {
      const wallet = await Wallet.findOne({ user: vendor._id });
      settlementsData.push({
        id: vendor._id,
        company: vendor.firstName + " Company", // fallback name
        name: `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim(),
        balance: wallet ? wallet.balance : 0
      });
    }

    res.json({
      success: true,
      data: settlementsData
    });
  } catch (error) {
    console.error("GET SETTLEMENTS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settlements data" });
  }
};

// POST /api/admin/settlement
exports.settleProvider = async (req, res) => {
  try {
    const { vendorId, amount, message } = req.body;

    if (!vendorId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payload parameters" });
    }

    let wallet = await Wallet.findOne({ user: vendorId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found for this vendor" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Deduct balance and update withdrawnAmount
    wallet.balance -= amount;
    wallet.withdrawnAmount += amount;

    // Push transaction
    wallet.transactions.push({
      type: "debit",
      amount,
      description: message || "Settled by admin"
    });

    await wallet.save();

    res.json({
      success: true,
      message: "Provider settlement recorded successfully",
      balance: wallet.balance
    });
  } catch (error) {
    console.error("SETTLE PROVIDER ERROR:", error);
    res.status(500).json({ success: false, message: "Server error during settlement" });
  }
};

// GET /api/admin/settlement/history
exports.getSettlementHistory = async (req, res) => {
  try {
    const wallets = await Wallet.find().populate("user", "firstName lastName");
    const history = [];

    for (const wallet of wallets) {
      if (!wallet.user) continue;

      // Extract all settlement debits
      const settlementTxns = wallet.transactions.filter(
        t => t.type === "debit" && (t.description.toLowerCase().includes("settle") || t.description.toLowerCase().includes("withdraw"))
      );

      settlementTxns.forEach(txn => {
        history.push({
          id: wallet.user._id,
          name: `${wallet.user.firstName || ""} ${wallet.user.lastName || ""}`.trim(),
          message: txn.description,
          status: "Debit",
          amount: txn.amount,
          date: txn.createdAt
        });
      });
    }

    // Sort history by date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("GET SETTLEMENT HISTORY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settlement history" });
  }
};


// ==========================================
// CASH COLLECTIONS (COD COMMISSION TRACKING)
// ==========================================

// Helper to calculate vendor commission
const calculateCommission = (vendor, bookingPrice) => {
  const commValue = vendor.commissionValue || 10; // Default 10%
  if (vendor.commissionType === "percentage") {
    return bookingPrice * (commValue / 100);
  }
  return commValue; // Freelance flat rate
};

// GET /api/admin/cash-collection
exports.getCashCollections = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" });
    const cashCollectionsData = [];

    for (const vendor of vendors) {
      // Find all completed COD bookings
      const codBookings = await Booking.find({
        vendor: vendor._id,
        paymentMethod: "COD",
        status: "completed"
      });

      // Calculate total commission owed on those bookings
      let totalCommissionOwed = 0;
      codBookings.forEach(booking => {
        totalCommissionOwed += calculateCommission(vendor, booking.totalPrice);
      });

      // Subtract any recorded cash collections by admin (debit transactions of description 'Cash collection by admin')
      const wallet = await Wallet.findOne({ user: vendor._id });
      let totalCollectedByAdmin = 0;

      if (wallet) {
        const collectionTxns = wallet.transactions.filter(
          t => t.type === "debit" && t.description.toLowerCase().includes("cash collection")
        );
        collectionTxns.forEach(t => {
          totalCollectedByAdmin += t.amount;
        });
      }

      const commissionOwedBalance = Math.max(0, totalCommissionOwed - totalCollectedByAdmin);

      cashCollectionsData.push({
        id: vendor._id,
        name: `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim(),
        commission: Math.round(commissionOwedBalance)
      });
    }

    res.json({
      success: true,
      data: cashCollectionsData
    });
  } catch (error) {
    console.error("GET CASH COLLECTIONS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cash collections" });
  }
};

// POST /api/admin/cash-collection
exports.collectCash = async (req, res) => {
  try {
    const { vendorId, amount, message } = req.body;

    if (!vendorId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payload parameters" });
    }

    let wallet = await Wallet.findOne({ user: vendorId });
    if (!wallet) {
      wallet = await Wallet.create({
        user: vendorId,
        balance: 0,
        totalEarnings: 0,
        transactions: []
      });
    }

    // Push debit transaction representing commission collected by admin
    wallet.transactions.push({
      type: "debit",
      amount,
      description: message || "Cash collection by admin"
    });

    await wallet.save();

    res.json({
      success: true,
      message: "Cash collection recorded successfully"
    });
  } catch (error) {
    console.error("COLLECT CASH ERROR:", error);
    res.status(500).json({ success: false, message: "Server error during cash collection" });
  }
};

// GET /api/admin/cash-collection/list
exports.getCashCollectionList = async (req, res) => {
  try {
    const historyList = [];

    // 1. Fetch completed COD bookings (representing cash collected by vendor)
    const codBookings = await Booking.find({
      paymentMethod: "COD",
      status: "completed"
    }).populate("vendor", "firstName lastName");

    codBookings.forEach(booking => {
      if (!booking.vendor) return;
      
      historyList.push({
        provider: `${booking.vendor.firstName || ""} ${booking.vendor.lastName || ""}`.trim(),
        message: "provider received cash",
        amount: booking.totalPrice,
        bookingId: booking._id,
        date: booking.updatedAt
      });
    });

    // 2. Fetch admin cash collections from wallets
    const wallets = await Wallet.find().populate("user", "firstName lastName");
    wallets.forEach(wallet => {
      if (!wallet.user) return;

      const collectionTxns = wallet.transactions.filter(
        t => t.type === "debit" && t.description.toLowerCase().includes("cash collection")
      );

      collectionTxns.forEach(txn => {
        historyList.push({
          provider: `${wallet.user.firstName || ""} ${wallet.user.lastName || ""}`.trim(),
          message: txn.description,
          amount: txn.amount,
          bookingId: "-",
          date: txn.createdAt
        });
      });
    });

    // Sort by date descending
    historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: historyList
    });
  } catch (error) {
    console.error("GET CASH COLLECTION LIST ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load cash collection logs" });
  }
};
