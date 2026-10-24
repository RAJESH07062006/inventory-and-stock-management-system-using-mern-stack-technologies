import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./src/routes/productRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import requireAdmin from "./src/middleware/requireAdmin.js";
import Admin from "./src/models/Admin.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Inventory Stock Management API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", requireAdmin, productRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(", ") });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "A product with this SKU already exists." });
  }
  res.status(500).json({ message: "Internal server error." });
});

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/inventory_stock_db")
  .then(async () => {
    console.log("MongoDB connected");
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@stockwise.local").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await Admin.create({ email: adminEmail, passwordHash });
      console.log(`Initial admin account created for ${adminEmail}`);
      if (!process.env.ADMIN_PASSWORD) console.warn("Using the development admin password. Set ADMIN_PASSWORD in server/.env before using this beyond local testing.");
    }
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    console.error("Check that MongoDB is running and server/.env has the correct MONGODB_URI.");
    process.exit(1);
  });