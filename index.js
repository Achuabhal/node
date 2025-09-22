const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // 🔹 import cors
const cookieParser = require("cookie-parser");


dotenv.config();

const app = express();
app.use(express.json());

// 🔹 Enable permissive CORS in development: echo request origin and allow credentials
app.use(cors({
  origin: true, // echo the request origin instead of '*'
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
}));

// Note: Preflight will be handled by the CORS middleware above

// Basic healthcheck route to verify server is running
app.get("/health", (req, res) => res.json({ ok: true }));

// Prevent crashes on unexpected errors (log and continue)
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
app.use(cookieParser()); // 🔹 parse cookies


// MongoDB connection
mongoose.connect(process.env.MONGO_URI) // no extra options needed
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
const authRoutes = require("./routes/auth");
const addRoutes = require("./routes/add");
const contentRoutes = require("./routes/content");
app.use("/api", addRoutes);
app.use("/", authRoutes);
app.use("/content", contentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
