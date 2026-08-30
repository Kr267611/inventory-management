import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../../Api/api";
import "./Ask.css";

/* Bade number chhote karke — 13280000 ko "1.33cr" */
const shortINR = (v) => {
  const n = Math.abs(v || 0);
  if (n >= 1e7) return `${(v / 1e7).toFixed(2)}cr`;
  if (n >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v || 0));
};
const fullINR = (v) => `Rs ${Math.round(v || 0).toLocaleString("en-IN")}`;

/* AI ka bheja hua graph — teen tarah ke: bar, hbar (letta hua), pie */
function AiChart({ chart }) {
  if (!chart?.data?.length) return null;
  const { type, title, series = [], data } = chart;

  return (
    <div className="ask-chart">
      {title && <div className="ask-chart__title">{title}</div>}

      <ResponsiveContainer width="100%" height={type === "hbar" ? Math.max(200, data.length * 34) : 260}>
        {type === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label={(d) => shortINR(d.value)}>
              {data.map((d, i) => <Cell key={i} fill={d.color || "#8b5cf6"} />)}
            </Pie>
            <Tooltip formatter={fullINR} />
            <Legend />
          </PieChart>
        ) : type === "hbar" ? (
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis type="number" tickFormatter={shortINR} fontSize={11} stroke="#6b7280" />
            <YAxis type="category" dataKey="name" width={110} fontSize={11} stroke="#6b7280" />
            <Tooltip formatter={fullINR} />
            {series.map((s) => <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[0, 5, 5, 0]} />)}
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="name" fontSize={11} stroke="#6b7280" />
            <YAxis tickFormatter={shortINR} fontSize={11} stroke="#6b7280" />
            <Tooltip formatter={fullINR} />
            <Legend />
            {series.map((s) => <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

const EXAMPLES = [
  "Total outstanding kitna hai?",
  "MARTIN'S ka kitna baaki hai?",
  "Sabse zyada baaki kis customer pe hai?",
  "Data me koi galti hai kya?",
  "TOYOSI ka poora hisaab dikha",
  "Bale 1293 ka ledger dikha",
  "Is saal mahine-wise sales dikha",
  "Mahine-wise sales ka graph dikha",
];

/* Rows backend ko bhejo, PDF bankar wapas aati hai (pdfkit se) */
async function downloadPDF({ name, rows, total }) {
  const base = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const res = await fetch(`${base}/ask/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ title: name, rows, total }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "PDF nahi ban paayi");

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/* Rows ko CSV bana ke download karo — wahi tareeka jo Reports page me hai */
function downloadCSV({ name, rows, total }) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(","));
  if (total) body.push(headers.map((h) => esc(total[h])).join(","));   // sabse neeche TOTAL
  const csv = [headers.join(","), ...body].join("\n");

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
  const [busyDl, setBusyDl] = useState(null);   // kaunsi file ban rahi hai

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
          chartData: res.chartData || null,
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
            {m.chartData && <AiChart chart={m.chartData} />}
            {m.exportData?.rows?.length > 0 && (
              <button
                className={`ask-dl${m.exportData.format === "pdf" ? " ask-dl--pdf" : ""}`}
                disabled={busyDl === i}
                onClick={async () => {
                  setBusyDl(i);
                  try {
                    if (m.exportData.format === "pdf") await downloadPDF(m.exportData);
                    else downloadCSV(m.exportData);
                  } catch (e) {
                    setMessages((prev) => [...prev, { role: "assistant", content: e.message, isError: true }]);
                  } finally {
                    setBusyDl(null);
                  }
                }}
              >
                {busyDl === i
                  ? "Ban rahi hai..."
                  : `⬇️ Download ${m.exportData.format === "pdf" ? "PDF" : "CSV"}`}
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
