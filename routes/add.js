const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOtp, sendEmail } = require("../controler/mailer");
const veryfyToken = require("../controler/jwt");
const Otp = require("../models/otpModel");



router.post("/add", async (req, res) => {
  const { email} = req.body;

  try {

     const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

   
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated OTP:", otp);

    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Save OTP to MongoDB
    try {
      await Otp.create({ email, otp, expireAt });
    } catch (dbErr) {
      console.error("Error saving OTP to DB:", dbErr);
      return res.status(500).json({ message: "Failed to save OTP" });
    }

    // Send OTP via email
    const sent = await sendOtp(email, otp);
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


router.post("/verify-otp2", async (req, res) => {
  const { email, otp, newmail } = req.body;
  if (!email || !otp || !newmail) return res.status(400).json({ message: "Email, OTP, and new email are required" });

  const numericOtp = Number(otp);
  const record = await Otp.findOne({ email: email.trim().toLowerCase(), otp: numericOtp });
  console.log("OTP Record:", record);
  if (!record) return res.status(400).json({ message: "Invalid OTP" });

  if (record.expireAt < new Date()) return res.status(400).json({ message: "OTP expired" });

  await Otp.deleteOne({ _id: record._id });

  // Generate random password
  const randomPassword = Math.random().toString(36).slice(-8);

// Hash the password (use 10 salt rounds for security)
const hashedPassword = await bcrypt.hash(randomPassword, 10);

// Create new user with hashed password
const newUser = new User({ email: newmail.trim().toLowerCase(), password: hashedPassword });
await newUser.save();

  // Send email with new email and password (use your email sender function)
  const sent = await sendEmail(newmail, randomPassword);
  if (sent) {
    res.json({ message: "OTP verified, new user created" });
  } else {
    res.status(500).json({ message: "Failed to send email" });
  }
});
module.exports = router;
