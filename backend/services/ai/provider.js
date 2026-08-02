// OpenAI-compatible chat client — Groq (default) ya Ollama, dono same shape bolte hain.
// Provider badalna sirf .env ka kaam hai, code chhune ki zaroorat nahi:
//
//   Groq   : AI_BASE_URL=https://api.groq.com/openai/v1
//            AI_MODELS=openai/gpt-oss-120b,llama-3.3-70b-versatile,llama-3.1-8b-instant
//   Ollama : AI_BASE_URL=http://localhost:11434/v1
//            AI_MODELS=llama3.1:8b        (key ki zaroorat nahi)

const BASE_URL = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY || "";

const MODELS = (
  process.env.AI_MODELS ||
  "openai/gpt-oss-120b,llama-3.3-70b-versatile,llama-3.1-8b-instant"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Ollama localhost pe chalta hai aur usko API key nahi chahiye
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(BASE_URL);

function isConfigured() {
  return Boolean(API_KEY) || isLocal;
}

// Ye statuses "agla model try karo" wale hain. Baaki (401/403/400) pe retry bekaar hai —
// key galat hai ya request kharab hai, dusra model bhi wahi error dega.
const RETRYABLE = new Set([404, 408, 413, 429, 500, 502, 503, 504]);

/**
 * Ek chat request — MODELS list pe ek-ek karke try karta hai.
 * @returns {Promise<{message: object, model: string}>}
 */
async function chat({ messages, tools }) {
  if (!isConfigured()) {
    throw new Error(
      "AI setup nahi hai — backend/.env me AI_API_KEY daalo (free key: https://console.groq.com)"
    );
  }

  let lastErr;

  for (const model of MODELS) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          ...(tools && tools.length ? { tools, tool_choice: "auto" } : {}),
          temperature: 0.1, // hisaab-kitaab hai, creativity nahi chahiye
        }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new Error(`[${model}] HTTP ${res.status} ${body.slice(0, 300)}`);

        if (RETRYABLE.has(res.status)) {
          console.warn(`AI: ${model} fail (${res.status}) — agla model try kar raha hoon`);
          lastErr = err;
          continue;
        }
        throw err; // auth/validation error — cascade se fayda nahi
      }

      const data = await res.json();
      const message = data?.choices?.[0]?.message;
      if (!message) {
        lastErr = new Error(`[${model}] khaali response`);
        continue;
      }

      if (model !== MODELS[0]) console.log(`AI: fallback model use hua — ${model}`);
      return { message, model };
    } catch (e) {
      // Network error / timeout — agla model try karo
      if (e?.name === "TimeoutError" || e?.name === "AbortError" || e?.cause) {
        console.warn(`AI: ${model} — ${e.message}, agla model try kar raha hoon`);
        lastErr = e;
        continue;
      }
      throw e;
    }
  }

  throw new Error(`Saare AI models fail ho gaye. Aakhri error: ${lastErr?.message || "unknown"}`);
}

module.exports = { chat, isConfigured, MODELS, BASE_URL };
