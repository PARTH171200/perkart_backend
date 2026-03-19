const User = require("../models/User");

const FREE_DAILY_LIMIT = 10;

/**
 * Middleware to enforce daily search limits for free tier users.
 * Place this before any route that counts as a "search" (Forge analyze, Pulse news session).
 */
const checkSearchLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Paid users have no limit
    if (user.subscriptionTier !== "free") {
      // Still increment total stats
      await incrementSearchCount(user);
      return next();
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Reset count if it's a new day
    if (user.dailySearches.date !== today) {
      user.dailySearches.count = 0;
      user.dailySearches.date = today;
    }

    // Check limit
    if (user.dailySearches.count >= FREE_DAILY_LIMIT) {
      return res.status(429).json({
        message: "Daily search limit reached",
        limit_reached: true,
        limit: FREE_DAILY_LIMIT,
        resets_at: "midnight",
        upgrade_required: true,
      });
    }

    // Increment daily count and total stats
    user.dailySearches.count += 1;
    user.stats.searches = (user.stats.searches || 0) + 1;
    await user.save();

    // Attach remaining count to request for use in response if needed
    req.searchesRemaining = FREE_DAILY_LIMIT - user.dailySearches.count;

    next();
  } catch (err) {
    console.error("SEARCH LIMIT MIDDLEWARE ERROR:", err);
    next(); // Don't block on middleware error
  }
};

// Helper to increment search stats for paid users
const incrementSearchCount = async (user) => {
  try {
    user.stats.searches = (user.stats.searches || 0) + 1;
    await user.save();
  } catch (err) {
    console.error("INCREMENT ERROR:", err);
  }
};

module.exports = checkSearchLimit;