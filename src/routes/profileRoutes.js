// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/profileController");

router.put("/me/profile", auth, controller.upsertProfile);

module.exports = router;
