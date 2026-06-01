const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Sales = require("../models/Sales");

router.post("/add", async (req, res) => {
  try {

    const sale = await Sales.findById(req.body.sale);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const newPayment = new Payment({
      ...req.body,

      baleNos: [sale.baleNo],
      totalInvoiceAmount: sale.sellingAmount
    });

    const saved = await newPayment.save();

    res.status(201).json({
      message: "Payment added",
      data: saved
    });

  } catch (error) {
    res.status(500).json({
      message: "Error adding payment",
      error: error.message
    });
  }
});

// get all payments
router.get("/", async (req, res) => {
  try {
    const data = await Payment.find()
      .populate("customer", "name")
      .populate("paymentMode", "name")
      .populate("company", "name")
      .populate("sale")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message
    });
  }
});

// get single payment.

router.get("/:id", async (req, res) => {
  try {
    const data = await Payment.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching payment",
      error: error.message
    });
  }
});

// delete payment

router.delete("/:id", async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Payment deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting payment",
      error: error.message
    });
  }
});


module.exports = router;