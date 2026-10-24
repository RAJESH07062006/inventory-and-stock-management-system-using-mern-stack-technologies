import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "Enter your admin email and password." });
    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign(
      { role: "admin", email: admin.email },
      process.env.JWT_SECRET || "local_development_secret_change_this_before_deployment",
      { subject: String(admin._id), expiresIn: "8h" }
    );
    res.json({ token, admin: { email: admin.email, role: "admin" } });
  } catch (error) { next(error); }
});

export default router;
