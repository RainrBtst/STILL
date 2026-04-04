require('dotenv').config(); 
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");

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

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- THE STABILIZED GMAIL TRANSPORTER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Your 16-character App Password
    },
    // This helps bypass the timeout by ignoring minor network security handshakes
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ GMAIL STATUS: Connection blocked by Google");
    } else {
        console.log("✅ GMAIL STATUS: Ready to send emails");
    }
});

// --- REGISTER ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Save to MongoDB (This works every time)
        await OTPModel.create({ email, otp, userData: { name, password } });

        // 2. Respond to frontend IMMEDIATELY
        // This ensures the user sees the "Enter OTP" screen no matter what
        res.json({ status: "OTP_SENT" });

        // 3. Send Email in the Background
        transporter.sendMail({
            from: `"STILL Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'STILL - Your Verification Code',
            html: `
                <div style="background:#121212; color:white; padding:40px; text-align:center; font-family:sans-serif;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p>Your verification code is:</p>
                    <h2 style="color:#FAEF5D; font-size:32px; letter-spacing:10px;">${otp}</h2>
                </div>`
        }, (err, info) => {
            if (err) console.log("❌ BACKGROUND EMAIL ERROR:", err.message);
            else console.log("✅ EMAIL DELIVERED:", info.response);
        });

    } catch (err) {
        console.error("Register Error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Register failed" });
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
            res.status(400).json({ error: "Invalid code" });
        }
    } catch (err) { res.status(500).json({ error: "Error" }); }
});

// --- LOGIN, JOURNALS, MESSAGES ---
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email})
    .then(user => {
        if(user && user.password === password) {
            res.json({ status: "Success", userId: user._id, username: user.name });
        } else {
            res.json("The password is incorrect");
        }
    }).catch(err => res.status(500).json(err));
});

app.post("/api/journals", async (req, res) => {
    try { await JournalModel.create(req.body); res.status(201).json({status: "ok"}); } 
    catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const journals = await JournalModel.find({ username: req.params.username }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        const tracks = response.data.results.map(track => ({
            id: track.trackId, name: track.trackName, artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '400x400'), previewUrl: track.previewUrl
        }));
        res.json(tracks);
    } catch (err) { res.status(500).json({ error: "Search failed" }); }
});

app.get("/api/messages", async (req, res) => {
    try {
        const messages = await PublicMessageModel.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) { res.status(500).json(err); }
});

app.post("/api/messages", async (req, res) => {
    try {
        const newMessage = await PublicMessageModel.create(req.body);
        res.status(201).json(newMessage);
    } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Server Alive"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));