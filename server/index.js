require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");

const UsersModel = require('./models/Users');
const JournalModel = require('./models/Journal');
const PublicMessageModel = require('./models/Message'); // Ensure this model exists!
const OTPModel = require('./models/OTP');

const app = express();
app.use(express.json());

// --- CORS & NGROK SETTINGS ---
app.use(cors({ 
    origin: ["https://still-cyan.vercel.app", "http://localhost:3000"], 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true 
}));

app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- REGISTER, OTP, & LOGIN ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await UsersModel.findOne({ email });
        if (existingUser) return res.json({ status: "ALREADY_EXISTS" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OTPModel.create({ email, otp, userData: { name, password } });
        
        const mailOptions = {
            from: `"STILL Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'STILL - Your Verification Code',
            html: `<div style="background:#121212; color:white; padding:40px; text-align:center; border-radius:10px;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p>Your verification code is:</p>
                    <h2 style="color:#FAEF5D; font-size:40px; letter-spacing:10px;">${otp}</h2>
                   </div>`
        };
        await transporter.sendMail(mailOptions);
        res.json({ status: "OTP_SENT" });
    } catch (err) { res.status(500).json({ error: "Registration failed" }); }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const otpRecord = await OTPModel.findOne({ email, otp });
        if (otpRecord) {
            await UsersModel.create({ name: otpRecord.userData.name, email, password: otpRecord.userData.password });
            await OTPModel.deleteOne({ _id: otpRecord._id });
            res.json({ status: "Success" });
        } else { res.status(400).json({ error: "Invalid or expired code" }); }
    } catch (err) { res.status(500).json({ error: "Verification failed" }); }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    UsersModel.findOne({ email: email })
        .then(user => {
            if (user && user.password === password) {
                res.json({ status: "Success", userId: user._id, username: user.name });
            } else { res.status(401).json("Invalid Credentials"); }
        }).catch(err => res.status(500).json(err));
});

// --- MESSAGE ROUTES (RE-ADDED) ---
app.get("/api/messages", async (req, res) => {
    try {
        const messages = await PublicMessageModel.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ error: "Failed to fetch messages" }); }
});

app.post("/api/messages", async (req, res) => {
    try {
        const newMessage = await PublicMessageModel.create(req.body);
        res.status(201).json(newMessage);
    } catch (err) { res.status(500).json({ error: "Failed to post message" }); }
});

// --- JOURNAL & MUSIC ROUTES ---
app.post("/api/journals", async (req, res) => {
    try {
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal); 
    } catch (err) { res.status(500).json({ error: "Failed to save" }); }
});

app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const journals = await JournalModel.find({ username: req.params.username }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) { res.status(500).json({ error: "Failed to fetch" }); }
});

app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        res.json(response.data.results.map(track => ({
            id: track.trackId, name: track.trackName, artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '400x400'), previewUrl: track.previewUrl
        })));
    } catch (err) { res.status(500).json({ error: "Search failed" }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));