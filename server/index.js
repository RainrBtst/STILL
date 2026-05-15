require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");

const UsersModel = require('./models/Users');
const JournalModel = require('./models/Journal');
const PublicMessageModel = require('./models/Message'); 
const OTPModel = require('./models/OTP');

const app = express();

// --- 1. PAYLOAD LIMITS ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- 2. CORS CONFIGURATION ---
app.use(cors({ 
    origin: [
        "https://still-cyan.vercel.app", 
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://still-csmi.onrender.com" 
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true 
}));

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 4. EMAIL CONFIGURATION ---
// --- 4. EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL for port 465
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, // Wait 10 seconds before giving up
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// --- 5. SYSTEM ROUTES (Ping & Health Check) ---

app.get("/", (req, res) => {
    res.status(200).send("STILL Backend API is running.");
});

app.get("/ping", (req, res) => {
    res.status(200).send("Server is awake!");
});

// --- 6. AUTHENTICATION ROUTES ---

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if the user (old or new) already exists
        const existingUser = await UsersModel.findOne({ email });
        if (existingUser) {
            return res.json({ status: "ALREADY_EXISTS" });
        }

        // Save the new user IMMEDIATELY
        const newUser = await UsersModel.create({
            name,
            email,
            password 
        });

        console.log(`New account created for: ${email}`);
        
        // Tell the frontend to let them in!
        res.json({ status: "SUCCESS" });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Could not create account" });
    }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        const otpRecord = await OTPModel.findOne({ email, otp });
        if (otpRecord) {
            await UsersModel.create({ 
                name: otpRecord.userData.name, 
                email, 
                password: otpRecord.userData.password 
            });
            await OTPModel.deleteOne({ _id: otpRecord._id });
            res.json({ status: "Success" });
        } else { 
            res.status(400).json({ error: "Invalid or expired code" }); 
        }
    } catch (err) { res.status(500).json({ error: "Verification failed" }); }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    UsersModel.findOne({ email: email })
        .then(user => {
            if (user) {
                if (user.password === password) {
                    res.json({ 
                        status: "Success", 
                        userId: user._id, 
                        username: user.name, 
                        email: user.email, 
                        profilePic: user.profilePic, 
                        createdAt: user.createdAt
                    });
                } else { 
                    res.status(401).json("Incorrect Password"); 
                }
            } else { 
                res.status(401).json("Invalid Credentials"); 
            }
        }).catch(err => res.status(500).json(err));
});

// --- 7. PROFILE & USER ROUTES ---

app.get("/api/user/:id", async (req, res) => {
    try {
        const user = await UsersModel.findById(req.params.id);
        if (user) res.json(user);
        else res.status(404).json("User not found");
    } catch (err) { res.status(500).json(err); }
});

app.put("/api/user/update/:id", async (req, res) => {
    const { username, profilePic, currentPassword, newPassword } = req.body;
    try {
        const user = await UsersModel.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        if (currentPassword || newPassword) {
            if (user.password !== currentPassword) {
                return res.status(400).json({ error: "Incorrect current password." });
            }
            user.password = newPassword;
        }

        if (username) user.name = username;
        if (profilePic !== undefined) user.profilePic = profilePic;

        await user.save();
        res.json({ status: "Success", username: user.name, profilePic: user.profilePic });
    } catch (err) { res.status(500).json(err); }
});

// --- 8. MESSAGES & JOURNAL ROUTES ---

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

app.post("/api/journals", async (req, res) => {
    try {
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal); 
    } catch (err) { res.status(500).json({ error: "Failed to save" }); }
});

app.get("/api/journals/user/:identifier", async (req, res) => {
    try {
        const journals = await JournalModel.find({
            $or: [
                { userId: req.params.identifier },
                { username: req.params.identifier }
            ]
        }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) { res.status(500).json({ error: "Failed to fetch" }); }
});

// --- 9. MUSIC SEARCH (iTunes API) ---
const handleMusicSearch = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        const results = response.data.results || [];
        res.json(results.map(track => ({
            id: track.trackId, 
            name: track.trackName, 
            artist: track.artistName,
            albumArt: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '400x400') : '', 
            previewUrl: track.previewUrl
        })));
    } catch (err) { res.status(500).json({ error: "Search failed" }); }
};

app.get("/music-search", handleMusicSearch);
app.get("/api/search", handleMusicSearch);

// --- 10. SERVER START ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));