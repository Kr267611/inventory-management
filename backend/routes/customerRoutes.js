const express = require("express");
const router = express.Router();
const customer = require("../models/Customer");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// List
router.get("/", async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const data = await customer.find(filter).sort({ name: 1 });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get one
router.get("/:id", async (req, res) => {
  try {
    const data = await customer.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create
router.post("/add", async (req, res) => {
  try {
    const created = await customer.create(req.body);
    res.status(201).json({ message: "Customer created", data: created });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const updated = await customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Customer updated", data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Soft delete (isActive=false) — recommended over hard delete
router.delete("/:id", async (req, res) => {
  try {
    const data = await customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Customer deactivated", data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;    