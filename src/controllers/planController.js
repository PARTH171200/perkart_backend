const Plan = require("../models/Plans");

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Error fetching plans" });
  }
};