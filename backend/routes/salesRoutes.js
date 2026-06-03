const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const PDFDocument = require("pdfkit");

router.post("/add", async (req, res) => {
  try {

    const {
      inventory: inventoryId,
      pcsSold
    } = req.body;

    // 🔥 1. Get inventory
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // 🔥 2. Calculate qty
    const qtyToSell = inventory.onePcsQty * pcsSold;

    // 🔥 3. Check stock (VERY IMPORTANT)
    if (inventory.balanceQty < qtyToSell) {
      return res.status(400).json({
        message: "Not enough stock available"
      });
    }

    // 🔥 4. Create sales entry
    const newSale = new Sales({
      ...req.body,

      baleNo: inventory.baleNo,

      fabric: inventory.fabric,
      fabricQuality: inventory.fabricQuality,
      design: inventory.design,
      color: inventory.color,
      container: inventory.container,

      uom: inventory.uom,

      onePcsQty: inventory.onePcsQty,

      inwardRate: inventory.rate
    });

    const savedSale = await newSale.save();

    // 🔥 5. UPDATE INVENTORY (CORE LOGIC)
    inventory.saleQty += qtyToSell;
    inventory.balanceQty -= qtyToSell;

    await inventory.save();

    res.status(201).json({
      message: "Sale created & inventory updated",
      data: savedSale
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating sale",
      error: error.message
    });
  }
});

// ✅ GET ALL SALES
router.get("/", async (req, res) => {
  try {
    const data = await Sales.find()
      .populate("customer", "name")
      .populate("inventory")
      .populate("company", "name")
      .populate("salesPerson", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching sales",
      error: error.message
    });
  }
});

// get single sale
router.get("/:id", async (req, res) => {
  try {
    const data = await Sales.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching sale",
      error: error.message
    });
  }
});

// ✅ DELETE SALE (and restore inventory)

router.delete("/:id", async (req, res) => {
  try {

    const sale = await Sales.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const inventory = await Inventory.findById(sale.inventory);

    // 🔥 Restore inventory
    if (inventory) {
      inventory.saleQty -= sale.qty;
      inventory.balanceQty += sale.qty;

      await inventory.save();
    }

    await Sales.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Sale deleted & inventory restored"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting sale",
      error: error.message
    });
  }
});

// ✅ UPDATE SALE (and adjust inventory accordingly).


router.get("/invoice/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate("customer", "name")
      .populate("company", "name");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${sale.invoiceNo}.pdf`
    );

    doc.pipe(res);

    // 🔥 HEADER
    doc.fontSize(20).text("INVOICE", { align: "center" });

    doc.moveDown();

    doc.fontSize(12).text(`Invoice No: ${sale.invoiceNo}`);
    doc.text(`Date: ${new Date(sale.salesDate).toDateString()}`);
    doc.text(`Customer: ${sale.customer?.name || ""}`);
    doc.text(`Company: ${sale.company?.name || ""}`);

    doc.moveDown();

    // 🔥 SALE DETAILS
    doc.text(`Bale No: ${sale.baleNo}`);
    doc.text(`PCS Sold: ${sale.pcsSold}`);
    doc.text(`Qty: ${sale.qty}`);

    doc.moveDown();

    // 🔥 PRICE
    doc.text(`Rate: ${sale.sellingRate}`);
    doc.text(`Total Amount: ${sale.sellingAmount}`);

    doc.moveDown();
    doc.text("Thank you for your business!", { align: "center" });

    doc.end();

  } catch (error) {
    res.status(500).json({
      message: "Error generating invoice",
      error: error.message
    });
  }
});



module.exports = router;





