const Subscription = require("../models/Subscription");
const Plan = require("../models/Plans");

exports.subscribe = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    res.json({ message: "Subscription successful", subscription });
  } catch (err) {
    res.status(500).json({ message: "Subscription failed" });
  }
};