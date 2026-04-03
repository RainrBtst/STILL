require('dotenv').config(); // MUST be the very first line
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");

// --- MODELS ---
// Ensure these files exist in your 'models' folder
const UsersModel = require('./models/Users');
const JournalModel = require('./models/Journal');
const PublicMessageModel = require('./models/Message');
const OTPModel = require('./models/OTP'); 

const app = express();
app.use(express.json());

// --- SAFE MODE CORS CONFIGURATION ---
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- NODEMAILER CONFIG ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// --- HEALTH CHECK ROUTE ---
app.get("/", (req, res) => {
    res.send("Server is alive and reaching the internet!");
});

// --- 1. AUTH & OTP LOGIC ---

// REGISTER: Generates and sends OTP
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await OTPModel.create({ email, otp, userData: { name, password } });

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
        res.json({ status: "OTP_SENT" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Failed to send verification email" });
    }
});

// VERIFY OTP: Finalizes registration and moves user to main database
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
        console.error("Verification Error:", err);
        res.status(500).json({ error: "Verification failed" });
    }
});

// LOGIN
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email})
    .then(user => {
        if(user) {
            if(user.password === password) {
                res.json({ status: "Success", userId: user._id, username: user.name });
            } else {
                res.json("The password is incorrect");
            }
        } else {
            res.json("No record existed");
        }
    })
    .catch(err => res.status(500).json(err));
});

// --- 2. JOURNAL LOGIC ---
app.post("/api/journals", async (req, res) => {
    try {
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal);
    } catch (err) {
        res.status(500).json({ error: "Failed to save journal", details: err.message });
    }
});

app.get("/api/journals/user/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const journals = await JournalModel.find({ username: username }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch journals" });
    }
});

// --- 3. PUBLIC MESSAGES ---
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

// --- 4. ITUNES SEARCH LOGIC (FIXED) ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        
        const tracks = (response.data.results || []).map(track => ({
            id: track.trackId,
            name: track.trackName,
            artist: track.artistName,
            // Added safety check to prevent crashing if artworkUrl100 is missing
            albumArt: track.artworkUrl100 
                ? track.artworkUrl100.replace('100x100', '400x400') 
                : 'https://via.placeholder.com/400',
            previewUrl: track.previewUrl
        }));
        res.json(tracks);
    } catch (err) {
        console.error("Music Search Error:", err.message);
        res.status(500).json({ error: "Music search failed" });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});