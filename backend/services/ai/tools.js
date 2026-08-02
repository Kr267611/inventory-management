// AI ke liye READ-ONLY tools. Model sirf ye 7 function chala sakta hai —
// koi raw query execute nahi hoti, koi write/update/delete tool nahi hai.
// Isliye prompt-injection se bhi data kharab nahi ho sakta.

const mongoose = require("mongoose");
const Sales = require("../../models/Sales");
const Payment = require("../../models/Payment");
const Customer = require("../../models/Customer");
const Inventory = require("../../models/Inventory");

// Ye sirf populate() ke liye register karne hain — warna
// "Schema hasn't been registered for model X" error aata hai
require("../../models/paymentMode");
require("../../models/Design");
require("../../models/Color");
require("../../models/Fabric");

/* ──────── helpers ──────── */

const r2 = (n) => Math.round((n || 0) * 100) / 100;

// Indian format — model khud "1.43 cr" nahi bana paata, isliye ready bana ke dete hain
function money(n) {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1e7) return `Rs ${(v / 1e7).toFixed(2)} cr`;
  if (Math.abs(v) >= 1e5) return `Rs ${(v / 1e5).toFixed(2)} lakh`;
  return `Rs ${v.toLocaleString("en-IN")}`;
}

const day = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Customer naam se dhoondho — pehle exact, phir partial (case-insensitive)
async function findCustomers(name) {
  const rx = new RegExp(escapeRx(String(name || "").trim()), "i");
  const exact = await Customer.find({ name: new RegExp(`^${escapeRx(name)}$`, "i") }).select("name");
  if (exact.length) return exact;
  return Customer.find({ name: rx }).select("name").limit(10);
}

// Ek customer chahiye — na mile ya kai mile to model ko saaf batao
async function resolveOne(name) {
  const found = await findCustomers(name);
  if (!found.length) {
    const all = await Customer.find().select("name").limit(60);
    return { error: `"${name}" naam ka koi customer nahi mila.`, available: all.map((c) => c.name) };
  }
  if (found.length > 1) {
    return { error: `"${name}" se kai customer match hue — poora naam batao.`, matches: found.map((c) => c.name) };
  }
  return { customer: found[0] };
}

async function totalsFor(customerId) {
  const [s] = await Sales.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    { $group: { _id: null, sales: { $sum: "$netAmount" }, invoices: { $sum: 1 } } },
  ]);
  const [p] = await Payment.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    { $group: { _id: null, received: { $sum: "$amountReceived" }, payments: { $sum: 1 } } },
  ]);
  return {
    sales: r2(s?.sales || 0),
    invoices: s?.invoices || 0,
    received: r2(p?.received || 0),
    payments: p?.payments || 0,
  };
}

/* ──────── tool implementations ──────── */

// 1. Poore business ke totals — Outstanding = Sales − Received (wahi formula jo /payment/stats me hai)
async function business_totals() {
  const [s] = await Sales.aggregate([
    { $group: { _id: null, sales: { $sum: "$netAmount" }, invoices: { $sum: 1 } } },
  ]);
  const [p] = await Payment.aggregate([
    { $group: { _id: null, received: { $sum: "$amountReceived" }, payments: { $sum: 1 } } },
  ]);
  const byStatus = await Sales.aggregate([{ $group: { _id: "$paymentStatus", n: { $sum: 1 } } }]);

  const sales = r2(s?.sales || 0);
  const received = r2(p?.received || 0);
  const outstanding = r2(Math.max(sales - received, 0));

  return {
    total_sales: money(sales),
    total_received: money(received),
    total_outstanding: money(outstanding),
    invoice_count: s?.invoices || 0,
    payment_count: p?.payments || 0,
    customers: await Customer.countDocuments(),
    invoices_by_status: Object.fromEntries(byStatus.map((x) => [x._id || "Unknown", x.n])),
    raw: { sales, received, outstanding },
  };
}

// 2. Ek customer ka poora hisaab
async function customer_summary({ customer_name }) {
  const res = await resolveOne(customer_name);
  if (res.error) return res;

  const c = res.customer;
  const t = await totalsFor(c._id);
  const diff = r2(t.sales - t.received);

  return {
    customer: c.name,
    total_sales: money(t.sales),
    total_received: money(t.received),
    invoices: t.invoices,
    payments: t.payments,
    // Received > sales matlab extra jama hai (advance), udhaar nahi
    outstanding: diff > 0 ? money(diff) : "Rs 0",
    advance_extra: diff < 0 ? money(-diff) : null,
    note:
      diff < 0
        ? "Is customer ne sales se ZYADA paisa diya hai — extra advance pada hai."
        : diff === 0
        ? "Poora hisaab barabar hai."
        : null,
    raw: { sales: t.sales, received: t.received, outstanding: diff },
  };
}

// 3. Invoice dhoondho
async function search_invoices({ customer_name, invoice_no, from, to, status, limit }) {
  const q = {};

  if (customer_name) {
    const res = await resolveOne(customer_name);
    if (res.error) return res;
    q.customer = res.customer._id;
  }
  if (invoice_no) q.invoiceNo = new RegExp(escapeRx(invoice_no), "i");
  if (status) q.paymentStatus = status;
  if (from || to) {
    q.saleDate = {};
    if (from) q.saleDate.$gte = new Date(from);
    if (to) q.saleDate.$lte = new Date(to);
  }

  const n = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const rows = await Sales.find(q)
    .sort({ saleDate: -1 })
    .limit(n)
    .populate("customer", "name")
    .select("invoiceNo saleDate netAmount paidAmount balanceDue paymentStatus totalPcs totalMeter items customer");

  const matched = await Sales.countDocuments(q);

  return {
    matched,
    showing: rows.length,
    invoices: rows.map((s) => ({
      invoice: s.invoiceNo,
      date: day(s.saleDate),
      customer: s.customer?.name || null,
      amount: money(s.netAmount),
      status: s.paymentStatus,
      pcs: s.totalPcs,
      meter: s.totalMeter,
      bales: (s.items || []).map((i) => i.baleNo),
    })),
  };
}

// 4. Payment history
async function payment_history({ customer_name, limit }) {
  const res = await resolveOne(customer_name);
  if (res.error) return res;

  const n = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const rows = await Payment.find({ customer: res.customer._id })
    .sort({ paymentDate: -1 })
    .limit(n)
    .populate("paymentMode", "name")
    .select("paymentId paymentDate amountReceived paymentMode remarks status");

  const total = rows.reduce((a, p) => a + (p.amountReceived || 0), 0);

  return {
    customer: res.customer.name,
    showing: rows.length,
    total_shown: money(total),
    payments: rows.map((p) => ({
      id: p.paymentId,
      date: day(p.paymentDate),
      amount: money(p.amountReceived),
      mode: p.paymentMode?.name || null,
      remarks: p.remarks || null,
    })),
  };
}

// 5. Top customers
async function top_customers({ by, limit }) {
  const key = ["outstanding", "sales", "received"].includes(by) ? by : "outstanding";
  const n = Math.min(Math.max(Number(limit) || 10, 1), 30);

  const sales = await Sales.aggregate([{ $group: { _id: "$customer", v: { $sum: "$netAmount" } } }]);
  const pays = await Payment.aggregate([{ $group: { _id: "$customer", v: { $sum: "$amountReceived" } } }]);
  const names = new Map((await Customer.find().select("name")).map((c) => [String(c._id), c.name]));

  const salesMap = new Map(sales.map((x) => [String(x._id), x.v]));
  const payMap = new Map(pays.map((x) => [String(x._id), x.v]));

  const rows = [...new Set([...salesMap.keys(), ...payMap.keys()])].map((id) => {
    const s = salesMap.get(id) || 0;
    const p = payMap.get(id) || 0;
    return { name: names.get(id) || "?", sales: r2(s), received: r2(p), outstanding: r2(s - p) };
  });

  rows.sort((a, b) => b[key] - a[key]);

  return {
    sorted_by: key,
    customers: rows.slice(0, n).map((x, i) => ({
      rank: i + 1,
      customer: x.name,
      sales: money(x.sales),
      received: money(x.received),
      outstanding: x.outstanding > 0 ? money(x.outstanding) : "Rs 0",
      advance_extra: x.outstanding < 0 ? money(-x.outstanding) : null,
    })),
  };
}

// 6. Stock check
async function stock_check({ bale_no, only_available, limit }) {
  const q = {};
  if (bale_no) q.baleNo = new RegExp(escapeRx(bale_no), "i");
  if (only_available !== false) q.availablePcs = { $gt: 0 };

  const n = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const rows = await Inventory.find(q)
    .sort({ baleNo: 1 })
    .limit(n)
    .populate("design", "name")
    .populate("color", "name")
    .populate("fabric", "name")
    .select("baleNo availablePcs availableMeter rate design color fabric");

  const matched = await Inventory.countDocuments(q);
  const [agg] = await Inventory.aggregate([
    { $match: q },
    { $group: { _id: null, pcs: { $sum: "$availablePcs" }, meter: { $sum: "$availableMeter" } } },
  ]);

  return {
    matched_bales: matched,
    showing: rows.length,
    total_available_pcs: agg?.pcs || 0,
    total_available_meter: r2(agg?.meter || 0),
    bales: rows.map((i) => ({
      bale: i.baleNo,
      pcs: i.availablePcs,
      meter: r2(i.availableMeter),
      fabric: i.fabric?.name || null,
      design: i.design?.name || null,
      color: i.color?.name || null,
    })),
  };
}

// 7. Data me galtiyan dhoondho — wahi checks jo manually kiye the
async function find_anomalies() {
  const issues = [];
  const names = new Map((await Customer.find().select("name")).map((c) => [String(c._id), c.name]));

  // (a) Future ki date wali payments
  const future = await Payment.find({ paymentDate: { $gt: new Date() } })
    .populate("customer", "name")
    .select("paymentId paymentDate amountReceived customer");
  future.forEach((p) =>
    issues.push({
      type: "future_date_payment",
      detail: `${p.paymentId} — ${p.customer?.name || "?"} — ${money(p.amountReceived)} — date ${day(
        p.paymentDate
      )} (aaj se aage hai, shayad saal galat type hua)`,
    })
  );

  // (b) Bilkul same duplicate payments (same customer + amount + date + mode)
  const dupes = await Payment.aggregate([
    {
      $group: {
        _id: {
          c: "$customer",
          amt: "$amountReceived",
          d: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          m: "$paymentMode",
        },
        n: { $sum: 1 },
        ids: { $push: "$paymentId" },
      },
    },
    { $match: { n: { $gt: 1 } } },
  ]);
  dupes.forEach((d) =>
    issues.push({
      type: "duplicate_payment",
      detail: `${names.get(String(d._id.c)) || "?"} — ${money(d._id.amt)} — ${d._id.d} pe ${
        d.n
      } baar (${d.ids.join(", ")}). Double entry ho sakti hai — check karo.`,
    })
  );

  // (c) Jinhone sales se zyada paisa diya
  const sales = new Map(
    (await Sales.aggregate([{ $group: { _id: "$customer", v: { $sum: "$netAmount" } } }])).map((x) => [
      String(x._id),
      x.v,
    ])
  );
  const pays = await Payment.aggregate([{ $group: { _id: "$customer", v: { $sum: "$amountReceived" } } }]);
  pays.forEach((p) => {
    const extra = p.v - (sales.get(String(p._id)) || 0);
    if (extra > 1) {
      issues.push({
        type: "overpaid_customer",
        detail: `${names.get(String(p._id)) || "?"} — sales ${money(
          sales.get(String(p._id)) || 0
        )} par paisa ${money(p.v)} aaya — ${money(extra)} extra jama hai.`,
      });
    }
  });

  return {
    total_issues: issues.length,
    issues,
    checked: ["future dates", "duplicate payments", "overpaid customers"],
    note: issues.length === 0 ? "Koi problem nahi mili." : null,
  };
}

/* ──────── schemas (model ko ye dikhte hain) ──────── */

const definitions = [
  {
    type: "function",
    function: {
      name: "business_totals",
      description:
        "Poore business ke totals: total sales, total paisa aaya, total outstanding (baaki), invoice count, customer count, aur invoice status breakdown. Jab bhi overall/total/kul ka sawaal ho ye chalao.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "customer_summary",
      description:
        "Ek customer ka poora hisaab: kitni sales, kitna paisa aaya, kitna baaki, ya kitna extra advance jama hai. 'X ka kitna baaki hai' type sawaal ke liye.",
      parameters: {
        type: "object",
        properties: { customer_name: { type: "string", description: "Customer ka naam, poora ya adhoora" } },
        required: ["customer_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_invoices",
      description:
        "Sales invoices dhoondho — customer, invoice number, date range, ya payment status se. Har invoice ke saath bale numbers bhi aate hain.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          invoice_no: { type: "string", description: "Poora ya adhoora invoice number" },
          from: { type: "string", description: "Shuru date YYYY-MM-DD" },
          to: { type: "string", description: "Aakhri date YYYY-MM-DD" },
          status: { type: "string", enum: ["Paid", "Partial", "Unpaid"] },
          limit: { type: "integer", description: "Kitne dikhane hain (default 20, max 50)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "payment_history",
      description: "Ek customer ki saari payments date-wise — amount, mode, aur remarks ke saath.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          limit: { type: "integer", description: "default 30, max 100" },
        },
        required: ["customer_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "top_customers",
      description:
        "Customers ki ranking — sabse zyada outstanding (baaki), sales, ya received (paisa aaya) ke hisaab se.",
      parameters: {
        type: "object",
        properties: {
          by: { type: "string", enum: ["outstanding", "sales", "received"], description: "default outstanding" },
          limit: { type: "integer", description: "default 10, max 30" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "stock_check",
      description: "Inventory me stock dekho — kaunsi bale available hai, kitne pcs aur meter bache hain.",
      parameters: {
        type: "object",
        properties: {
          bale_no: { type: "string", description: "Bale number, poora ya adhoora" },
          only_available: { type: "boolean", description: "default true — sirf jinme stock bacha hai" },
          limit: { type: "integer", description: "default 20, max 50" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_anomalies",
      description:
        "Data me galtiyan dhoondho: future ki date wali payments, bilkul same duplicate payments, aur jinhone sales se zyada paisa diya. 'koi galti hai kya' type sawaal ke liye.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

const handlers = {
  business_totals,
  customer_summary,
  search_invoices,
  payment_history,
  top_customers,
  stock_check,
  find_anomalies,
};

module.exports = { definitions, handlers };
