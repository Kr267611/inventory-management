import { useState, useMemo } from "react";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M20 12v0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2v-4h-2z" />
    </svg>
  ),
  Bag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Dots: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* ================================================================
   MOCK DATA — baad me API se replace karna
   ================================================================ */
const STAT_CARDS = [
  { label: "Total Collection (This Month)", value: 1245, change: "+18.6%", changeUp: true, icon: "wallet", color: "blue" },
  { label: "Total Received", value: 1257, change: "+12.4%", changeUp: true, icon: "bag", color: "green" },
  { label: "Total Outstanding", value: 4865, change: "-5.2%", changeUp: false, icon: "clock", color: "orange" },
  { label: "Overdue Amount", value: 1530, change: "View overdue", isLink: true, icon: "alert", color: "purple" },
];

const PAYMENT_OVERVIEW = [
  { label: "Total Invoices", value: 1744, color: "default" },
  { label: "Total Received", value: 1257, color: "green" },
  { label: "Total Outstanding", value: 4865, color: "orange" },
  { label: "Overdue Amount", value: 1530, color: "red" },
];

const PAYMENT_MODE_SUMMARY = [
  { name: "NEFT", percent: 48.5, color: "#3b82f6" },
  { name: "Cash", percent: 22.1, color: "#10b981" },
  { name: "UPI", percent: 15.3, color: "#8b5cf6" },
  { name: "Cheque", percent: 14.1, color: "#f59e0b" },
];

const TOP_CUSTOMERS = [
  { name: "Riya Boutique", amount: 1245 },
  { name: "Milan Textiles", amount: 875 },
  { name: "Shivam Traders", amount: 650 },
  { name: "ABC Exports", amount: 525 },
  { name: "Om Fabrics", amount: 380 },
];

const RECENT_OVERDUE = [
  { invoice: "INV-2025-154", customer: "Riya Boutique", amount: 525000, days: 15 },
  { invoice: "INV-2025-148", customer: "Milan Textiles", amount: 340000, days: 12 },
  { invoice: "INV-2025-142", customer: "Shivam Traders", amount: 275000, days: 10 },
];

const PAYMENTS = [
  { id: "PAY-000186", date: "24 May 2025", customer: "Riya Boutique",  invoice: "INV-2025-186", mode: "NEFT",   refNo: "UTR1234567890",   amount: 15000,  outstanding: 25000, balance: 10000, status: "Partial" },
  { id: "PAY-000185", date: "24 May 2025", customer: "Milan Textiles", invoice: "INV-2025-185", mode: "Cash",   refNo: "-",               amount: 8500,   outstanding: 8500,  balance: 0,     status: "Paid" },
  { id: "PAY-000184", date: "23 May 2025", customer: "Shivam Traders", invoice: "INV-2025-184", mode: "Cheque", refNo: "CHQ123456",       amount: 20000,  outstanding: 50000, balance: 30000, status: "Partial" },
  { id: "PAY-000183", date: "23 May 2025", customer: "Om Fabrics",     invoice: "INV-2025-183", mode: "UPI",    refNo: "UPI/512345678901", amount: 12750, outstanding: 12750, balance: 0,     status: "Paid" },
  { id: "PAY-000182", date: "22 May 2025", customer: "ABC Exports",    invoice: "INV-2025-182", mode: "NEFT",   refNo: "UTR9876543210",   amount: 35000,  outstanding: 85000, balance: 50000, status: "Partial" },
  { id: "PAY-000181", date: "22 May 2025", customer: "Riya Boutique",  invoice: "INV-2025-181", mode: "Cash",   refNo: "-",               amount: 5000,   outstanding: 5000,  balance: 0,     status: "Paid" },
  { id: "PAY-000180", date: "21 May 2025", customer: "Shivam Traders", invoice: "INV-2025-180", mode: "Cheque", refNo: "CHQ987654",       amount: 10000,  outstanding: 40000, balance: 30000, status: "Partial" },
  { id: "PAY-000179", date: "20 May 2025", customer: "Shivam Traders", invoice: "INV-2025-179", mode: "NEFT",   refNo: "UTR4567891230",   amount: 25000,  outstanding: 25000, balance: 0,     status: "Paid" },
  { id: "PAY-000178", date: "20 May 2025", customer: "Maa Textiles",   invoice: "INV-2025-178", mode: "UPI",    refNo: "UPI/968877665544", amount: 7500,  outstanding: 22500, balance: 15000, status: "Partial" },
  { id: "PAY-000177", date: "19 May 2025", customer: "Om Fabrics",     invoice: "INV-2025-177", mode: "Cash",   refNo: "-",               amount: 3250,   outstanding: 3250,  balance: 0,     status: "Paid" },
];

const CUSTOMERS = ["All Customers", "Riya Boutique", "Milan Textiles", "Shivam Traders", "Om Fabrics", "ABC Exports", "Maa Textiles"];
const COMPANIES = ["All Companies", "Bhaskar Silk Mills", "BSM Exports"];
const MODES = ["All Modes", "NEFT", "Cash", "UPI", "Cheque", "RTGS"];
const STATUSES = ["All Status", "Paid", "Partial", "Pending"];

/* ================================================================
   HELPERS
   ================================================================ */
const fmtINR = (n) => "₹ " + Number(n).toLocaleString("en-IN");
const fmtINRCompact = (n) => Number(n).toLocaleString("en-IN");

const EMPTY_PAYMENT_FORM = {
  customer: "",
  invoiceNo: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  totalInvoiceAmount: "",
  outstandingAmount: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMode: "NEFT",
  refNo: "",
  amountReceived: "",
  remarks: "",
  company: "Bhaskar Silk Mills",
  receivedBy: "Admin User",
  proofFileName: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function Payment() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_PAYMENT_FORM);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: "2025-05-01",
    toDate: "2025-05-24",
    customer: "All Customers",
    company: "All Companies",
    mode: "All Modes",
    invoiceSearch: "",
    status: "All Status",
    refSearch: "",
  });

  const setF = (k, v) => setFilters({ ...filters, [k]: v });
  const setFm = (k, v) => setForm({ ...form, [k]: v });

  const balanceAfter = useMemo(() => {
    const out = parseFloat(form.outstandingAmount) || 0;
    const recv = parseFloat(form.amountReceived) || 0;
    return Math.max(out - recv, 0);
  }, [form.outstandingAmount, form.amountReceived]);

  const openAdd = () => {
    setForm(EMPTY_PAYMENT_FORM);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.customer) return alert("Customer select karo");
    if (!form.amountReceived) return alert("Amount Received daalo");
    alert("Payment save ho gaya (mock).\n\n" + JSON.stringify({ ...form, balanceAfter }, null, 2));
    setShowAdd(false);
  };

  return (
    <div className="payment-page">
      {/* HEADER */}
      <div className="payment-page__header">
        <div>
          <h1 className="payment-page__title">Payment Details</h1>
          <div className="payment-breadcrumb">
            <span>Home</span>
            <span className="payment-breadcrumb__sep">/</span>
            <span className="payment-breadcrumb__current">Payment Details</span>
          </div>
        </div>
        <div className="payment-page__actions">
          <button className="payment-btn payment-btn--primary" onClick={openAdd}>
            <Icon.Plus /><span>Add Payment</span>
          </button>
          <button className="payment-btn payment-btn--ghost">
            <Icon.Upload /><span>Import Payment</span>
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="payment-layout">
        {/* MAIN COLUMN */}
        <main className="payment-main">
          {/* Stat cards */}
          <div className="payment-stats">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="payment-stat">
                <div className={`payment-stat__icon payment-stat__icon--${s.color}`}>
                  {s.icon === "wallet" && <Icon.Wallet />}
                  {s.icon === "bag" && <Icon.Bag />}
                  {s.icon === "clock" && <Icon.Clock />}
                  {s.icon === "alert" && <Icon.Alert />}
                </div>
                <div className="payment-stat__body">
                  <div className="payment-stat__label">{s.label}</div>
                  <div className="payment-stat__value">{fmtINR(s.value)}</div>
                  {s.isLink ? (
                    <a href="/dashboard/inventory" className="payment-stat__link">{s.change}</a>
                  ) : (
                    <div className={`payment-stat__change ${s.changeUp ? "is-up" : "is-down"}`}>
                      {s.change} <span className="payment-stat__since">from last month</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Filters card */}
          <div className="payment-card payment-filters">
            <div className="payment-filters__row">
              <Field label="From Date">
                <div className="payment-input-wrap">
                  <input type="date" className="payment-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
                  <span className="payment-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="To Date">
                <div className="payment-input-wrap">
                  <input type="date" className="payment-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
                  <span className="payment-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="Customer">
                <select className="payment-input" value={filters.customer} onChange={(e) => setF("customer", e.target.value)}>
                  {CUSTOMERS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Company">
                <select className="payment-input" value={filters.company} onChange={(e) => setF("company", e.target.value)}>
                  {COMPANIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Payment Mode">
                <select className="payment-input" value={filters.mode} onChange={(e) => setF("mode", e.target.value)}>
                  {MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>

            <div className="payment-filters__row">
              <Field label="Invoice / Bill No.">
                <div className="payment-input-wrap">
                  <span className="payment-input__icon payment-input__icon--left"><Icon.Search /></span>
                  <input className="payment-input payment-input--with-left-icon" placeholder="Search Invoice / Bill No." value={filters.invoiceSearch} onChange={(e) => setF("invoiceSearch", e.target.value)} />
                </div>
              </Field>
              <Field label="Payment Status">
                <select className="payment-input" value={filters.status} onChange={(e) => setF("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Reference No.">
                <input className="payment-input" placeholder="Cheque / Ref No." value={filters.refSearch} onChange={(e) => setF("refSearch", e.target.value)} />
              </Field>
              <div className="payment-filters__actions">
                <button className="payment-btn payment-btn--primary">
                  <Icon.Search /><span>Search</span>
                </button>
                <button className="payment-btn payment-btn--ghost">
                  <Icon.Refresh /><span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Payment list table */}
          <div className="payment-card">
            <div className="payment-table-head">
              <h2 className="payment-card__title">Payment List</h2>
              <div className="payment-table-head__right">
                <span className="payment-muted">Showing 1 to 10 of 186 entries</span>
                <select className="payment-input payment-input--xs">
                  <option>10</option><option>25</option><option>50</option><option>100</option>
                </select>
              </div>
            </div>

            <div className="payment-table-wrap">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Payment Date</th>
                    <th>Customer</th>
                    <th>Invoice / Bill No.</th>
                    <th>Payment Mode</th>
                    <th>Reference No.</th>
                    <th className="payment-th--right">Amount Received (₹)</th>
                    <th className="payment-th--right">Outstanding Before (₹)</th>
                    <th className="payment-th--right">Balance (₹)</th>
                    <th>Status</th>
                    <th className="payment-th--center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENTS.map((p) => (
                    <tr key={p.id} className="payment-tr">
                      <td className="payment-mono">{p.id}</td>
                      <td>{p.date}</td>
                      <td>{p.customer}</td>
                      <td className="payment-td--link">{p.invoice}</td>
                      <td><span className={`payment-mode payment-mode--${p.mode.toLowerCase()}`}>{p.mode}</span></td>
                      <td className="payment-mono payment-muted">{p.refNo}</td>
                      <td className="payment-td--right">{fmtINRCompact(p.amount.toFixed(2))}</td>
                      <td className="payment-td--right">{fmtINRCompact(p.outstanding.toFixed(2))}</td>
                      <td className={`payment-td--right ${p.balance > 0 ? "payment-balance-due" : "payment-balance-zero"}`}>
                        {fmtINRCompact(p.balance.toFixed(2))}
                      </td>
                      <td>
                        <span className={`payment-badge payment-badge--${p.status.toLowerCase()}`}>{p.status}</span>
                      </td>
                      <td className="payment-td--center">
                        <button type="button" className="payment-icon-btn" title="View"><Icon.Dots /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="payment-pagination">
              <button className="payment-page-btn" disabled>Previous</button>
              <button className="payment-page-btn payment-page-btn--active">1</button>
              <button className="payment-page-btn">2</button>
              <button className="payment-page-btn">3</button>
              <button className="payment-page-btn">4</button>
              <button className="payment-page-btn">5</button>
              <span className="payment-muted">...</span>
              <button className="payment-page-btn">19</button>
              <button className="payment-page-btn">Next</button>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="payment-side">
          {/* Payment Overview */}
          <div className="payment-card">
            <h3 className="payment-card__title">Payment Overview</h3>
            <div className="payment-overview">
              {PAYMENT_OVERVIEW.map((o) => (
                <div key={o.label} className="payment-overview__row">
                  <span className="payment-overview__label">{o.label}</span>
                  <span className={`payment-overview__val payment-overview__val--${o.color}`}>{fmtINR(o.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Mode Summary */}
          <div className="payment-card">
            <h3 className="payment-card__title">Payment Mode Summary</h3>
            <DonutChart
              segments={PAYMENT_MODE_SUMMARY}
              centerTop="Total Received"
              centerBottom={fmtINR(12578620)}
            />
            <div className="payment-legend">
              {PAYMENT_MODE_SUMMARY.map((m) => (
                <div key={m.name} className="payment-legend__row">
                  <span className="payment-legend__dot" style={{ background: m.color }} />
                  <span className="payment-legend__name">{m.name}</span>
                  <span className="payment-legend__pct">{m.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="payment-card">
            <h3 className="payment-card__title">Top Customers (Outstanding)</h3>
            <div className="payment-list">
              {TOP_CUSTOMERS.map((c) => (
                <div key={c.name} className="payment-list__row">
                  <span className="payment-list__name">{c.name}</span>
                  <span className="payment-list__val">{fmtINR(c.amount)}</span>
                </div>
              ))}
            </div>
            <a href="/dashboard/customers" className="payment-link">View all customers</a>
          </div>

          {/* Recent Overdue */}
          <div className="payment-card">
            <h3 className="payment-card__title">Recent Overdue Invoices</h3>
            <div className="payment-overdue">
              {RECENT_OVERDUE.map((o) => (
                <div key={o.invoice} className="payment-overdue__row">
                  <div>
                    <div className="payment-overdue__inv">{o.invoice}</div>
                    <div className="payment-overdue__cust">{o.customer}</div>
                  </div>
                  <div className="payment-overdue__right">
                    <div className="payment-overdue__amt">{fmtINR(o.amount)}</div>
                    <div className="payment-overdue__days">{o.days} Days</div>
                  </div>
                </div>
              ))}
            </div>
            <a href="/dashboard/overdue" className="payment-link">View all overdue invoices</a>
          </div>
        </aside>
      </div>

      {/* ADD PAYMENT MODAL */}
      {showAdd && (
        <div className="payment-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal__header">
              <h2 className="payment-modal__title">Add Payment</h2>
              <button className="payment-icon-btn" onClick={() => setShowAdd(false)}><Icon.X /></button>
            </div>

            <div className="payment-modal__body">
              {/* Customer & Invoice Details */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Customer & Invoice Details</h3>
                <div className="payment-modal__grid">
                  <Field label="Customer" required>
                    <select className="payment-input" value={form.customer} onChange={(e) => setFm("customer", e.target.value)}>
                      <option value="">Select customer</option>
                      {CUSTOMERS.filter((c) => c !== "All Customers").map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Invoice / Bill No." required>
                    <input className="payment-input" placeholder="e.g., INV-2025-186" value={form.invoiceNo} onChange={(e) => setFm("invoiceNo", e.target.value)} />
                  </Field>
                  <Field label="Invoice Date" required>
                    <input type="date" className="payment-input" value={form.invoiceDate} onChange={(e) => setFm("invoiceDate", e.target.value)} />
                  </Field>
                  <Field label="Total Invoice Amount">
                    <input className="payment-input" placeholder="₹ 25,000.00" value={form.totalInvoiceAmount} onChange={(e) => setFm("totalInvoiceAmount", e.target.value)} />
                  </Field>
                  <Field label="Outstanding Amount">
                    <input className="payment-input" placeholder="₹ 10,000.00" value={form.outstandingAmount} onChange={(e) => setFm("outstandingAmount", e.target.value)} />
                  </Field>
                  <Field label="Balance After Payment">
                    <input className="payment-input payment-input--readonly" readOnly value={`₹ ${balanceAfter.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
                  </Field>
                </div>
              </section>

              {/* Payment Information */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Payment Information</h3>
                <div className="payment-modal__grid">
                  <Field label="Payment Date" required>
                    <input type="date" className="payment-input" value={form.paymentDate} onChange={(e) => setFm("paymentDate", e.target.value)} />
                  </Field>
                  <Field label="Payment Mode" required>
                    <select className="payment-input" value={form.paymentMode} onChange={(e) => setFm("paymentMode", e.target.value)}>
                      <option>NEFT</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>RTGS</option>
                    </select>
                  </Field>
                  <Field label="Reference No. / Transaction ID" required>
                    <input className="payment-input" placeholder="UTR / Cheque / UPI Ref" value={form.refNo} onChange={(e) => setFm("refNo", e.target.value)} />
                  </Field>
                  <Field label="Amount Received" required hint={form.outstandingAmount ? `Maximum: ₹ ${Number(form.outstandingAmount).toLocaleString("en-IN")}` : null}>
                    <input className="payment-input" type="number" placeholder="0" value={form.amountReceived} onChange={(e) => setFm("amountReceived", e.target.value)} />
                  </Field>
                  <Field label="Remarks" full>
                    <textarea className="payment-input payment-input--textarea" rows="2" placeholder="Payment received via..." value={form.remarks} onChange={(e) => setFm("remarks", e.target.value)} />
                  </Field>
                </div>
              </section>

              {/* Upload Proof */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Upload Payment Proof (Optional)</h3>
                <div className="payment-file">
                  <label className="payment-btn payment-btn--ghost">
                    <span>Choose File</span>
                    <input type="file" hidden onChange={(e) => setFm("proofFileName", e.target.files?.[0]?.name || "")} />
                  </label>
                  <span className="payment-file__name">{form.proofFileName || "No file chosen"}</span>
                  {form.proofFileName && (
                    <button className="payment-icon-btn" onClick={() => setFm("proofFileName", "")}><Icon.X /></button>
                  )}
                </div>
                <div className="payment-muted payment-file__hint">JPG, PNG, PDF (Max. 5MB)</div>
              </section>

              {/* Additional */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Additional Information</h3>
                <div className="payment-modal__grid">
                  <Field label="Company" required>
                    <select className="payment-input" value={form.company} onChange={(e) => setFm("company", e.target.value)}>
                      {COMPANIES.filter((c) => c !== "All Companies").map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Received By" required>
                    <select className="payment-input" value={form.receivedBy} onChange={(e) => setFm("receivedBy", e.target.value)}>
                      <option>Admin User</option><option>Accountant</option><option>Manager</option>
                    </select>
                  </Field>
                </div>
              </section>
            </div>

            <div className="payment-modal__footer">
              <button className="payment-btn payment-btn--ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="payment-btn payment-btn--primary" onClick={handleSave}>Save Payment</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-page, .payment-page * { box-sizing: border-box; }
        .payment-page {
          --pm-text: #0f172a;
          --pm-muted: #64748b;
          --pm-label: #475569;
          --pm-card: #ffffff;
          --pm-border: #e5e7eb;
          --pm-primary: #2563eb;
          --pm-primary-hover: #1d4ed8;
          --pm-danger: #ef4444;
          --pm-success: #10b981;
          --pm-warning: #f59e0b;
          --pm-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--pm-text);
          font-size: 14px;
          line-height: 1.4;
        //   padding: 24px;
        }
        .payment-page svg { width: 16px; height: 16px; display: block; }

        /* HEADER */
        .payment-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .payment-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .payment-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--pm-muted); font-size: 13px; }
        .payment-breadcrumb__sep { color: #cbd5e1; }
        .payment-breadcrumb__current { color: var(--pm-primary); font-weight: 500; }
        .payment-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* BUTTONS */
        .payment-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .payment-btn--ghost { background: #fff; border-color: var(--pm-border); color: var(--pm-text); }
        .payment-btn--ghost:hover { background: #f8fafc; }
        .payment-btn--primary { background: var(--pm-primary); color: #fff; border-color: var(--pm-primary); }
        .payment-btn--primary:hover { background: var(--pm-primary-hover); }
        .payment-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 30px; height: 30px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--pm-muted);
        }
        .payment-icon-btn:hover { background: #f1f5f9; color: var(--pm-text); }

        /* LAYOUT */
        .payment-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: flex-start;
        }
        .payment-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .payment-side { display: flex; flex-direction: column; gap: 16px; }

        /* STAT CARDS */
        .payment-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .payment-stat {
          background: var(--pm-card);
          border: 1px solid var(--pm-border);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--pm-shadow);
          display: flex; gap: 12px; align-items: flex-start;
        }
        .payment-stat__icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .payment-stat__icon svg { width: 22px; height: 22px; }
        .payment-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .payment-stat__icon--green  { background: #d1fae5; color: #10b981; }
        .payment-stat__icon--orange { background: #ffedd5; color: #ea580c; }
        .payment-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .payment-stat__body { min-width: 0; flex: 1; }
        .payment-stat__label { font-size: 12px; color: var(--pm-muted); margin-bottom: 4px; }
        .payment-stat__value { font-size: 16px; font-weight: 700; }
        .payment-stat__change { font-size: 12px; margin-top: 4px; font-weight: 500; }
        .payment-stat__change.is-up { color: var(--pm-success); }
        .payment-stat__change.is-down { color: var(--pm-danger); }
        .payment-stat__since { color: var(--pm-muted); font-weight: 400; }
        .payment-stat__link { font-size: 12px; color: var(--pm-primary); text-decoration: none; }
        .payment-stat__link:hover { text-decoration: underline; }

        /* CARD */
        .payment-card {
          background: var(--pm-card);
          border: 1px solid var(--pm-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--pm-shadow);
        }
        .payment-card__title { font-size: 15px; font-weight: 600; margin: 0 0 14px 0; }

        /* FILTERS */
        .payment-filters__row {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        .payment-filters__row:last-child { margin-bottom: 0; }
        .payment-filters__actions {
          display: flex; gap: 8px; align-items: flex-end;
        }
        .payment-filters__actions .payment-btn { padding: 9px 14px; }

        /* FIELDS */
        .payment-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .payment-field--full { grid-column: 1 / -1; }
        .payment-field__label {
          font-size: 12px; font-weight: 500; color: var(--pm-label);
          display: flex; align-items: center; gap: 6px;
        }
        .payment-field__required { color: var(--pm-danger); }
        .payment-field__hint { font-size: 11px; color: var(--pm-primary); font-weight: 400; margin-top: 2px; }

        .payment-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--pm-border);
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          color: var(--pm-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .payment-input:focus {
          outline: none;
          border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .payment-input::placeholder { color: #94a3b8; }
        .payment-input--readonly { background: #f8fafc; color: var(--pm-muted); }
        .payment-input--textarea { resize: vertical; min-height: 60px; }
        .payment-input--xs { width: auto; padding: 4px 10px; font-size: 12px; }
        .payment-input--with-left-icon { padding-left: 36px; }
        .payment-input-wrap { position: relative; }
        .payment-input-wrap .payment-input:not(.payment-input--with-left-icon) { padding-right: 34px; }
        .payment-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--pm-muted); pointer-events: none;
        }
        .payment-input__icon--left { left: 10px; right: auto; }

        /* TABLE HEADER */
        .payment-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .payment-table-head__right { display: flex; align-items: center; gap: 10px; }
        .payment-muted { color: var(--pm-muted); font-size: 13px; }

        /* TABLE */
        .payment-table-wrap { overflow-x: auto; }
        .payment-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .payment-table th {
          background: #f8fafc;
          padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--pm-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .payment-th--right { text-align: right; }
        .payment-th--center { text-align: center; }
        .payment-table td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .payment-tr:hover { background: #fafbfc; }
        .payment-tr:last-child td { border-bottom: none; }
        .payment-td--right { text-align: right; }
        .payment-td--center { text-align: center; }
        .payment-td--link { color: var(--pm-primary); font-weight: 500; }
        .payment-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
        .payment-balance-due { color: var(--pm-danger); font-weight: 600; }
        .payment-balance-zero { color: var(--pm-success); font-weight: 600; }

        /* MODE PILLS */
        .payment-mode {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .payment-mode--neft   { background: #dbeafe; color: #1d4ed8; }
        .payment-mode--cash   { background: #d1fae5; color: #047857; }
        .payment-mode--upi    { background: #f3e8ff; color: #7e22ce; }
        .payment-mode--cheque { background: #fef3c7; color: #b45309; }
        .payment-mode--rtgs   { background: #ffe4e6; color: #be123c; }

        /* STATUS BADGE */
        .payment-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .payment-badge--paid    { background: #d1fae5; color: #047857; }
        .payment-badge--partial { background: #ffedd5; color: #c2410c; }
        .payment-badge--pending { background: #fef3c7; color: #b45309; }

        /* PAGINATION */
        .payment-pagination {
          padding-top: 14px;
          display: flex; align-items: center; gap: 6px; justify-content: center;
          flex-wrap: wrap;
        }
        .payment-page-btn {
          min-width: 34px;
          padding: 6px 12px;
          border: 1px solid var(--pm-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--pm-text);
          font-family: inherit;
        }
        .payment-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .payment-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .payment-page-btn--active { background: var(--pm-primary); color: #fff; border-color: var(--pm-primary); }

        /* OVERVIEW LIST */
        .payment-overview { display: flex; flex-direction: column; gap: 10px; }
        .payment-overview__row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px;
        }
        .payment-overview__label { color: var(--pm-label); }
        .payment-overview__val { font-weight: 600; }
        .payment-overview__val--green { color: var(--pm-success); }
        .payment-overview__val--orange { color: #ea580c; }
        .payment-overview__val--red { color: var(--pm-danger); }

        /* DONUT */
        .payment-donut { display: flex; justify-content: center; padding: 8px 0 14px; }
        .payment-donut svg { width: 170px; height: 170px; }
        .payment-legend { display: flex; flex-direction: column; gap: 8px; }
        .payment-legend__row {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px;
        }
        .payment-legend__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .payment-legend__name { flex: 1; color: var(--pm-text); }
        .payment-legend__pct { font-weight: 600; color: var(--pm-text); }

        /* TOP CUSTOMERS LIST */
        .payment-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .payment-list__row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px;
        }
        .payment-list__name { color: var(--pm-text); }
        .payment-list__val { font-weight: 600; color: var(--pm-text); }
        .payment-link {
          display: inline-block;
          color: var(--pm-primary);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }
        .payment-link:hover { text-decoration: underline; }

        /* OVERDUE LIST */
        .payment-overdue { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .payment-overdue__row {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px;
        }
        .payment-overdue__inv { font-size: 12px; color: var(--pm-primary); font-weight: 600; }
        .payment-overdue__cust { font-size: 13px; color: var(--pm-text); margin-top: 2px; }
        .payment-overdue__right { text-align: right; }
        .payment-overdue__amt { font-size: 13px; color: var(--pm-danger); font-weight: 600; }
        .payment-overdue__days { font-size: 11px; color: var(--pm-warning); margin-top: 2px; font-weight: 500; }

        /* MODAL */
        .payment-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: pmFade 0.18s ease;
        }
        @keyframes pmFade { from { opacity: 0; } to { opacity: 1; } }
        .payment-modal {
          background: #fff;
          width: 100%; max-width: 720px;
          max-height: 90vh;
          border-radius: 14px;
          display: flex; flex-direction: column;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          animation: pmSlide 0.2s ease;
        }
        @keyframes pmSlide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .payment-modal__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--pm-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .payment-modal__title { font-size: 18px; font-weight: 600; margin: 0; }
        .payment-modal__body { flex: 1; overflow-y: auto; padding: 20px; }
        .payment-modal__footer {
          padding: 14px 20px;
          border-top: 1px solid var(--pm-border);
          display: flex; gap: 10px; justify-content: flex-end;
          flex-shrink: 0;
        }
        .payment-modal__section { margin-bottom: 20px; }
        .payment-modal__section:last-child { margin-bottom: 0; }
        .payment-modal__section-title {
          font-size: 14px; font-weight: 600;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--pm-border);
        }
        .payment-modal__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        /* FILE UPLOAD */
        .payment-file {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 6px;
        }
        .payment-file__name { font-size: 13px; color: var(--pm-text); flex: 1; }
        .payment-file__hint { font-size: 11px; }

        /* RESPONSIVE */
        @media (max-width: 1300px) {
          .payment-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1100px) {
          .payment-layout { grid-template-columns: 1fr; }
          .payment-filters__row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .payment-modal__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .payment-page { padding: 16px; }
          .payment-page__title { font-size: 20px; }
          .payment-stats { grid-template-columns: 1fr; }
          .payment-filters__row { grid-template-columns: 1fr; }
          .payment-filters__actions { grid-column: 1 / -1; }
          .payment-modal__grid { grid-template-columns: 1fr; }
          .payment-page__actions { width: 100%; }
          .payment-page__actions .payment-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

/* ================================================================
   HELPER COMPONENTS
   ================================================================ */
function Field({ label, required, hint, full, children }) {
  return (
    <div className={`payment-field ${full ? "payment-field--full" : ""}`}>
      <label className="payment-field__label">
        {label}
        {required && <span className="payment-field__required">*</span>}
      </label>
      {children}
      {hint && <div className="payment-field__hint">{hint}</div>}
    </div>
  );
}

function DonutChart({ segments, centerTop, centerBottom }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="payment-donut">
      <svg viewBox="0 0 200 200">
        {/* Background ring */}
        <circle cx="100" cy="100" r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {/* Segments */}
        <g transform="rotate(-90 100 100)">
          {segments.map((s, i) => {
            const len = (s.percent / 100) * c;
            const offset = (cumulative / 100) * c;
            cumulative += s.percent;
            return (
              <circle
                key={i}
                cx="100" cy="100" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={`${len} ${c}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
        <text x="100" y="92" textAnchor="middle" fontSize="10" fill="#64748b">{centerTop}</text>
        <text x="100" y="115" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">{centerBottom}</text>
      </svg>
    </div>
  );
}