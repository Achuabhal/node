const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOtp, sendEmail } = require("../controler/mailer");
const veryfyToken = require("../controler/jwt");
const Otpp = require("../models/otp2");
const authMiddleware = require("../controler/Auth"); // import middleware



router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { email: email2 } = req.body;
    const email = req.user.email; // 🔹 get email from JWT
    console.log("jwt:", email, "by user:", email2);

    const user = await User.findOne({ email }); // query DB using that email
    if (!user) {
      console.log("User not found in DB for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated OTP:", otp);

    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Save OTP to MongoDB
    try {
      await Otpp.create({ email2, otp, expireAt });
    } catch (dbErr) {
      console.error("Error saving OTP to DB:", dbErr);
      return res.status(500).json({ message: "Failed to save OTP" });
    }

    // Send OTP via email
    const sent = await sendOtp(email, otp); // 🔹 send to email, not email2
    if (sent) {
      res.json({ message: "OTP sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/verify-otp2",authMiddleware, async (req, res) => {
  console.log("Received /verify-otp2 request with body:", req.body);

  const { email, otp } = req.body;
  if (!email || !otp ) {
    console.log("Missing email or OTP");
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const numericOtp = Number(otp);
  console.log("Numeric OTP:", numericOtp);

  const record = await Otpp.findOne({ email2: email.trim().toLowerCase(), otp: numericOtp });
  console.log("OTP Record from DB:", record);

  if (!record) {
    console.log("No matching OTP record found");
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (record.expireAt < new Date()) {
    console.log("OTP expired at:", record.expireAt, "Current time:", new Date());
    return res.status(400).json({ message: "OTP expired" });
  }

  console.log("Deleting OTP record:", record._id);
  await Otpp.deleteOne({ _id: record._id });

  // Generate random password
  const randomPassword = Math.random().toString(36).slice(-8);
  console.log("Generated random password:", randomPassword);

  // Hash the password
  const hashedPassword = await bcrypt.hash(randomPassword, 10);
  console.log("Hashed password:", hashedPassword);

  // Create new user
  const newUser = new User({email: email.trim().toLowerCase(), password: hashedPassword });
  await newUser.save();
  console.log("New user created:", newUser);

  // Send email
  const sent = await sendEmail(email.trim().toLowerCase(), randomPassword);
  console.log("Email sent status:", sent);

  if (sent) {
    res.json({ message: "OTP verified, new user created" });
  } else {
    console.log("Failed to send email to:", newmail);
    res.status(500).json({ message: "Failed to send email" });
  }
});

router.delete("/emails",authMiddleware, async (req, res) => {
  const { email } = req.body;
  await User.deleteOne({ email });
  res.json({ message: "Email deleted" });
});

router.get("/admins", async (req, res) => {
  try {
    // Find all users and return only their emails
    const users = await User.find().select("email -_id"); 
    // -_id removes the MongoDB _id field
    res.json(users); // [{ email: "user1@example.com" }, { email: "user2@example.com" }, ...]
    console.log("Fetched emails:", users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
