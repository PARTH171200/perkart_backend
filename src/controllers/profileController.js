const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("name email");
  res.json(user);
};

exports.getProfile = async (req, res) => {
  console.log("👉 GET PROFILE HIT");
  const profile = await UserProfile.findOne({ user: req.user.id });
  console.log("PROFILE:", profile);

  if (!profile) {
    return res.json(null);
  }

  res.json(profile);
};

exports.createProfile = async (req, res) => {
  console.log("👉 CREATE PROFILE HIT");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const exists = await UserProfile.findOne({ user: req.user.id });
    console.log("EXISTS:", exists);

    if (exists) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = await UserProfile.create({
      user: req.user.id,
      ...req.body,
    });

    console.log("CREATED:", profile);
    res.status(201).json(profile);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ message: "Profile creation failed" });
  }
};

exports.updateProfile = async (req, res) => {
  console.log("👉 UPDATE PROFILE HIT");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const profile = await UserProfile.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, upsert: true }
    );

    console.log("UPDATED:", profile);
    res.json(profile);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

// ── GET /api/users/:id/stats ───────────────────────────────────────────────
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("stats subscriptionTier dailySearches");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow user to fetch their own stats (or admin)
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const today = new Date().toISOString().split("T")[0];
    const dailyCount = user.dailySearches?.date === today
      ? user.dailySearches.count
      : 0;

    const FREE_LIMIT = 10;
    const remainingSearches = user.subscriptionTier === "free"
      ? Math.max(0, FREE_LIMIT - dailyCount)
      : null; // null = unlimited

    res.json({
      searches: user.stats?.searches ?? 0,
      insights: user.stats?.insights ?? 0,
      ideas: user.stats?.ideas ?? 0,
      risk_checks: user.stats?.riskChecks ?? 0,
      subscription_tier: user.subscriptionTier ?? "free",
      daily_searches_used: dailyCount,
      daily_searches_remaining: remainingSearches,
    });
  } catch (err) {
    console.error("GET STATS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// ── POST /api/users/:id/stats/increment ───────────────────────────────────
// Called internally after a successful search
exports.incrementStat = async (req, res) => {
  try {
    const { field } = req.body; // "searches" | "insights" | "ideas" | "riskChecks"

    const validFields = ["searches", "insights", "ideas", "riskChecks"];
    if (!validFields.includes(field)) {
      return res.status(400).json({ message: "Invalid stat field" });
    }

    const update = { $inc: { [`stats.${field}`]: 1 } };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({ success: true, stats: user.stats });
  } catch (err) {
    console.error("INCREMENT STAT ERROR:", err);
    res.status(500).json({ message: "Failed to increment stat" });
  }
};