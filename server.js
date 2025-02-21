const nodemailer = require("nodemailer");
const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

let verificationCode = null;
let email = "";
let currentPassword = "3fv";
// Middleware
app.use(express.json());

app.use(cors());

// Twilio credentials from environment variables
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SENDGRID_API_KEY } =
  process.env;

// Create Twilio client
const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
app.get("/", async (req, res) => {
  console.log("in here");
});

// Set your SendGrid API Key
sgMail.setApiKey(SENDGRID_API_KEY);

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Replace with your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

// Route to Send SMS
app.post("/send-sms", async (req, res) => {
  const { phone, code } = req.body;
  console.log("in here", phone, code);
  try {
    // Send SMS using Twilio API
    const message = await client.messages.create({
      body: `Your verification code is: ${code}`,
      from: TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: phone, // User's phone number
    });

    // Send response back to frontend
    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

// Route to Send Email
app.post("/send-email", async (req, res) => {
  const { email, code } = req.body;

  email = email;
  verificationCode = code;

  const message = {
    to: email,
    from: "3fv@email.com",
    subject: "Your Verification Code",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  console.log("SendGrid API Key:", process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send(message);
    console.log("Verification email sent!");
    res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.response?.body || error);
    res.status(500).json({ success: false, error: "Failed to send email." });
  }
});

// Route to verify the email code
app.post("/verify-email", (req, res) => {
  console.log("in verify", verificationCode);
  const { email, code } = req.body;

  // Check if the verification code matches the stored code
  if (verificationCode === code) {
    // Code matches
    res.json({ success: true, message: "Email verified successfully" });
  } else {
    // Code does not match
    res
      .status(200)
      .json({ success: false, error: "Incorrect verification code" });
  }
});

app.post("/verify-password", (req, res) => {
  const { password } = req.body;
  console.log("in verify password", req.body, password, currentPassword);

  if (password == currentPassword) {
    res.json({ success: true, message: "Password verified successfully" });
  } else {
    // password does not match
    res.status(200).json({ success: false, error: "Incorrect Password" });
  }
});

app.post("/reset-password", (req, res) => {
  const { password } = req.body;
  console.log("in verify password", req.body, password, currentPassword, email);

  currentPassword = password;
  if (currentPassword == password) {
    res.json({ success: true, message: "Password reset successfully" });
  } else {
    // password does not match
    res
      .status(200)
      .json({ success: false, error: "Password reset was not successfully" });
  }
});
// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
