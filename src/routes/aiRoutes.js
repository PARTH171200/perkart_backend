const express = require("express");
const router = express.Router();
const controller = require("../controllers/aiController");

// Analyze
router.post("/generate", controller.upload.single("image"), controller.getAIResponse);

// Chat
router.post("/chat", controller.chatAI);

// List Conversations
router.get("/conversations/:user_id", controller.getUserConversations);

// Get Messages
router.get("/messages/:conversation_id", controller.getConversationMessages);

module.exports = router;