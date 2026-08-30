// AI ke liye READ-ONLY tools. Model sirf ye 7 function chala sakta hai —
// koi raw query execute nahi hoti, koi write/update/delete tool nahi hai.
// Isliye prompt-injection se bhi data kharab nahi ho sakta.

const mongoose = require("mongoose");
const Sales = require("../../models/Sales");
const Payment = require("../../models/Payment");
const Customer = require("../../models/Customer");
const Inventory = require("../../models/Inventory");
const Inward = require("../../models/Inward");

// Ye sirf populate() ke liye register karne hain — warna
// "Schema hasn't been registered for model X" error aata hai
require("../../models/paymentMode");
require("../../models/Design");
require("../../models/Color");
require("../../models/Fabric");
require("../../models/Supplier");

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

// Bale number milane ke liye — case aur extra space ka farak na pade
const key = (s) => String(s || "").toUpperCase().trim();

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
async function business_totals({ chart } = {}) {
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

  const out = {
    total_sales: money(sales),
    total_received: money(received),
    total_outstanding: money(outstanding),
    invoice_count: s?.invoices || 0,
    payment_count: p?.payments || 0,
    customers: await Customer.countDocuments(),
    invoices_by_status: Object.fromEntries(byStatus.map((x) => [x._id || "Unknown", x.n])),
    raw: { sales, received, outstanding },
  };

  if (chart) {
    out.__chart = {
      type: "pie",
      title: `Total Sales ${money(sales)} — kitna aaya, kitna baaki`,
      data: [
        { name: "Paisa aaya", value: received, color: "#10b981" },
        { name: "Baaki", value: outstanding, color: "#f59e0b" },
      ],
    };
  }
  return out;
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

  // Grand total — jo dikha rahe hain uska nahi, POORE match ka
  const [tot] = await Sales.aggregate([
    { $match: q },
    { $group: { _id: null, amt: { $sum: "$netAmount" }, paid: { $sum: "$paidAmount" }, bal: { $sum: "$balanceDue" }, pcs: { $sum: "$totalPcs" }, mtr: { $sum: "$totalMeter" } } },
  ]);

  return {
    matched,
    showing: rows.length,
    grand_total: {
      invoices: matched,
      amount: money(tot?.amt || 0),
      paid: money(tot?.paid || 0),
      balance: money(tot?.bal || 0),
      pcs: tot?.pcs || 0,
      qty: r2(tot?.mtr || 0),
    },
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

  const [tot] = await Payment.aggregate([
    { $match: { customer: res.customer._id } },
    { $group: { _id: null, amt: { $sum: "$amountReceived" }, n: { $sum: 1 } } },
  ]);

  return {
    customer: res.customer.name,
    showing: rows.length,
    grand_total: { payments: tot?.n || 0, amount: money(tot?.amt || 0) },
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
async function top_customers({ by, limit, chart }) {
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

  const top = rows.slice(0, n);
  const out = {
    sorted_by: key,
    grand_total: {
      customers: rows.length,
      sales: money(rows.reduce((a, x) => a + x.sales, 0)),
      received: money(rows.reduce((a, x) => a + x.received, 0)),
      outstanding: money(rows.reduce((a, x) => a + Math.max(x.outstanding, 0), 0)),
    },
    customers: top.map((x, i) => ({
      rank: i + 1,
      customer: x.name,
      sales: money(x.sales),
      received: money(x.received),
      outstanding: x.outstanding > 0 ? money(x.outstanding) : "Rs 0",
      advance_extra: x.outstanding < 0 ? money(-x.outstanding) : null,
    })),
  };

  if (chart) {
    const label = key === "sales" ? "Sales" : key === "received" ? "Paisa aaya" : "Baaki";
    out.__chart = {
      type: "hbar",
      title: `Top ${top.length} customers — ${label}`,
      series: [{ key: label, color: key === "outstanding" ? "#f59e0b" : key === "received" ? "#10b981" : "#8b5cf6" }],
      data: top.map((x) => ({ name: x.name, [label]: r2(Math.abs(x[key])) })),
    };
  }
  return out;
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

// 8. Ek bale ki poori kahani — kab aayi, kab gayi, kitni bachi
async function bale_ledger({ bale_no }) {
  const b = await Inventory.findOne({ baleNo: new RegExp(`^${escapeRx(bale_no)}$`, "i") })
    .populate("fabric", "name").populate("design", "designNo").populate("color", "name");
  if (!b) return { error: `Bale "${bale_no}" inventory me nahi mila.` };

  const inw = await Inward.findById(b.inward).select("entryDate voucherNo totalPcs totalMeter rate");
  const sales = await Sales.find({ "items.baleNo": b.baleNo })
    .sort({ saleDate: 1 }).populate("customer", "name").select("invoiceNo saleDate customer items");

  const moves = [];
  let bal = 0;
  if (inw) {
    bal += inw.totalPcs || 0;
    moves.push({ date: day(inw.entryDate), type: "INWARD", ref: inw.voucherNo || "-", in: inw.totalPcs, out: 0, balance: bal });
  }
  sales.forEach((s) => {
    const it = (s.items || []).find((i) => key(i.baleNo) === key(b.baleNo));
    const out = it?.pcs || 0;
    bal -= out;
    moves.push({ date: day(s.saleDate), type: "SALE", ref: `${s.invoiceNo} (${s.customer?.name || "?"})`, in: 0, out, balance: bal });
  });

  return {
    bale: b.baleNo,
    fabric: b.fabric?.name || null,
    design: b.design?.designNo || null,
    color: b.color?.name || null,
    aaya_tha_pcs: b.totalPcs,
    abhi_available_pcs: b.availablePcs,
    status: b.availablePcs > 0 ? "In Stock" : "Out of Stock",
    movements: moves,
    note: bal !== b.availablePcs ? `Dhyan do: ledger ka balance ${bal} hai par inventory ${b.availablePcs} bol rahi hai.` : null,
  };
}

// 9. Inward dhoondho — kaunsa maal kab aaya
async function inward_search({ bale_no, voucher_no, from, to, limit }) {
  const q = {};
  if (bale_no) q.baleNo = new RegExp(escapeRx(bale_no), "i");
  if (voucher_no) q.voucherNo = new RegExp(escapeRx(voucher_no), "i");
  if (from || to) {
    q.entryDate = {};
    if (from) q.entryDate.$gte = new Date(from);
    if (to) q.entryDate.$lte = new Date(to);
  }
  const n = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const rows = await Inward.find(q).sort({ entryDate: -1 }).limit(n)
    .populate("fabric", "name").populate("supplier", "name")
    .select("entryDate voucherNo baleNo totalPcs totalMeter rate fabric supplier");
  const matched = await Inward.countDocuments(q);
  const [agg] = await Inward.aggregate([{ $match: q }, { $group: { _id: null, p: { $sum: "$totalPcs" }, m: { $sum: "$totalMeter" } } }]);

  return {
    matched,
    showing: rows.length,
    total_pcs: agg?.p || 0,
    total_qty: r2(agg?.m || 0),
    entries: rows.map((i) => ({
      date: day(i.entryDate), voucher: i.voucherNo, bale: i.baleNo,
      pcs: i.totalPcs, qty: r2(i.totalMeter), rate: i.rate,
      fabric: i.fabric?.name || null, supplier: i.supplier?.name || null,
    })),
  };
}

// 10. Mahine-wise report
async function monthly_report({ year, months, chart }) {
  const y = Number(year) || new Date().getFullYear();
  const start = new Date(Date.UTC(y, 0, 1)), end = new Date(Date.UTC(y + 1, 0, 1));

  const s = await Sales.aggregate([
    { $match: { saleDate: { $gte: start, $lt: end } } },
    { $group: { _id: { $month: "$saleDate" }, amt: { $sum: "$netAmount" }, n: { $sum: 1 }, pcs: { $sum: "$totalPcs" } } },
  ]);
  const p = await Payment.aggregate([
    { $match: { paymentDate: { $gte: start, $lt: end } } },
    { $group: { _id: { $month: "$paymentDate" }, amt: { $sum: "$amountReceived" }, n: { $sum: 1 } } },
  ]);

  const nm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sM = new Map(s.map((x) => [x._id, x])), pM = new Map(p.map((x) => [x._id, x]));
  const want = Array.isArray(months) && months.length ? months.map(Number) : [...Array(12)].map((_, i) => i + 1);

  const rows = want.filter((m) => sM.has(m) || pM.has(m)).map((m) => ({
    month: `${nm[m - 1]} ${y}`,
    sales: money(sM.get(m)?.amt || 0),
    invoices: sM.get(m)?.n || 0,
    pcs_becha: sM.get(m)?.pcs || 0,
    paisa_aaya: money(pM.get(m)?.amt || 0),
    payments: pM.get(m)?.n || 0,
  }));

  const out = {
    year: y,
    months: rows,
    grand_total: {
      sales: money(s.reduce((a, x) => a + x.amt, 0)),
      received: money(p.reduce((a, x) => a + x.amt, 0)),
      invoices: s.reduce((a, x) => a + x.n, 0),
    },
  };

  if (chart) {
    out.__chart = {
      type: "bar",
      title: `${y} — mahine-wise`,
      xKey: "name",
      series: [
        { key: "Sales", color: "#8b5cf6" },
        { key: "Paisa aaya", color: "#10b981" },
      ],
      data: want
        .filter((m) => sM.has(m) || pM.has(m))
        .map((m) => ({ name: nm[m - 1], Sales: r2(sM.get(m)?.amt || 0), "Paisa aaya": r2(pM.get(m)?.amt || 0) })),
    };
  }
  return out;
}

// 11. Customer ka poora ledger — date-wise, running balance ke saath
async function customer_ledger({ customer_name, from, to, format }) {
  const res = await resolveOne(customer_name);
  if (res.error) return res;
  const c = res.customer;

  const dq = {};
  if (from) dq.$gte = new Date(from);
  if (to) dq.$lte = new Date(to);

  const sq = { customer: c._id }, pq = { customer: c._id };
  if (from || to) { sq.saleDate = dq; pq.paymentDate = dq; }

  const sales = await Sales.find(sq).select("saleDate invoiceNo netAmount").lean();
  const pays = await Payment.find(pq).populate("paymentMode", "name").select("paymentDate paymentId amountReceived paymentMode").lean();

  const rows = [
    ...sales.map((s) => ({ d: s.saleDate, type: "SALE", ref: s.invoiceNo, debit: s.netAmount || 0, credit: 0 })),
    ...pays.map((p) => ({ d: p.paymentDate, type: "PAYMENT", ref: `${p.paymentId}${p.paymentMode?.name ? " / " + p.paymentMode.name : ""}`, debit: 0, credit: p.amountReceived || 0 })),
  ].sort((a, b) => new Date(a.d) - new Date(b.d));

  let bal = 0;
  const ledger = rows.map((r) => {
    bal += r.debit - r.credit;
    return { date: day(r.d), type: r.type, reference: r.ref, maal_diya: r2(r.debit), paisa_aaya: r2(r.credit), balance: r2(bal) };
  });

  return {
    customer: c.name,
    entries: ledger.length,
    ledger,
    final_balance: money(bal),
    matlab: bal > 0 ? `${c.name} pe ${money(bal)} baaki hai` : bal < 0 ? `${c.name} ka ${money(-bal)} extra jama hai` : "Hisaab barabar hai",
    __export: {
      name: `ledger-${c.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      rows: ledger,
      total: totalRow(ledger, ["maal_diya", "paisa_aaya"]),
      format: String(format || "").toLowerCase() === "pdf" ? "pdf" : "csv",
    },
  };
}

// 12. Do time period compare karo
async function compare_period({ from_a, to_a, from_b, to_b }) {
  const win = async (f, t) => {
    const sq = { saleDate: { $gte: new Date(f), $lte: new Date(t) } };
    const pq = { paymentDate: { $gte: new Date(f), $lte: new Date(t) } };
    const [s] = await Sales.aggregate([{ $match: sq }, { $group: { _id: null, amt: { $sum: "$netAmount" }, n: { $sum: 1 }, pcs: { $sum: "$totalPcs" } } }]);
    const [p] = await Payment.aggregate([{ $match: pq }, { $group: { _id: null, amt: { $sum: "$amountReceived" }, n: { $sum: 1 } } }]);
    return { sales: r2(s?.amt || 0), invoices: s?.n || 0, pcs: s?.pcs || 0, received: r2(p?.amt || 0), payments: p?.n || 0 };
  };
  const A = await win(from_a, to_a), Bp = await win(from_b, to_b);
  const pct = (a, b) => (b === 0 ? (a > 0 ? "naya" : "0%") : `${(((a - b) / b) * 100).toFixed(1)}%`);

  return {
    period_A: { range: `${from_a} se ${to_a}`, sales: money(A.sales), invoices: A.invoices, pcs: A.pcs, received: money(A.received) },
    period_B: { range: `${from_b} se ${to_b}`, sales: money(Bp.sales), invoices: Bp.invoices, pcs: Bp.pcs, received: money(Bp.received) },
    farak: {
      sales: money(A.sales - Bp.sales) + `  (${pct(A.sales, Bp.sales)})`,
      received: money(A.received - Bp.received) + `  (${pct(A.received, Bp.received)})`,
      invoices: A.invoices - Bp.invoices,
      pcs: A.pcs - Bp.pcs,
    },
  };
}

// 13. Excel/CSV file bana ke do — rows seedha DB se, model ne nahi likhe
/* Report ke neeche TOTAL ki line.
   ZAROORI: export ki rows me paisa PLAIN NUMBER hona chahiye ("6.87 cr" nahi) —
   warna na yahan jod banta hai aur na Excel me SUM lagta hai. */
function totalRow(rows, sumCols = []) {
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  const out = {};
  let labelPut = false;

  headers.forEach((h) => {
    if (sumCols.includes(h)) {
      out[h] = r2(rows.reduce((a, r) => a + (Number(r[h]) || 0), 0));
    } else if (!labelPut) {
      out[h] = `TOTAL (${rows.length} rows)`;
      labelPut = true;
    } else {
      out[h] = "";
    }
  });
  return out;
}

async function export_data({ report, customer_name, from, to, status, format }) {
  const stamp = new Date().toISOString().slice(0, 10);
  // User ne PDF maanga ya CSV — model yahi decide karke bhejta hai
  const fmt = String(format || "").toLowerCase() === "pdf" ? "pdf" : "csv";

  if (report === "invoices") {
    const q = {};
    if (customer_name) { const r = await resolveOne(customer_name); if (r.error) return r; q.customer = r.customer._id; }
    if (status) q.paymentStatus = status;
    if (from || to) { q.saleDate = {}; if (from) q.saleDate.$gte = new Date(from); if (to) q.saleDate.$lte = new Date(to); }
    const rows = (await Sales.find(q).sort({ saleDate: -1 }).populate("customer", "name")
      .select("invoiceNo saleDate customer totalPcs totalMeter netAmount paidAmount balanceDue paymentStatus items").lean())
      .map((s) => ({
        Date: day(s.saleDate), Invoice: s.invoiceNo, Customer: s.customer?.name || "",
        Bales: (s.items || []).map((i) => i.baleNo).join("; "),
        Pcs: s.totalPcs, Qty: r2(s.totalMeter), Amount: r2(s.netAmount),
        Paid: r2(s.paidAmount), Balance: r2(s.balanceDue), Status: s.paymentStatus,
      }));
    return { report: "invoices", rows_count: rows.length, __export: { name: `invoices-${stamp}`, rows, format: fmt, total: totalRow(rows, ["Amount","Paid","Balance","Pcs","Qty"]) } };
  }

  if (report === "payments") {
    const q = {};
    if (customer_name) { const r = await resolveOne(customer_name); if (r.error) return r; q.customer = r.customer._id; }
    if (from || to) { q.paymentDate = {}; if (from) q.paymentDate.$gte = new Date(from); if (to) q.paymentDate.$lte = new Date(to); }
    const rows = (await Payment.find(q).sort({ paymentDate: -1 }).populate("customer", "name").populate("paymentMode", "name")
      .select("paymentId paymentDate customer amountReceived paymentMode remarks").lean())
      .map((p) => ({
        Date: day(p.paymentDate), PaymentID: p.paymentId, Customer: p.customer?.name || "",
        Amount: r2(p.amountReceived), Mode: p.paymentMode?.name || "", Remarks: p.remarks || "",
      }));
    return { report: "payments", rows_count: rows.length, __export: { name: `payments-${stamp}`, rows, format: fmt, total: totalRow(rows, ["Amount"]) } };
  }

  if (report === "stock") {
    const rows = (await Inventory.find({ availablePcs: { $gt: 0 } }).sort({ baleNo: 1 })
      .populate("fabric", "name").populate("design", "designNo").populate("color", "name")
      .select("baleNo totalPcs availablePcs availableMeter rate fabric design color").lean())
      .map((b) => ({
        Bale: b.baleNo, Fabric: b.fabric?.name || "", Design: b.design?.designNo || "", Color: b.color?.name || "",
        TotalPcs: b.totalPcs, AvailablePcs: b.availablePcs, AvailableQty: r2(b.availableMeter), Rate: b.rate,
      }));
    return { report: "stock", rows_count: rows.length, __export: { name: `stock-${stamp}`, rows, format: fmt, total: totalRow(rows, ["TotalPcs","AvailablePcs","AvailableQty"]) } };
  }

  if (report === "outstanding") {
    // Raw numbers se banate hain, formatted text se nahi — warna jod galat aata hai
    const sales = new Map((await Sales.aggregate([{ $group: { _id: "$customer", v: { $sum: "$netAmount" } } }])).map((x) => [String(x._id), x.v]));
    const pays = new Map((await Payment.aggregate([{ $group: { _id: "$customer", v: { $sum: "$amountReceived" } } }])).map((x) => [String(x._id), x.v]));
    const names = new Map((await Customer.find().select("name").lean()).map((c) => [String(c._id), c.name]));

    const rows = [...new Set([...sales.keys(), ...pays.keys()])]
      .map((id) => {
        const s = sales.get(id) || 0, p = pays.get(id) || 0;
        return { name: names.get(id) || "?", s, p, bal: s - p };
      })
      .sort((a, b) => b.bal - a.bal)
      .map((x, i) => ({
        Rank: i + 1,
        Customer: x.name,
        Sales: r2(x.s),
        Received: r2(x.p),
        Outstanding: r2(Math.max(x.bal, 0)),
        AdvanceExtra: r2(Math.max(-x.bal, 0)),
      }));

    return {
      report: "outstanding",
      rows_count: rows.length,
      __export: { name: `outstanding-${stamp}`, rows, format: fmt, total: totalRow(rows, ["Sales", "Received", "Outstanding", "AdvanceExtra"]) },
    };
  }

  return { error: `"${report}" report nahi hai. Ye chal sakti hain: invoices, payments, stock, outstanding.` };
}

/* ──────── schemas (model ko ye dikhte hain) ──────── */

const definitions = [
  {
    type: "function",
    function: {
      name: "business_totals",
      description:
        "Poore business ke totals: total sales, total paisa aaya, total outstanding (baaki), invoice count, customer count, aur invoice status breakdown. Jab bhi overall/total/kul ka sawaal ho ye chalao. Graph maanga ho to chart:true.",
      parameters: { type: "object", properties: { chart: { type: "boolean", description: "User graph/chart maange to true" } }, required: [] },
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
          chart: { type: "boolean", description: "User graph/chart maange to true" },
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
  {
    type: "function",
    function: {
      name: "bale_ledger",
      description:
        "Ek bale ki poori kahani date-wise: kab inward hui, kaunse invoice me kis customer ko gayi, aur abhi kitni bachi. 'bale 1293 ka hisaab dikha' type sawaal ke liye.",
      parameters: {
        type: "object",
        properties: { bale_no: { type: "string", description: "Bale number, poora" } },
        required: ["bale_no"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inward_search",
      description:
        "Inward entries dhoondho — kaunsa maal kab aaya, kitne pcs, kaunse supplier se. Bale number, voucher number ya date range se.",
      parameters: {
        type: "object",
        properties: {
          bale_no: { type: "string" },
          voucher_no: { type: "string" },
          from: { type: "string", description: "YYYY-MM-DD" },
          to: { type: "string", description: "YYYY-MM-DD" },
          limit: { type: "integer", description: "default 20, max 50" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "monthly_report",
      description:
        "Mahine-wise report: har mahine kitni sales hui, kitne invoice bane, kitne pcs gaye, aur kitna paisa aaya. 'June me kitna becha' ya 'is saal ka mahina-wise' type sawaal ke liye.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "saal, jaise 2026 (default: is saal)" },
          months: { type: "array", items: { type: "integer" }, description: "sirf kuch mahine chahiye to [6,7]" },
          chart: { type: "boolean", description: "User graph/chart maange to true" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "customer_ledger",
      description:
        "Ek customer ka poora khata date-wise — har sale aur har payment, running balance ke saath. 'TOYOSI ka poora hisaab dikha' type sawaal ke liye.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          from: { type: "string", description: "YYYY-MM-DD" },
          to: { type: "string", description: "YYYY-MM-DD" },
          format: { type: "string", enum: ["csv", "pdf"], description: "User ne PDF maanga to 'pdf', warna 'csv'" },
        },
        required: ["customer_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_period",
      description:
        "Do time period ka comparison — sales, paisa, invoice, pcs. 'is mahine vs pichhle mahine' ya 'is saal vs pichhle saal' type sawaal ke liye.",
      parameters: {
        type: "object",
        properties: {
          from_a: { type: "string", description: "pehle period ki shuru date YYYY-MM-DD" },
          to_a: { type: "string", description: "pehle period ki aakhri date" },
          from_b: { type: "string", description: "dusre period ki shuru date" },
          to_b: { type: "string", description: "dusre period ki aakhri date" },
        },
        required: ["from_a", "to_a", "from_b", "to_b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_data",
      description:
        "Report ki file bana ke do — CSV/Excel ya PDF. Jab user 'CSV do', 'Excel me chahiye', 'PDF me chahiye', 'file bana do', 'download karna hai', 'print karna hai' kahe tab ye chalao. Rows seedha database se aati hain.",
      parameters: {
        type: "object",
        properties: {
          report: { type: "string", enum: ["invoices", "payments", "stock", "outstanding"], description: "kaunsi report chahiye" },
          format: { type: "string", enum: ["csv", "pdf"], description: "User ne PDF/print maanga to 'pdf', warna 'csv' (default)" },
          customer_name: { type: "string", description: "sirf ek customer ka chahiye to" },
          from: { type: "string", description: "YYYY-MM-DD" },
          to: { type: "string", description: "YYYY-MM-DD" },
          status: { type: "string", enum: ["Paid", "Partial", "Unpaid"], description: "sirf invoices report ke liye" },
        },
        required: ["report"],
      },
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
  bale_ledger,
  inward_search,
  monthly_report,
  customer_ledger,
  compare_period,
  export_data,
};

module.exports = { definitions, handlers };
