import { useState, useRef, useEffect } from "react";
import { api } from "../../Api/api";
import "./Ask.css";

const EXAMPLES = [
  "Total outstanding kitna hai?",
  "MARTIN'S ka kitna baaki hai?",
  "Sabse zyada baaki kis customer pe hai?",
  "Data me koi galti hai kya?",
  "TOYOSI ka poora hisaab dikha",
  "Bale 1293 ka ledger dikha",
  "Is saal mahine-wise sales dikha",
  "Stock ki CSV file do",
];

/* Rows ko CSV bana ke download karo — wahi tareeka jo Reports page me hai */
function downloadCSV({ name, rows }) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Ask() {
  const [messages, setMessages] = useState([]);   // {role, content, toolsUsed?, model?}
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // AI setup hai ya nahi — page khulte hi check
  useEffect(() => {
    api.get("/ask/health").then(setHealth).catch(() => setHealth({ configured: false }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const q = (text ?? question).trim();
    if (!q || loading) return;

    // sirf saaf user/assistant turns backend ko bhejo
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/ask", { question: q, history });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          toolsUsed: res.toolsUsed || [],
          model: res.model,
          exportData: res.exportData || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.message || "Kuch galat ho gaya.", isError: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="ask">
      <div className="ask-head">
        <div>
          <h2 className="ask-title">🤖 AI Assistant</h2>
          <p className="ask-sub">Apne business ka kuch bhi poochho — Hinglish me</p>
        </div>
        {messages.length > 0 && (
          <button className="ask-clear" onClick={() => setMessages([])}>
            Naya chat
          </button>
        )}
      </div>

      {health && !health.configured && (
        <div className="ask-warn">
          ⚠️ AI setup nahi hai — <code>backend/.env</code> me <code>AI_API_KEY</code> daalo.
          Free key: <a href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>
        </div>
      )}

      <div className="ask-body">
        {messages.length === 0 && (
          <div className="ask-empty">
            <div className="ask-empty__icon">💬</div>
            <p className="ask-empty__text">Ye sawaal try karo:</p>
            <div className="ask-chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} className="ask-chip" onClick={() => send(ex)} disabled={loading}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`ask-msg ask-msg--${m.role}${m.isError ? " ask-msg--error" : ""}`}>
            <div className="ask-msg__body">{m.content}</div>
            {m.exportData?.rows?.length > 0 && (
              <button className="ask-dl" onClick={() => downloadCSV(m.exportData)}>
                ⬇️ Download CSV
                <span className="ask-dl__n">{m.exportData.rows.length} rows</span>
              </button>
            )}
            {m.toolsUsed?.length > 0 && (
              <div className="ask-msg__meta">
                dekha gaya: {[...new Set(m.toolsUsed)].join(", ")}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ask-msg ask-msg--assistant">
            <div className="ask-msg__body ask-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="ask-input">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Sawaal likho... (Enter se bhejo)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !question.trim()}>
          {loading ? "..." : "Poochho"}
        </button>
      </div>
    </div>
  );
}

export default Ask;
