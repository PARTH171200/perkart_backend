const axios = require("axios");
const multer = require("multer");
const cron = require("node-cron");

const upload = multer({
  storage: multer.memoryStorage(),
});

const AI_ENGINE = process.env.MY_AI_ENGINE_URL;

/* =========================================================
   1️⃣ INITIAL GENERATE / ANALYZE
========================================================= */

const getAIResponse = async (req, res) => {
  try {
    const { prompt, image_url } = req.body;
    const imageFile = req.file;

    // Use req.user.id from auth middleware (fallback to body for compatibility)
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

    const payload = {
      user_id: String(user_id),
      text: prompt || "",
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
========================================================= */

const startNewsSession = async (req, res) => {
  try {
    const { news_id } = req.body;

    // Use req.user.id from auth middleware (fallback to body for compatibility)
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
========================================================= */

const chatAI = async (req, res) => {
  try {
    const { conversation_id, message } = req.body;

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

    const payload = {
      conversation_id: Number(conversation_id),
      message: String(message),
    };

    const engineResponse = await axios.post(
      `${AI_ENGINE}/chat`,
      payload,
      { timeout: 60000 }
    );

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
        params: {
          sector,
          page,
          limit
        },
        timeout: 30000
      }
    );
    console.log("📊 Get News Response:", response.data);

    return res.status(200).json({
      success: true,
      news: response.data.news,
      pagination: response.data.pagination
    });

  } catch (error) {
    console.error("🔥 GET NEWS ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
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