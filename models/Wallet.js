const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    // 💰 Current withdrawable balance
    balance: {
      type: Number,
      default: 0,
    },

    // 📈 Lifetime earnings
    totalEarnings: {
      type: Number,
      default: 0,
    },

    // 🧾 Optional: transaction history (for wallet screen)
    transactions: [
      {
        type: {
          type: String, // "credit" | "debit"
          enum: ["credit", "debit"],
        },
        amount: Number,
        description: String, // e.g. "Payment for Cleaning"
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
