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

    // 💸 Total withdrawn
    withdrawnAmount: {
      type: Number,
      default: 0,
    },

    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
        },

        description: String,

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
  { timestamps: true },
);

walletSchema.index({ user: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
