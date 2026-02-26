const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema({
  text: String,
  included: Boolean
});

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ["free", "premium", "pro", "enterprise"] },
  features: [featureSchema],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Plan", planSchema);