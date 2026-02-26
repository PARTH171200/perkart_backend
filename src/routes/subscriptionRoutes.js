const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/subscriptionController");

router.post("/", auth, controller.subscribe);

module.exports = router;