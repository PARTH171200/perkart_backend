const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },

    // ── Apple IAP fields ───────────────────────────────────────────────────
    source: {
      type: String,
      enum: ["manual", "apple_iap"],
      default: "manual",
    },
    productId: {
      type: String,
      default: null, // e.g. "in.perkart.app.premium.yearly"
    },
    transactionId: {
      type: String,
      default: null, // Apple transaction ID
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);