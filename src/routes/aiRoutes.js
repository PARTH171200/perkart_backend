const express = require("express");
const router = express.Router();
const controller = require("../controllers/aiController");
const auth = require("../middleware/authMiddleware");
const checkSearchLimit = require("../middleware/searchLimitMiddleware");

// ── Analyze (Forge) ────────────────────────────────────────────────────────
// checkSearchLimit enforces 10/day for free tier and increments stats
router.post(
  "/generate",
  auth,
  checkSearchLimit,
  controller.upload.single("image"),
  controller.getAIResponse
);

// ── Chat (no search limit — it's a follow-up, not a new search) ───────────
router.post("/chat", auth, controller.chatAI);

// ── Conversations ──────────────────────────────────────────────────────────
router.get("/conversations/:user_id", auth, controller.getUserConversations);

// ── Messages ───────────────────────────────────────────────────────────────
router.get("/messages/:conversation_id", auth, controller.getConversationMessages);

// ── Pulse News Session (counts as a search for free tier) ─────────────────
router.post("/start-news-session", auth, checkSearchLimit, controller.startNewsSession);

// ── News Feed (just fetching, no search count) ─────────────────────────────
router.get("/news", controller.getNews);

module.exports = router;