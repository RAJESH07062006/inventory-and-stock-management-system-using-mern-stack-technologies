import jwt from "jsonwebtoken";

export default function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in as admin to continue." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "local_development_secret_change_this_before_deployment");
    if (payload.role !== "admin") return res.status(403).json({ message: "Admin access required." });
    req.admin = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}
