const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const authMiddleware = require("../middleware/authMiddleware");
const { ask } = require("../services/ai/agent");
const { isConfigured, MODELS, BASE_URL } = require("../services/ai/provider");

router.use(authMiddleware);

/* ──────── REPORT KO PDF ME BADLO ────────
   Rows wahi hain jo AI ke tool ne database se nikali thi —
   frontend unhe wapas bhejta hai, yahan PDF ban jaati hai. */
router.post("/pdf", express.json({ limit: "4mb" }), (req, res) => {
  try {
    const title = String(req.body?.title || "Report").slice(0, 80);
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ message: "Report khaali hai." });

    const headers = Object.keys(rows[0]);
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf"`);
    doc.pipe(res);

    const left = doc.page.margins.left;
    const usable = doc.page.width - left - doc.page.margins.right;
    const colW = usable / headers.length;
    const bottom = doc.page.height - doc.page.margins.bottom - 24;

    // Number wale column dayein taraf — padhne me aasaan
    const isNum = headers.map((h) => rows.every((r) => r[h] === "" || r[h] == null || !isNaN(Number(String(r[h]).replace(/[₹,\sRs]/g, "")))));

    doc.fontSize(15).font("Helvetica-Bold").text(title, left, doc.y);
    doc.fontSize(8).font("Helvetica").fillColor("#666")
      .text(`Bhaskar Silk Mills  ·  ${rows.length} rows  ·  ${new Date().toLocaleDateString("en-GB")}`);
    doc.moveDown(0.6).fillColor("#000");

    const drawHead = () => {
      const y = doc.y;
      doc.rect(left, y - 2, usable, 16).fill("#f1f5f9").fillColor("#000");
      doc.fontSize(7.5).font("Helvetica-Bold");
      headers.forEach((h, i) =>
        doc.text(String(h), left + i * colW + 3, y + 2, { width: colW - 6, align: isNum[i] ? "right" : "left", lineBreak: false })
      );
      doc.y = y + 16;
    };

    drawHead();
    doc.font("Helvetica").fontSize(7.5);

    rows.forEach((r, n) => {
      if (doc.y > bottom) { doc.addPage(); drawHead(); doc.font("Helvetica").fontSize(7.5); }
      const y = doc.y;
      if (n % 2) doc.rect(left, y - 1, usable, 13).fill("#fafafa").fillColor("#000");
      headers.forEach((h, i) =>
        doc.text(r[h] === null || r[h] === undefined ? "" : String(r[h]), left + i * colW + 3, y + 2, {
          width: colW - 6, align: isNum[i] ? "right" : "left", lineBreak: false, ellipsis: true,
        })
      );
      doc.y = y + 13;
    });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

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
