const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { ask } = require("../services/ai/agent");
const { isConfigured, MODELS, BASE_URL } = require("../services/ai/provider");

router.use(authMiddleware);

/* AI setup hai ya nahi — frontend isse check karta hai */
router.get("/health", (req, res) => {
  res.json({
    configured: isConfigured(),
    models: MODELS,
    provider: /groq/i.test(BASE_URL) ? "Groq" : /localhost|127\.0\.0\.1/.test(BASE_URL) ? "Ollama (local)" : BASE_URL,
  });
});

/* Sawaal poochho */
router.post("/", async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) return res.status(400).json({ message: "Sawaal khaali hai." });
    if (question.length > 2000) return res.status(400).json({ message: "Sawaal bahut lamba hai." });

    if (!isConfigured()) {
      return res.status(503).json({
        message:
          "AI setup nahi hai — backend/.env me AI_API_KEY daalo. Free key: https://console.groq.com",
      });
    }

    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const out = await ask(question, history);

    res.json(out);
  } catch (err) {
    console.error("AI /ask error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
