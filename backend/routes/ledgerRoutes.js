const express = require("express");
const router = express.Router();

const Sales = require("../models/tempSales");
const Payment = require("../models/Payment");


// 🔥 GET LEDGER (Customer + Company + Date Filter)
router.get("/", async (req, res) => {
  try {

    const { customer, company, fromDate, toDate } = req.query;

    if (!customer) {
      return res.status(400).json({
        message: "Customer is required"
      });
    }

    // 🔥 Build filters
    let salesFilter = { customer };
    let paymentFilter = { customer };

    if (company) {
      salesFilter.company = company;
      paymentFilter.company = company;
    }

    if (fromDate && toDate) {
      salesFilter.salesDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };

      paymentFilter.paymentDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // 🔥 1. Get Sales
    const sales = await Sales.find(salesFilter)
      .select("salesDate invoiceNo sellingAmount")
      .lean();

    // 🔥 2. Get Payments
    const payments = await Payment.find(paymentFilter)
      .select("paymentDate amountReceived paymentMode")
      .populate("paymentMode", "name")
      .lean();

    // 🔥 3. Merge Data
    let ledger = [];

    // Sales → Debit (+)
    sales.forEach(sale => {
      ledger.push({
        date: sale.salesDate,
        type: "SALE",
        reference: sale.invoiceNo,
        debit: sale.sellingAmount,
        credit: 0
      });
    });

    // Payments → Credit (-)
    payments.forEach(payment => {
      ledger.push({
        date: payment.paymentDate,
        type: "PAYMENT",
        reference: payment.paymentMode?.name || "",
        debit: 0,
        credit: payment.amountReceived
      });
    });

    // 🔥 4. Sort by Date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 🔥 5. Running Balance
    let balance = 0;

    const finalLedger = ledger.map(entry => {
      balance += entry.debit;
      balance -= entry.credit;

      return {
        ...entry,
        balance
      };
    });

    res.status(200).json({
      customer,
      company: company || null,
      fromDate,
      toDate,
      ledger: finalLedger,
      finalBalance: balance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error generating ledger",
      error: error.message
    });
  }
});

module.exports = router;