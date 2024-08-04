const express = require('express');
const mongoose = require('mongoose');
const app = express();
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/otpVerification', {
  // Remove deprecated options
});

// Create a schema and model
const verificationSchema = new mongoose.Schema({
  email: String,
  deviceType: String,
  ipAddress: String,
  operatingSystem: String,
  browser: String,
  timestamp: { type: Date, default: Date.now },
});

const Verification = mongoose.model('Verification', verificationSchema);

let otpStore = {};

// Configure Nodemailer transporter with App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shirsathkrushna2004@gmail.com', // replace with your email
    pass: 'uxky rmod pnke sbhr'  // replace with your App Password
  },
  tls: {
    rejectUnauthorized: false // Disable TLS certificate checking for development
  }
});

// Endpoint to send OTP
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  console.log(`Generated OTP for ${email}: ${otp}`); // Debugging line

  otpStore[email] = otp;

  const mailOptions = {
    from: 'shirsathkrushna2004@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
    res.status(200).json({ message: 'OTP sent successfully' });
  });
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  console.log(`Received OTP verification request for email: ${email}, otp: ${otp}`); // Debugging line

  console.log(`Stored OTP for ${email}: ${otpStore[email]}`); // Debugging line

  if (otpStore[email] === otp) {
    delete otpStore[email];
    console.log('OTP verified successfully');
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    console.log('Invalid OTP');
    res.status(400).json({ success: false, error: 'Invalid OTP' });
  }
});

// Endpoint to save verification data
app.post('/save-info', async (req, res) => {
  const { email, deviceType, ipAddress, operatingSystem, browser } = req.body;

  const verification = new Verification({
    email,
    deviceType,
    ipAddress,
    operatingSystem,
    browser,
  });

  try {
    await verification.save();
    res.status(200).send('Verification data saved successfully');
  } catch (error) {
    res.status(500).send('Error saving verification data');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
