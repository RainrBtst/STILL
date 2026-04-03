require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const nodemailer = require("nodemailer");

// Models - Ensure these paths are correct
const UsersModel = require('./models/Users');
const OTPModel = require('./models/OTP'); 

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Email Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// 1. REGISTER: Generate and send OTP
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await OTPModel.create({ email, otp, userData: { name, password } });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'STILL - Verification Code',
            html: `<div style="background:#121212; color:white; padding:20px; text-align:center;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p>Your code is: <b style="letter-spacing:5px;">${otp}</b></p>
                   </div>`
        });
        res.json({ status: "OTP_SENT" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send email" });
    }
});

// 2. VERIFY: Check OTP and move to Users collection
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const otpRecord = await OTPModel.findOne({ email, otp });
        if (otpRecord) {
            await UsersModel.create({
                name: otpRecord.userData.name,
                email: email,
                password: otpRecord.userData.password
            });
            await OTPModel.deleteOne({ _id: otpRecord._id });
            res.json({ status: "Success" });
        } else {
            res.status(400).json({ error: "Invalid or expired code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3. LOGIN
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

app.listen(3001, () => console.log("Server running on port 3001"));