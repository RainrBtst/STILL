require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios"); 
const nodemailer = require("nodemailer");

// Models
const UsersModel = require('./models/Users');
const OTPModel = require('./models/OTP'); // Import the new OTP model
const JournalModel = require('./models/Journal'); 
const PublicMessageModel = require('./models/Message');

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// --- NODEMAILER CONFIG ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// --- REGISTER ROUTE (Sends OTP) ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Save temporary user data and OTP
        await OtpModel.create({ email, otp, userData: { name, password } });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'STILL - Your Verification Code',
            html: `<div style="background:#121212; color:white; padding:20px; text-align:center;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p>Your 6-digit verification code is:</p>
                    <h2 style="letter-spacing:5px; color:#FAEF5D;">${otp}</h2>
                   </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ status: "OTP_SENT" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send verification email" });
    }
});

// --- VERIFY OTP ROUTE (Finalizes Registration) ---
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const otpRecord = await OtpModel.findOne({ email, otp });
        if (otpRecord) {
            // Move data to permanent Users collection
            await UsersModel.create({
                name: otpRecord.userData.name,
                email: email,
                password: otpRecord.userData.password
            });
            await OtpModel.deleteOne({ _id: otpRecord._id });
            res.json({ status: "Success" });
        } else {
            res.status(400).json({ error: "Invalid or expired code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// --- LOGIN ROUTE ---
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email})
    .then(user => {
        if(user && user.password === password) {
            res.json({ status: "Success", userId: user._id, username: user.name });
        } else {
            res.json("Invalid credentials");
        }
    });
});

// Keep your existing Music and Journal routes below...
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));