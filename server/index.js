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

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- NODEMAILER CONFIG (THE FIX) ---
const transporter = nodemailer.createTransport({
    service: 'gmail', // Shortcut that fixes the 'ETIMEDOUT' issue on Render
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// --- AUTH & VERIFICATION ---

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Save to MongoDB (This is what you saw in Compass)
        await OTPModel.create({ email, otp, userData: { name, password } });

        // 2. Send the Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'STILL - Your Verification Code',
            html: `<div style="background:#121212; color:white; padding:20px; text-align:center;">
                    <h1 style="color:#FAEF5D;">STILL</h1>
                    <p>Your 6-digit verification code is:</p>
                    <h2 style="letter-spacing:5px; color:#FAEF5D;">${otp}</h2>
                   </div>`
        });
        
        // 3. Respond to frontend
        res.json({ status: "OTP_SENT" });

    } catch (err) {
        console.error("Nodemailer Error:", err);
        // If email fails, we still have the record in DB, but we tell the user
        res.status(500).json({ error: "OTP failed to send to Gmail" });
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
            res.status(400).json({ error: "Invalid or expired code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

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

// --- JOURNAL & MESSAGES (UNTOUCHED) ---
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
            id: track.trackId,
            name: track.trackName,
            artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '400x400'),
            previewUrl: track.previewUrl
        }));
        res.json(tracks);
    } catch (err) { res.status(500).json({ error: "Music search failed" }); }
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
app.get("/", (req, res) => res.send("Server is alive!"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));