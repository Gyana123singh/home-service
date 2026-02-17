const mongoose = require("mongoose");

const kycAuditLogSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: ["approved", "rejected", "reuploaded"],
      required: true,
    },

    reason: String,

    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("KycAuditLog", kycAuditLogSchema);
