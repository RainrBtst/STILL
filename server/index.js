require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const { Resend } = require('resend'); // Replaced nodemailer with resend

// --- MODELS ---
const UsersModel = require('./models/Users');
const JournalModel = require('./models/Journal');
const PublicMessageModel = require('./models/Message');
const OTPModel = require('./models/OTP');

const app = express();
app.use(express.json());

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// --- INITIALIZE RESEND ---
// Ensure you added RESEND_API_KEY to your Render Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- REGISTER & SEND OTP ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Save OTP and User Data to MongoDB
        await OTPModel.create({ email, otp, userData: { name, password } });

        // 2. Send Email via Resend API
        // NOTE: On the free tier, 'from' must be 'onboarding@resend.dev'
        const { data, error } = await resend.emails.send({
            from: 'STILL Support <onboarding@resend.dev>',
            to: email,
            subject: 'STILL - Your Verification Code',
            html: `
                <div style="background:#121212; color:white; padding:40px; text-align:center; font-family:sans-serif; border-radius:10px;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p style="font-size:16px;">Your verification code is:</p>
                    <h2 style="color:#FAEF5D; font-size:40px; letter-spacing:10px; margin:20px 0;">${otp}</h2>
                    <p style="color:#aaaaaa; font-size:12px;">If you didn't request this, please ignore this email.</p>
                </div>`
        });

        if (error) {
            console.error("❌ RESEND ERROR:", error);
            return res.status(500).json({ error: "Failed to send email" });
        }

        console.log(`✅ OTP sent successfully to ${email}`);
        res.json({ status: "OTP_SENT" });

    } catch (err) {
        console.error("❌ Registration Error:", err);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
});

// --- VERIFY OTP ---
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

// --- LOGIN ---
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    UsersModel.findOne({ email: email })
        .then(user => {
            if (user && user.password === password) {
                res.json({ status: "Success", userId: user._id, username: user.name });
            } else {
                res.status(401).json("Incorrect email or password");
            }
        }).catch(err => res.status(500).json(err));
});

// --- JOURNALS ---
app.post("/api/journals", async (req, res) => {
    try {
        await JournalModel.create(req.body);
        res.status(201).json({ status: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save journal" });
    }
});

app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const journals = await JournalModel.find({ username: req.params.username }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch journals" });
    }
});

// --- MUSIC SEARCH (iTunes API) ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        const tracks = response.data.results.map(track => ({
            id: track.trackId,
            name: track.trackName,
            artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '400x400'),
            previewUrl: track.previewUrl
        }));
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

// --- PUBLIC MESSAGES ---
app.get("/api/messages", async (req, res) => {
    try {
        const messages = await PublicMessageModel.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post("/api/messages", async (req, res) => {
    try {
        const newMessage = await PublicMessageModel.create(req.body);
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Server is running..."));
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));