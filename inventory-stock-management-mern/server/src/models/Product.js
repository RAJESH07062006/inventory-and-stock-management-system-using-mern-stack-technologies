import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: 120 },
  sku: { type: String, required: [true, "SKU is required"], trim: true, uppercase: true, unique: true, maxlength: 40 },
  category: { type: String, required: [true, "Category is required"], trim: true, maxlength: 80 },
  supplier: { type: String, trim: true, default: "", maxlength: 120 },
  price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
  quantity: { type: Number, required: true, min: [0, "Quantity cannot be negative"], validate: Number.isInteger },
  reorderLevel: { type: Number, default: 5, min: 0, validate: Number.isInteger }
}, { timestamps: true });

productSchema.index({ name: "text", sku: "text", category: "text" });

export default mongoose.model("Product", productSchema);