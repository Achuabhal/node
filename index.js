const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // 🔹 import cors
const cookieParser = require("cookie-parser");


dotenv.config();

const app = express();
app.use(express.json());

// 🔹 Enable CORS for all routes
app.use(cors({
  credentials: true
}));
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
