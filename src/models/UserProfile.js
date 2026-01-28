const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: String,
    phone: String,
    country_code: String,
    company: String,
    designation: String,
    location: String,
    address: String,
    profile_image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
