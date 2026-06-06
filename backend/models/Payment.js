const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentDate: { type: Date, required: true, default: Date.now },

  paymentId: { type: String, unique: true },                // auto-generated below

  // 🔗 Links
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sales",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  paymentMode: {
    type: mongoose.Schema.Types.ObjectId,                   // 👈 master ref, not enum
    ref: "PaymentMode",
    required: true,
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesPerson",
  },

  // 💰 Amounts
  totalInvoiceAmount: { type: Number, default: 0 },         // auto-filled from Sale
  amountReceived:     { type: Number, required: true, min: 0 },
  outstandingBefore:  { type: Number, default: 0 },         // before this payment
  outstandingAfter:   { type: Number, default: 0 },         // after this payment

  // 📋 Reference info
  referenceNo: { type: String, trim: true },                // UTR / Cheque No / UPI Ref
  remarks:     { type: String, trim: true },
  invoicePdf:  { type: String },                            // future use

  // 🚦 Status
  status: {
    type: String,
    enum: ["Partial", "Full", "Advance"],
    default: "Partial",
  },
}, { timestamps: true });


/* ──────── AUTO PAYMENT ID ──────── */
paymentSchema.pre("validate", async function (next) {
  if (this.paymentId) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model("Payment").countDocuments({
    paymentId: new RegExp(`^PAY-${year}-`),
  });
  this.paymentId = `PAY-${year}-${String(count + 1).padStart(4, "0")}`;
  next();
});


/* ──────── AUTO CALCULATIONS ──────── */
paymentSchema.pre("save", async function (next) {
  try {
    const Sale = mongoose.model("Sales");

    // 1. Sale fetch karke totalInvoiceAmount auto-fill
    const sale = await Sale.findById(this.sale).select("netAmount");
    if (!sale) return next(new Error("Linked sale not found"));
    this.totalInvoiceAmount = sale.netAmount || 0;

    // 2. Sum of previous payments for this sale (excluding self if edit)
    const Payment = mongoose.model("Payment");
    const prevPayments = await Payment.aggregate([
      {
        $match: {
          sale: this.sale,
          _id: { $ne: this._id },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountReceived" } } },
    ]);
    const alreadyPaid = prevPayments[0]?.total || 0;

    // 3. Outstanding calculations
    this.outstandingBefore = this.totalInvoiceAmount - alreadyPaid;
    this.outstandingAfter  = this.outstandingBefore - this.amountReceived;

    // 4. Status decide
    if (this.outstandingAfter < 0) {
      // Overpaid — advance/credit
      this.status = "Advance";
    } else if (this.outstandingAfter === 0) {
      this.status = "Full";
    } else {
      this.status = "Partial";
    }

    // 5. Safety check — over-payment block (optional, can warn instead)
    if (this.amountReceived > this.outstandingBefore + 0.01) {
      return next(new Error(
        `Payment exceeds outstanding. Outstanding: ${this.outstandingBefore.toFixed(2)}, ` +
        `Received: ${this.amountReceived.toFixed(2)}`
      ));
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Payment", paymentSchema);