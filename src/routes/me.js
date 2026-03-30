const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  getMe,
  getProfile,
  createProfile,
  updateProfile,
  getSettings,
  updateSettings,
  changePassword,
  exportData,
  deleteAccount,
} = require("../controllers/profileController");

router.get("/", auth, getMe);
router.get("/profile", auth, getProfile);
router.post("/profile", auth, createProfile);
router.put("/profile", auth, updateProfile);

// ── Settings ──────────────────────────────────────────────
router.get("/settings", auth, getSettings);
router.patch("/settings", auth, updateSettings);

// ── Security ──────────────────────────────────────────────
router.post("/change-password", auth, changePassword);

// ── Data ──────────────────────────────────────────────────
router.get("/export", auth, exportData);

// ── Account ───────────────────────────────────────────────
router.delete("/account", auth, deleteAccount);

module.exports = router;