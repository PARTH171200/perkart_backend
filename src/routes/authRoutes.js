const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  enterpriseInquiry,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/enterprise-inquiry", enterpriseInquiry);

module.exports = router;