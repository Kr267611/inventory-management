const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");

router.post("/add", async (req, res) => {
  try {
    const data = await Supplier.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const data = await Supplier.find();
  res.json(data);
});

// update api.

router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedData) {
      return res.status(404).json({ error: "Supplier not found" });
    } else {
      res.json(updatedData);
    } 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }   
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await Supplier.findByIdAndDelete(id);
    if (!deletedData) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;