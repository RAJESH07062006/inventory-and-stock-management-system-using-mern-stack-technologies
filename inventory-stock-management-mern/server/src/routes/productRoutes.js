import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const router = Router();

function validId(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/summary", async (_req, res, next) => {
  try {
    const products = await Product.find().lean();
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    res.json({ totalProducts, totalUnits, inventoryValue, lowStock, outOfStock });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "", status = "" } = req.query;
    const filter = {};
    if (category && category !== "All categories") filter.category = category;
    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { sku: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } }
      ];
    }
    let products = await Product.find(filter).sort({ updatedAt: -1 }).lean();
    if (status === "Low stock") products = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel);
    if (status === "Out of stock") products = products.filter(p => p.quantity === 0);
    if (status === "In stock") products = products.filter(p => p.quantity > p.reorderLevel);
    res.json(products);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID." });
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (error) { next(error); }
});

router.patch("/:id/stock", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID." });
    const { action, amount } = req.body;
    const qty = Number(amount);
    if (!["in", "out"].includes(action) || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: "Choose stock in/out and enter a positive whole-number quantity." });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (action === "out" && qty > product.quantity) {
      return res.status(400).json({ message: `Only ${product.quantity} units are available.` });
    }
    product.quantity += action === "in" ? qty : -qty;
    await product.save();
    res.json(product);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID." });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted successfully." });
  } catch (error) { next(error); }
});

export default router;