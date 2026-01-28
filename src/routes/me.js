const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  getMe,
  getProfile,
  createProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/", auth, getMe);
router.get("/profile", auth, getProfile);
router.post("/profile", auth, createProfile);
router.put("/profile", auth, updateProfile);

module.exports = router;
