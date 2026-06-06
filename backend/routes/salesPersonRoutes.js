const express = require("express");
const router = express.Router();
const SalesPerson = require("../models/SalesPerson");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// List
router.get("/", async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const data = await SalesPerson.find(filter).sort({ name: 1 });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get one
router.get("/:id", async (req, res) => {
  try {
    const data = await SalesPerson.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create
router.post("/add", async (req, res) => {
  try {
    const created = await SalesPerson.create(req.body);
    res.status(201).json({ message: "SalesPerson created", data: created });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const updated = await SalesPerson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "SalesPerson updated", data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Soft delete (isActive=false) — recommended over hard delete
router.delete("/:id", async (req, res) => {
  try {
    const data = await SalesPerson.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ message: "SalesPerson deactivated", data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;