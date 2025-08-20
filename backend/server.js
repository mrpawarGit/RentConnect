require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const { authenticate, requireRole } = require("./middleware/authMiddleware");

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/properties", require("./routes/property"));

// Protected test route
app.get(
  "/api/protected",
  authenticate,
  requireRole(["tenant", "landlord"]),
  (req, res) => {
    res.json({ message: `Welcome! Your user role is ${req.user.role}` });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
