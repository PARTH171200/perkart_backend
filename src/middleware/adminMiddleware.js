module.exports = function (req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    console.log("Admin access denied for user:", req.user ? req.user.email : "Unknown");
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};