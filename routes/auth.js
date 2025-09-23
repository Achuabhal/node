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
       const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    

    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated OTP:", otp);

    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Save OTP to MongoDB
    try {
      await Otp.create({ email, otp, expireAt });
      console.log("Saved OTP to DB for email:", email);
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
const token = jwt.sign(
  { id: user._id, email: user.email }, 
  process.env.JWT_SECRET, 
  { expiresIn: "1h" }
);


// Store JWT in HTTP-only cookie
res.cookie("authToken", token, {
  httpOnly: true,
  secure: true, // Always true if using SameSite: None
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use "lax" for local dev
  maxAge: 24 * 60 * 60 * 1000 // Optional: Set expiry (e.g., 1 day)
});

res.json({ success: true, message: "Logged in successfully" });

});



// Route for frontend check
router.get("/check", authMiddleware, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});


router.get("/logout", (req, res) => {
  console.log("Logout request received");
  // Clear the cookie
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false,   // set to true if using HTTPS
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use "lax" for local dev
  });

  res.json({ message: "Logged out successfully" });
});

module.exports = router;
