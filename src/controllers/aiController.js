const axios = require("axios");
const multer = require("multer");
const cron = require("node-cron");
const User = require("../models/User");

const upload = multer({
  storage: multer.memoryStorage(),
});

const AI_ENGINE = process.env.MY_AI_ENGINE_URL;

/* =========================================================
   HELPER — Increment a user stat silently
========================================================= */
async function incrementStat(userId, field) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { [`stats.${field}`]: 1 },
    });
  } catch (err) {
    console.error(`Failed to increment stat ${field} for user ${userId}:`, err.message);
    // Never block the main response for a stat failure
  }
}

/* =========================================================
   1️⃣ INITIAL GENERATE / ANALYZE
   → increments: insights
========================================================= */

const getAIResponse = async (req, res) => {
  try {
    const { prompt, image_url } = req.body;
    const imageFile = req.file;

    const user_id = req.user?.id || req.body.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: User ID missing",
      });
    }

    if (!prompt && !imageFile && !image_url) {
      return res.status(400).json({
        success: false,
        error: "Either prompt, image file, or image_url is required",
      });
    }

    // Always inject no-fake-files instruction for first message too
    let enhancedPrompt = `${NO_FAKE_FILES_INSTRUCTION}\n\n${prompt || ""}`;
    if (isPitchDeckRequest(prompt || "")) {
      enhancedPrompt = `${NO_FAKE_FILES_INSTRUCTION}\n\n${PITCH_DECK_INSTRUCTION}\n\nUser request: ${prompt}`;
    }

    const payload = {
      user_id: String(user_id),
      text: enhancedPrompt,
    };

    if (imageFile) {
      payload.image_data = imageFile.buffer.toString("base64");
      payload.image_type = imageFile.mimetype;
    }

    if (image_url) {
      payload.image_url = image_url;
    }

    const engineResponse = await axios.post(
      `${AI_ENGINE}/analyze`,
      payload,
      { timeout: 60000 }
    );

    // ✅ Increment insights stat
    await incrementStat(user_id, "insights");

    return res.status(200).json({
      success: true,
      analyze: engineResponse.data.analyze,
      conversation_id: engineResponse.data.conversation_id,
    });

  } catch (error) {
    console.error("🔥 AI ENGINE ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   2️⃣ START NEWS SESSION
   → increments: riskChecks
========================================================= */

const startNewsSession = async (req, res) => {
  try {
    const { news_id } = req.body;

    const user_id = req.user?.id || req.body.user_id;

    if (!user_id || !news_id) {
      return res.status(400).json({
        success: false,
        error: "user_id and news_id are required",
      });
    }

    const response = await axios.post(
      `${AI_ENGINE}/pulse/start-session`,
      null,
      {
        params: {
          user_id: String(user_id),
          news_id: Number(news_id),
        },
        timeout: 30000,
      }
    );

    console.log("📊 Start News Session Response:", response.data);

    // ✅ Increment riskChecks stat
    await incrementStat(user_id, "riskChecks");

    return res.status(200).json({
      success: true,
      conversation_id: response.data.conversation_id,
      title: response.data.title,
    });

  } catch (error) {
    console.error("🔥 START SESSION ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   3️⃣ CHAT CONTINUATION
   → increments: ideas
========================================================= */

// Global instruction injected into every message to prevent hallucinated file paths
const NO_FAKE_FILES_INSTRUCTION = `IMPORTANT SYSTEM RULE: Never mention downloading files, never generate file paths, never reference sandbox:/mnt/data/ or any file system path, never say "download here", never offer to create a .docx or any file. Do not explain this rule to the user. Simply respond with the requested content as formatted text directly in your reply, without any mention of files or downloads.`;

// Detect pitch deck intent in user message
function isPitchDeckRequest(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes("pitch deck") ||
    lower.includes("pitchdeck") ||
    lower.includes("investor deck") ||
    lower.includes("make a deck") ||
    lower.includes("create a deck") ||
    lower.includes("build a deck") ||
    lower.includes("write a pitch") ||
    lower.includes("generate a pitch")
  );
}

const PITCH_DECK_INSTRUCTION = `When asked to create a pitch deck, respond with ONLY the formatted pitch deck content below. Do NOT mention downloading files, do NOT generate file paths, do NOT say you will provide a download link, do NOT reference sandbox paths or any file system. Just write the pitch deck as formatted text directly in your response.

Use this exact structure:

---

# [STARTUP NAME] — Investor Pitch Deck

## Executive Summary
[2-3 compelling sentences about the business]

## The Problem
[Clear description of the market pain point]

## Our Solution
[How the product solves it with key differentiators]

## Market Opportunity
[TAM/SAM/SOM with specific numbers]

## Business Model
[Revenue streams, pricing, unit economics]

## Competitive Advantage
[Why this wins vs competitors]

## Go-To-Market Strategy
[Customer acquisition plan and growth strategy]

## The Team
[Founder backgrounds and why this team wins]

## Financial Projections
[Key metrics, milestones, projections]

## The Ask
[Funding amount, use of funds, what investors get]

---

Keep each section to 3-5 sentences. Be specific, data-driven, and compelling for investors. Use the context from the conversation to fill in details. Do NOT add any text after the final --- divider. Do NOT mention files, downloads, links, or formats of any kind.`;

const chatAI = async (req, res) => {
  try {
    const { conversation_id, message } = req.body;

    const user_id = req.user?.id || req.body.user_id;

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: "conversation_id is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    // Always inject no-fake-files instruction
    // Additionally inject pitch deck format if user is requesting one
    let enhancedMessage = `${NO_FAKE_FILES_INSTRUCTION}\n\n${String(message)}`;
    if (isPitchDeckRequest(message)) {
      enhancedMessage = `${NO_FAKE_FILES_INSTRUCTION}\n\n${PITCH_DECK_INSTRUCTION}\n\nUser request: ${message}`;
    }

    const payload = {
      conversation_id: Number(conversation_id),
      message: enhancedMessage,
    };

    const engineResponse = await axios.post(
      `${AI_ENGINE}/chat`,
      payload,
      { timeout: 60000 }
    );

    // ✅ Increment ideas stat (only if user is known)
    if (user_id) {
      await incrementStat(user_id, "ideas");
    }

    return res.status(200).json({
      success: true,
      reply: engineResponse.data.reply,
      conversation_id,
    });

  } catch (error) {
    console.error("🔥 CHAT ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   4️⃣ GET USER CONVERSATIONS
========================================================= */

const getUserConversations = async (req, res) => {
  try {
    const { user_id } = req.params;

    const response = await axios.get(
      `${AI_ENGINE}/conversations/${user_id}`,
      { timeout: 30000 }
    );

    return res.status(200).json({
      success: true,
      conversations: response.data,
    });

  } catch (error) {
    console.error("🔥 GET CONVERSATIONS ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   5️⃣ GET CONVERSATION MESSAGES
========================================================= */

const getConversationMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const response = await axios.get(
      `${AI_ENGINE}/conversations/${conversation_id}/messages`,
      { timeout: 30000 }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error("🔥 GET MESSAGES ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   🔥 AUTO DAILY NEWS INGESTION
========================================================= */

const startAutoNewsScheduler = () => {

  if (process.env.ENABLE_DAILY_NEWS_FETCH !== "true") {
    console.log("🛑 Daily News Scheduler Disabled");
    return;
  }

  const schedule = process.env.DAILY_FETCH_TIME || "0 6 * * *";
  if (!cron.validate(schedule)) {
    console.error("❌ Invalid cron schedule:", schedule);
    return;
  }

  console.log("🕒 Daily News Scheduler Enabled");
  console.log("⏰ Schedule:", schedule);

  const runIngestion = async () => {
    console.log("🚀 Starting News Ingestion...");

    try {
      const sectors = [
        "Biopharma",
        "Automotive",
        "Engineering",
        "Aviation",
        "Manufacturing",
        "Artificial Intelligence",
      ];

      for (const sector of sectors) {
        console.log(`📡 Fetching sector: ${sector}`);
        await axios.post(
          `${AI_ENGINE}/pulse/fetch-news`,
          { sector },
          { timeout: 180000 }
        );
      }

      console.log("✅ News Ingestion Completed Successfully");

    } catch (error) {
      console.error("❌ News Ingestion Failed:");
      console.error(error.response?.data || error.message);
    }
  };

  runIngestion();

  cron.schedule(schedule, async () => {
    await runIngestion();
  });
};

startAutoNewsScheduler();

/* =========================================================
   GET STORED NEWS (FOR FRONTEND LISTING + SEARCH)
========================================================= */

const getNews = async (req, res) => {
  try {
    const { sector, page = 1, limit = 10 } = req.query;
    console.log(`📡 Fetching news - Sector: ${sector}, Page: ${page}, Limit: ${limit}`);
    const response = await axios.get(
      `${AI_ENGINE}/pulse/news`,
      {
        params: { sector, page, limit },
        timeout: 30000,
      }
    );
    console.log("📊 Get News Response:", response.data);

    return res.status(200).json({
      success: true,
      news: response.data.news,
      pagination: response.data.pagination,
    });

  } catch (error) {
    console.error("🔥 GET NEWS ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  upload,
  getAIResponse,
  startNewsSession,
  getNews,
  chatAI,
  getUserConversations,
  getConversationMessages,
};