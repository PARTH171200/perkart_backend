const Subscription = require("../models/Subscription");
const Plan = require("../models/Plans");
const User = require("../models/User");

// ── Existing subscribe (for non-Apple flow) ────────────────────────────────
exports.subscribe = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Cancel any existing active subscription
    await Subscription.updateMany(
      { user: userId, status: "active" },
      { status: "cancelled" }
    );

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // Update user's subscription tier
    await User.findByIdAndUpdate(userId, { subscriptionTier: plan.type });

    res.json({ message: "Subscription successful", subscription });
  } catch (err) {
    res.status(500).json({ message: "Subscription failed" });
  }
};

// ── Activate subscription after Apple IAP purchase ─────────────────────────
exports.activateSubscription = async (req, res) => {
  try {
    const { plan_type, product_id, transaction_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!plan_type || !["premium", "pro"].includes(plan_type)) {
      return res.status(400).json({ success: false, message: "Invalid plan type" });
    }

    // Cancel any existing active subscriptions
    await Subscription.updateMany(
      { user: userId, status: "active" },
      { status: "cancelled" }
    );

    // Find matching plan by type
    const plan = await Plan.findOne({ type: plan_type });

    // Create subscription record
    await Subscription.create({
      user: userId,
      plan: plan?._id || null,
      status: "active",
      source: "apple_iap",
      productId: product_id,
      transactionId: transaction_id,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Update user tier
    await User.findByIdAndUpdate(userId, {
      subscriptionTier: plan_type,
    });

    console.log(`✅ Subscription activated: user=${userId} plan=${plan_type}`);

    res.json({
      success: true,
      tier: plan_type,
      message: "Subscription activated successfully",
    });
  } catch (err) {
    console.error("ACTIVATE SUBSCRIPTION ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to activate subscription" });
  }
};

// ── Get current subscription status ───────────────────────────────────────
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).select("subscriptionTier");
    const activeSub = await Subscription.findOne({
      user: userId,
      status: "active",
    }).populate("plan");

    res.json({
      success: true,
      tier: user?.subscriptionTier ?? "free",
      subscription: activeSub || null,
    });
  } catch (err) {
    console.error("GET SUBSCRIPTION STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};

// ── Get purchase history ───────────────────────────────────────────────────
exports.getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    const subscriptions = await Subscription.find({ user: userId })
      .populate("plan", "name type price")
      .sort({ createdAt: -1 })
      .lean();

    const purchases = subscriptions.map((s) => ({
      id: s._id,
      plan_type: s.plan?.type ?? "unknown",
      plan_name: s.plan?.name ?? "Unknown Plan",
      product_id: s.productId ?? s.plan?._id ?? "—",
      transaction_id: s.transactionId ?? "—",
      status: s.status ?? "pending",
      amount: s.plan?.price ?? "0",
      currency: "INR",
      created_at: s.createdAt,
      expires_at: s.endDate ?? null,
    }));

    return res.status(200).json({ purchases });
  } catch (err) {
    console.error("getPurchaseHistory error:", err);
    return res.status(500).json({ message: "Failed to fetch purchase history" });
  }
};