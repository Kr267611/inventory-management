const express = require("express");
const router = express.Router();
const PaymentMode = require("../models/paymentMode");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// List with optional activeOnly filter
router.get("/", async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const data = await PaymentMode.find(filter)
      .populate("company", "name")
      .sort({ name: 1 });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get one
router.get("/:id", async (req, res) => {
  try {
    const data = await PaymentMode.findById(req.params.id).populate("company", "name");
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create
router.post("/add", async (req, res) => {
  try {
    const created = await PaymentMode.create(req.body);
    res.status(201).json({ message: "Payment Mode created", data: created });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const updated = await PaymentMode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Payment Mode updated", data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Soft delete
router.delete("/:id", async (req, res) => {
  try {
    const data = await PaymentMode.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Payment Mode deactivated", data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;