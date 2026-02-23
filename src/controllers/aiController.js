const axios = require("axios");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

const AI_ENGINE = process.env.MY_AI_ENGINE_URL;

/* =========================================================
   INITIAL GENERATE / ANALYZE
========================================================= */

const getAIResponse = async (req, res) => {
  try {
    console.log("👉 AI ROUTE HIT");
    console.log("BODY:", req.body);

    const { prompt, user_id, image_url } = req.body;
    const imageFile = req.file;

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

    console.log("🚀 Sending to AI Engine...");

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
   CHAT CONTINUATION
========================================================= */

const chatAI = async (req, res) => {
  try {
    console.log("👉 CHAT ROUTE HIT");

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
      conversation_id: conversation_id,
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
   GET USER CONVERSATIONS
========================================================= */

const getUserConversations = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "user_id is required",
      });
    }

    const response = await axios.get(
      `${AI_ENGINE}/conversations/${user_id}`
    );
    console.log("🚀 Conversations fetched:", response.data);
    return res.status(200).json({
      success: true,
      conversations: response.data,
    });

  } catch (error) {
    console.error("🔥 GET CONVERSATIONS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};


/* =========================================================
   GET MESSAGES OF A CONVERSATION
========================================================= */

const getConversationMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: "conversation_id is required",
      });
    }

    const response = await axios.get(
      `${AI_ENGINE}/conversations/${conversation_id}/messages`
    );
    console.log("🚀 Messages fetched:", response.data);
    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error("🔥 GET MESSAGES ERROR:", error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};


module.exports = {
  upload,
  getAIResponse,
  chatAI,
  getUserConversations,
  getConversationMessages,
};
