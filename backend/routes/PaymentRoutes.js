const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Sales = require("../models/Sales");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   HELPER: Sale ke paid/balance/status refresh karna
   Har payment create/update/delete ke baad chalega
   ────────────────────────────────────────────── */
async function refreshSalePaymentStatus(saleId) {
  if (!saleId) return;

  const sale = await Sales.findById(saleId);
  if (!sale) return;

  // Saare payments ka sum nikaalo for this sale
  const result = await Payment.aggregate([
    { $match: { sale: sale._id } },
    { $group: { _id: null, total: { $sum: "$amountReceived" } } },
  ]);
  const paid = result[0]?.total || 0;

  sale.paidAmount = +paid.toFixed(2);
  sale.balanceDue = +Math.max(sale.netAmount - paid, 0).toFixed(2);
  sale.paymentStatus =
    paid === 0 ? "Unpaid" :
    paid >= sale.netAmount ? "Paid" :
    "Partial";

  await sale.save();
}

/* ──────────────────────────────────────────────
   1. CREATE PAYMENT
   ────────────────────────────────────────────── */
router.post("/add", async (req, res) => {
  try {
    const isAdvance = !!req.body.isAdvance;

    // 🆕 ADVANCE PAYMENT branch — sale not required
    if (isAdvance) {
      if (!req.body.customer) {
        return res.status(400).json({ message: "Customer required for advance payment" });
      }
      // Sale field hata do (agar accidentally aaya ho)
      delete req.body.sale;

      const payment = await Payment.create(req.body);
      return res.status(201).json({
        message: "Advance payment recorded successfully",
        data: payment,
      });
    }

    // REGULAR PAYMENT — sale required
    if (!req.body.sale) {
      return res.status(400).json({ message: "Sale required for normal payment" });
    }
    const sale = await Sales.findById(req.body.sale);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Payment create — pre-save hook chalega
    const payment = await Payment.create(req.body);

    // Sale ka paidAmount/balanceDue/paymentStatus refresh
    await refreshSalePaymentStatus(payment.sale);

    res.status(201).json({
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (err) {
    console.error("🔴 Payment create error:", err.message);
    res.status(500).json({
      message: "Error adding payment",
      error: err.message,
    });
  }
});

/* ──────────────────────────────────────────────
   2. LIST PAYMENTS — with optional filters
   ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.sale) filter.sale = req.query.sale;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isAdvance === "true")  filter.isAdvance = true;     // 🆕
    if (req.query.isAdvance === "false") filter.isAdvance = { $ne: true };  // 🆕

    // Date range
    if (req.query.fromDate || req.query.toDate) {
      filter.paymentDate = {};
      if (req.query.fromDate) filter.paymentDate.$gte = new Date(req.query.fromDate);
      if (req.query.toDate)   filter.paymentDate.$lte = new Date(req.query.toDate);
    }

    const data = await Payment.find(filter)
      .populate("customer", "name code")
      .populate("paymentMode", "name")
      .populate("company", "name")
      .populate("receivedBy", "name")
      .populate("sale", "invoiceNo netAmount paymentStatus")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching payments",
      error: err.message,
    });
  }
});

/* ──────────────────────────────────────────────
   3. STATS — for dashboard cards
   ────────────────────────────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalReceivedAgg, monthAgg, salesAgg] = await Promise.all([
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amountReceived" } } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amountReceived" } } },
      ]),
      Sales.aggregate([
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: "$netAmount" },
            totalOutstanding: { $sum: "$balanceDue" },
          },
        },
      ]),
    ]);

    res.json({
      totalReceived:      totalReceivedAgg[0]?.total || 0,
      monthCollection:    monthAgg[0]?.total || 0,
      totalInvoices:      salesAgg[0]?.totalInvoices || 0,
      totalOutstanding:   salesAgg[0]?.totalOutstanding || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. GET SINGLE PAYMENT
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Payment.findById(req.params.id)
      .populate("customer", "name code phone email gstNo")
      .populate("paymentMode", "name")
      .populate("company", "name")
      .populate("receivedBy", "name")
      .populate("sale", "invoiceNo saleDate netAmount paidAmount balanceDue paymentStatus");

    if (!data) return res.status(404).json({ message: "Payment not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching payment",
      error: err.message,
    });
  }
});

/* ──────────────────────────────────────────────
   5. UPDATE PAYMENT
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const old = await Payment.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Payment not found" });

    const oldSaleId = old.sale;          // could be undefined (advance)

    Object.assign(old, req.body);
    const updated = await old.save();

    // 🔧 Safe handling — sale change ho ya na ho, both cases handle
    // Refresh OLD sale (agar tha to)
    if (oldSaleId) {
      const oldStr = oldSaleId.toString();
      const newStr = updated.sale ? updated.sale.toString() : null;
      if (oldStr !== newStr) {
        await refreshSalePaymentStatus(oldSaleId);
      }
    }
    // Refresh NEW sale (agar hai to)
    if (updated.sale) {
      await refreshSalePaymentStatus(updated.sale);
    }

    res.json({ message: "Payment updated", data: updated });
  } catch (err) {
    console.error("🔴 Payment update error:", err.message);
    res.status(500).json({
      message: "Error updating payment",
      error: err.message,
    });
  }
});

/* ──────────────────────────────────────────────
   6. DELETE PAYMENT
   ────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const saleId = payment.sale;
    await payment.deleteOne();

    // Sale status refresh — payment hatne ke baad
    await refreshSalePaymentStatus(saleId);

    res.json({ message: "Payment deleted, sale status updated" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting payment",
      error: err.message,
    });
  }
});

module.exports = router;