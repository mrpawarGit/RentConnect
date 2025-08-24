// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const { authenticate, requireRole } = require("./middleware/authMiddleware");

const app = express();

/* ------------------------- DB CONNECTION ------------------------- */
connectDB();

/* --------------------------- MIDDLEWARE -------------------------- */
// Allow your frontend dev server to connect (Vite default: 5173)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files (maintenance request images/videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ----------------------------- ROUTES ---------------------------- */
// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Property routes (landlord only)
app.use("/api/properties", require("./routes/property"));

// Dashboard routes (tenant + landlord)
app.use("/api", require("./routes/dashboard"));

// Maintenance routes
app.use("/api/maintenance", require("./routes/maintenance"));

/* ----------------------- PROTECTED TEST ROUTE -------------------- */
app.get(
  "/api/protected",
  authenticate,
  requireRole(["tenant", "landlord"]),
  (req, res) => {
    res.json({ message: `Welcome! Your user role is ${req.user.role}` });
  }
);

/* ----------------------------- SERVER ---------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 CORS Origin allowed: ${CLIENT_URL}`);
});
