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

// --- NODEMAILER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- MUSIC SEARCH (FIXED FOR ALL USERS) ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        // Added User-Agent to stop the 403 Forbidden block for all users
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        
        const results = response.data.results || [];
        const tracks = results.map(track => ({
            id: track.trackId,
            name: track.trackName,
            artist: track.artistName,
            // The "?" check stops the 500 error when images are formatted as 400x400bb.jpg
            albumArt: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '400x400') : '',
            previewUrl: track.previewUrl
        }));
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
            subject: 'STILL - Verification Code',
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