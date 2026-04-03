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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- ITUNES SEARCH LOGIC (FIXED FOR ALL ALBUMS) ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Bypasses the 403 Forbidden block
        });
        
        const results = response.data.results || [];
        
        const tracks = results.map(track => {
            // This smarter replace finds '100x100', '100x100bb', etc., and makes it 400x400
            let albumArt = track.artworkUrl100 || "";
            if (albumArt) {
                albumArt = albumArt.replace(/\d+x\d+.*\.jpg$/, "400x400.jpg");
            } else {
                albumArt = 'https://via.placeholder.com/400'; // Fallback if no album exists
            }

            return {
                id: track.trackId,
                name: track.trackName,
                artist: track.artistName,
                albumArt: albumArt,
                previewUrl: track.previewUrl
            };
        });
        
        res.json(tracks);
    } catch (err) {
        console.error("Music Search Error:", err.message);
        res.status(500).json({ error: "Music search failed" });
    }
});

// --- PUBLIC MESSAGES (Original) ---
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

// --- JOURNAL LOGIC (Original) ---
app.post("/api/journals", async (req, res) => {
    try {
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal);
    } catch (err) { res.status(500).json({ error: "Failed to save journal" }); }
});

app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const journals = await JournalModel.find({ username: req.params.username }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) { res.status(500).json({ error: "Failed to fetch journals" }); }
});

// --- AUTH & OTP ---
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email}).then(user => {
        if(user && user.password === password) {
            res.json({ status: "Success", userId: user._id, username: user.name });
        } else { res.json("Invalid credentials"); }
    });
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        await OTPModel.create({ email, otp, userData: { name, password } });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'STILL - OTP',
            html: `<b>${otp}</b>`
        });
        res.json({ status: "OTP_SENT" });
    } catch (err) { res.status(500).json({ error: "OTP failed" }); }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const otpRecord = await OTPModel.findOne({ email, otp });
        if (otpRecord) {
            await UsersModel.create({ name: otpRecord.userData.name, email, password: otpRecord.userData.password });
            await OTPModel.deleteOne({ _id: otpRecord._id });
            res.json({ status: "Success" });
        } else { res.status(400).json({ error: "Invalid" }); }
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.get("/", (req, res) => res.send("Server is alive!"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));