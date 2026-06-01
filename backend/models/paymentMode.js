const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  paymentDate: {
    type: Date,
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  paymentMode: {
    type: String,
    enum: ["Cash", "Bank", "UPI", "Other"],
    required: true
  },

  referenceNo: String,

  // 🔗 Link with Sales (Invoice)
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sales",
    required: true
  },

  baleNos: [String], // multiple bale reference

  totalInvoiceAmount: Number,

  amountReceived: {
    type: Number,
    required: true
  },

  outstandingAmount: Number,

  balanceAmount: Number,

  paymentId: {
    type: String,
    unique: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesPerson" // or User later
  },

  remarks: String,

  invoicePdf: String // optional future

}, { timestamps: true });


// 🔥 AUTO CALCULATION
paymentSchema.pre("save", function () {

  // Outstanding = total invoice - received
  this.outstandingAmount = this.totalInvoiceAmount - this.amountReceived;

  // Balance = same logic (for now)
  this.balanceAmount = this.outstandingAmount;

});

module.exports = mongoose.model("Payment", paymentSchema);