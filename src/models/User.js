const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    accessCode: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ── Subscription tier ──────────────────────────────────────────────────
    subscriptionTier: {
      type: String,
      enum: ["free", "premium", "pro", "enterprise"],
      default: "free",
    },

    // ── Usage stats ────────────────────────────────────────────────────────
    stats: {
      searches: { type: Number, default: 0 },
      insights: { type: Number, default: 0 },
      ideas: { type: Number, default: 0 },
      riskChecks: { type: Number, default: 0 },
    },

    // ── Daily search limit tracking (for free tier) ────────────────────────
    dailySearches: {
      count: { type: Number, default: 0 },
      date: { type: String, default: "" }, // stored as YYYY-MM-DD
    },
    resetOtp: {
  type: String,
  default: null,
},
resetOtpExpiry: {
  type: Date,
  default: null,
},
settings: {
  notifications: { type: Boolean, default: true },
  haptics: { type: Boolean, default: true },
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);