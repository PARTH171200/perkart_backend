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

    // ✅ ADD THIS
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ Optional (for future scaling)
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);