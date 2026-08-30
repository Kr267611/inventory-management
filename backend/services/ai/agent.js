// Agent loop: model se poochho → jo tools maange wo chalao → results wapas do → repeat.
// Max 5 chakkar, taaki kabhi infinite loop na ho.

const { chat } = require("./provider");
const { definitions, handlers } = require("./tools");

const MAX_STEPS = 5;

const SYSTEM_PROMPT = `Tum Bhaskar Silk Mills ke inventory/accounts software ke andar ka assistant ho.
Business: textile trading — kapda Nigeria me becha jaata hai. Currency Rupees (Rs).

BUSINESS KE RULES (yaad rakho):
- Stock "bale" me hai. Har bale ka apna number hota hai aur wo unique hai.
- Payments customer-level "advance" ke roop me record hoti hain — kisi ek invoice se jodi NAHI jaatin
  (management ka rule hai). Isliye customer ka asli outstanding = uski total sales MINUS uska total paisa.
- Kuch customers ne apni sales se ZYADA paisa diya hai. Unka outstanding zero hai aur extra paisa
  "advance" hai — usko udhaar mat kehna.

KAAM KARNE KA TARIKA:
- Har number tools se hi lena. Apne se koi aankda mat banao, mat guess karo, purane jawaab se mat uthao.
- Sawaal ka jawaab dene ke liye jitne tools chahiye utne chalao — ek se kaam na chale to aur chalao.
- Tools jo amount dete hain wo pehle se format hain (jaise "Rs 1.43 cr"). Unhe waise hi likho,
  dobara convert mat karo.
- Agar tool bole ki customer nahi mila ya kai match hue, to user se poochho — naam mat maan lo.

FILE — CSV ya PDF:
- User file maange to export_data chalao (ya customer_ledger, agar ek customer ka khata chahiye).
- User ne "PDF", "print", "bhejna hai" bola  → format: "pdf"
  "CSV", "Excel", "sheet" bola ya kuch nahi bola → format: "csv"
- File apne aap ban jaati hai aur user ko download button dikh jaata hai —
  tumhe rows likhne ki zaroorat NAHI hai.
- Kabhi khud CSV, PDF, ya table ki poori rows mat likho. Sirf batao ki file
  taiyaar hai, kis format me hai, aur usme kya hai (kitni rows, kis cheez ki).

GRAPH:
- User "graph", "chart", "dikhao", "visual", "picture" maange to us tool me chart: true bhejo.
  Graph ye tools de sakte hain: business_totals, top_customers, monthly_report.
- Graph apne aap ban ke user ko dikh jayega — tumhe numbers dobara likhne ki
  zaroorat nahi. Bas 1-2 line me batao ki graph me kya dikh raha hai.

JAWAAB KAISA HO:
- Hinglish me likho (Hindi, English letters me) — jaise user likhta hai.
- Seedha matlab ki baat, chhota jawaab. Pehle jawaab, phir detail.
- Zaroorat ho to chhoti list ya table banao.
- Agar data me kuch ajeeb dikhe (duplicate, ulta hisaab), to bata dena.`;

/**
 * @param {string} question   user ka sawaal
 * @param {Array}  history    pichhle turns [{role:"user"|"assistant", content:string}]
 * @returns {Promise<{answer:string, toolsUsed:string[], model:string, steps:number}>}
 */
async function ask(question, history = []) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    // sirf aakhri 6 turns — context chhota rakhne ke liye
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: String(m.content) })),
    { role: "user", content: question },
  ];

  const toolsUsed = [];
  let model = "";
  let exportData = null; // agar kisi tool ne file ka data diya ho
  let chartData = null;  // agar kisi tool ne graph ka data diya ho

  for (let step = 1; step <= MAX_STEPS; step++) {
    const out = await chat({ messages, tools: definitions });
    model = out.model;
    const msg = out.message;
    messages.push(msg);

    const calls = msg.tool_calls || [];
    if (!calls.length) {
      return { answer: msg.content || "Jawaab nahi bana paaya, dobara poochho.", toolsUsed, model, steps: step, exportData, chartData };
    }

    // Model ne tools maange — chalao aur result wapas bhejo
    for (const call of calls) {
      const name = call.function?.name;
      let result;

      try {
        let args = {};
        if (call.function?.arguments) {
          args = typeof call.function.arguments === "string"
            ? JSON.parse(call.function.arguments)
            : call.function.arguments;
        }

        const fn = handlers[name];
        if (!fn) {
          result = { error: `"${name}" naam ka koi tool nahi hai.` };
        } else {
          toolsUsed.push(name);
          result = await fn(args);
        }
      } catch (e) {
        console.error(`AI tool "${name}" fail:`, e.message);
        result = { error: `Tool chalane me dikkat: ${e.message}` };
      }

      // File aur graph ka data model ko nahi bhejte — wo bada hai aur model
      // use bigaad sakta hai. Seedha frontend ko jaata hai.
      let forModel = result;
      if (result && result.__export) {
        const { __export, ...rest } = forModel;
        exportData = __export;
        forModel = {
          ...rest,
          file_ready: `${__export.rows.length} rows ki ${(__export.format || "csv").toUpperCase()} file taiyaar hai — user ko download button dikh jayega`,
        };
      }
      if (forModel && forModel.__chart) {
        const { __chart, ...rest } = forModel;
        chartData = __chart;
        forModel = { ...rest, chart_ready: "Graph ban gaya hai — user ko neeche dikh jayega" };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(forModel),
      });
    }
  }

  // Yahan tak pahunche matlab model tools maangta hi raha
  return {
    answer:
      "Sawaal thoda bada lag raha hai — thoda tod ke poochho (jaise ek customer ya ek date range ka).",
    toolsUsed,
    model,
    steps: MAX_STEPS,
    exportData,
    chartData,
  };
}

module.exports = { ask };
