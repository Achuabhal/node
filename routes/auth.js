const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOtp } = require("../controler/mailer"); // use destructuring
const Otp = require("../models/otpModel");
const verifyCaptcha = require("../controler/cap");
const authMiddleware = require("../controler/Auth"); // import middleware



router.post("/login", async (req, res) => {
 
  const { email, password, captchaToken } = req.body;

  // Verify reCAPTCHA
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Invalid reCAPTCHA" });
    
  }
 
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
    res.json({ success: true, message: "OTP sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/verify-otp", async (req, res) => {
 

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const numericOtp = Number(otp); // convert string to number
  
  const record = await Otp.findOne({ email: email.trim().toLowerCase(), otp:numericOtp });
  console.log("OTP Record:", record);
  if (!record) return res.status(400).json({ message: "Invalid OTP" });

  if (record.expireAt < new Date()) return res.status(400).json({ message: "OTP expired" });

  // OTP is valid → delete it
  await Otp.deleteOne({ _id: record._id });
  
  // create JWT for login
 const user = await User.findOne({ email });
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

// Store JWT in HTTP-only cookie
res.cookie("authToken", token, {
  httpOnly: true,   // cannot be accessed via JS (XSS protection)
  secure: process.env.NODE_ENV === "production", // only HTTPS in prod
  sameSite: "strict" // prevent CSRF
});

// Optionally, still send a response (but not the token)
res.json({ success: true, message: "OTP verified successfully" });
});



// Route for frontend check
router.get("/check", authMiddleware, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});


module.exports = router;
