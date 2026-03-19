const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/profileController");

router.get("/me", auth, controller.getMe);
router.get("/profile", auth, controller.getProfile);
router.post("/profile", auth, controller.createProfile);
router.put("/me/profile", auth, controller.updateProfile);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/users/:id/stats", auth, controller.getUserStats);
router.post("/users/:id/stats/increment", auth, controller.incrementStat);

module.exports = router;