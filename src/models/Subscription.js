const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  status: { 
    type: String, 
    enum: ["active", "expired", "cancelled"],
    default: "active"
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);