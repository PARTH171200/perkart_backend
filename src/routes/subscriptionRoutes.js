const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/subscriptionController");

// Existing — subscribe via plan ID (non-Apple)
router.post("/", auth, controller.subscribe);

// New — activate after Apple IAP purchase
router.post("/activate", auth, controller.activateSubscription);

// New — get current subscription status
router.get("/status", auth, controller.getSubscriptionStatus);

module.exports = router;