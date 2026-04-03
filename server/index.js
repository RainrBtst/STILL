require('dotenv').config(); 
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");

// --- MODELS ---
// Make sure these filenames match exactly what is in your 'models' folder
const UsersModel = require('./models/Users');
const JournalModel = require('./models/Journal');
const PublicMessageModel = require('./models/Message');
const OTPModel = require('./models/OTP'); 

const app = express();
app.use(express.json());

// --- CORS ---
app.use(cors({ origin: true, methods: ["GET", "POST"], credentials: true }));

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI);

// --- EMAIL CONFIG ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// --- 1. AUTH & OTP ROUTES ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        await OTPModel.create({ email, otp, userData: { name, password } });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'STILL - Verification Code',
            html: `<h1>STILL</h1><p>Your code is: <b>${otp}</b></p>`
        });
        res.json({ status: "OTP_SENT" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send email" });
    }
});

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
            res.status(400).json({ error: "Invalid code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email}).then(user => {
        if(user && user.password === password) {
            res.json({ status: "Success", userId: user._id, username: user.name });
        } else {
            res.json("Invalid credentials");
        }
    });
});

// --- 2. JOURNAL ROUTES (This fixes your 404 error) ---
app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const journals = await JournalModel.find({ username: username }).sort({ createdAt: -1 });
        res.json(journals); // This sends the data your home page is looking for!
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch journals" });
    }
});

app.post("/api/journals", async (req, res) => {
    try {
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal);
    } catch (err) {
        res.status(500).json({ error: "Failed to save journal" });
    }
});

// --- 3. MUSIC & MESSAGES ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        res.json(response.data.results.map(track => ({
            id: track.trackId,
            name: track.trackName,
            artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '400x400'),
            previewUrl: track.previewUrl
        })));
    } catch (err) { res.status(500).json({ error: "Search failed" }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));