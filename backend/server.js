const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Fabric,Fabric Quality,UOM,Location,Supplier,color,Design routes
const fabricRoutes = require("./routes/fabricRoutes");
const fabricQualityRoutes = require("./routes/fabricQualityRoutes");
const uomRoutes = require("./routes/uomRoutes");
const locationRoutes = require("./routes/locationRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const colorRoutes = require("./routes/colorRoutes");
const designRoutes = require("./routes/designRoutes");
const containerRoutes = require("./routes/containerRoutes");



app.use("/api/fabrics", fabricRoutes);
app.use("/api/quality", fabricQualityRoutes);
app.use("/api/uoms", uomRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/containers", containerRoutes);

// Inward routes
const inwardRoutes = require("./routes/inwardRoutes");
app.use("/api/inward", inwardRoutes);

// Inventory routes
const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/inventory", inventoryRoutes);

// sales routes
const salesRoutes = require("./routes/salesRoutes");
app.use("/api/sales", salesRoutes);

// company details route.
const companyRoutes = require("./routes/companyRoutes");
app.use("/api/company", companyRoutes);

// payment routes
const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

// ledger routes
const ledgerRoutes = require("./routes/ledgerRoutes");
app.use("/api/ledger", ledgerRoutes);

// auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 