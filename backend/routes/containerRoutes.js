const express = require("express");
const router = express.Router();
const Container = require("../models/Container");


// ✅ 1. ADD CONTAINER
router.post("/add", async (req, res) => {
  try {
    const data = new Container(req.body);
    const saved = await data.save();

    res.status(201).json({
      message: "Container Added",
      data: saved
    });

  } catch (error) {
    res.status(500).json({
      message: "Error adding container",
      error: error.message
    });
  }
});


// ✅ 2. GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await Container.find()
      .populate("company", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching containers",
      error: error.message
    });
  }
});


// ✅ 3. GET SINGLE
router.get("/:id", async (req, res) => {
  try {
    const data = await Container.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Container not found" });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching container",
      error: error.message
    });
  }
});


// ✅ 4. UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Container.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Container Updated",
      data: updated
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating container",
      error: error.message
    });
  }
});


// ✅ 5. DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Container.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Container Deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting container",
      error: error.message
    });
  }
});

module.exports = router;