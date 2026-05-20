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
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// --- 5. SYSTEM ROUTES ---
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
        const existingUser = await UsersModel.findOne({ email });
        if (existingUser) {
            return res.json({ status: "ALREADY_EXISTS" });
        }
        const newUser = await UsersModel.create({
            name,
            email,
            password 
        });
        res.json({ status: "SUCCESS" });
    } catch (err) {
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

// NEW: This route specifically for Rhythm Rewind to fix the 404 error
app.get("/user-journals/:userId", async (req, res) => {
    try {
        const journals = await JournalModel.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user journals" });
    }
});

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

// --- 9.5. DAILY AUX API ENDPOINTS ---
const DailyAux = require('./models/DailyAux');

// Helper checking function to reset board on day shifts
const checkAndResetIfNewDay = async () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleTrack = await DailyAux.findOne({});
        if (sampleTrack) {
            const trackDateStr = new Date(sampleTrack.createdAt || Date.now()).toISOString().split('T')[0];
            if (trackDateStr !== todayStr) {
                await DailyAux.deleteMany({});
                console.log("♻️ Automatically cleared leaderboard: A new day has started.");
            }
        }
    } catch (err) {
        console.error("Failed executing automatic daily check reset routine:", err);
    }
};

// Endpoint A: Fetch Complete Playlist
app.get("/api/daily-aux", async (req, res) => {
    try {
        await checkAndResetIfNewDay();
        const tracks = await DailyAux.find().sort({ votes: -1 });
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ error: "Failed to load leaderboard data" });
    }
});

// Endpoint B: Add Track to Leaderboard (Max 30 Limit)
app.post("/api/daily-aux/add", async (req, res) => {
    const { songId, title, artist, albumArt, previewUrl, userId, username } = req.body;
    try {
        await checkAndResetIfNewDay();
        // Enforce the 30-song limit rule
        const totalSongsCount = await DailyAux.countDocuments({});
        if (totalSongsCount >= 30) {
            return res.status(403).json({ code: "LIMIT_REACHED", error: "Leaderboard has a maximum songs, you can vote for now only" });
        }

        // Check if the song is already on the board
        let existingTrack = await DailyAux.findOne({ songId });
        if (existingTrack) {
            return res.status(400).json("This song is already on the leaderboard! Upvote it instead.");
        }

        // Verify if user has remaining votes to submit the song (Submitting uses 1 vote)
        const allTracks = await DailyAux.find({});
        let standardSpentVotes = 0;
        allTracks.forEach(t => {
            const voteRecord = t.votedUsers.find(u => u.userId === userId);
            if (voteRecord) standardSpentVotes += voteRecord.count;
        });

        if (standardSpentVotes >= 10) {
            return res.status(400).json("You have already used all your 10 daily votes!");
        }

        const newTrack = new DailyAux({
            songId,
            title,
            artist,
            albumArt,
            previewUrl,
            votes: 1,
            votedUsers: [{ userId, count: 1 }],
            submittedBy: { userId, username },
            createdAt: new Date()
        });

        await newTrack.save();
        res.status(201).json(newTrack);
    } catch (err) {
        res.status(500).json({ error: "Failed to upload track to Daily Aux" });
    }
});

// Endpoint C: Cast a Vote (Max 10 per User)
app.post("/api/daily-aux/vote", async (req, res) => {
    const { trackId, userId } = req.body;
    try {
        await checkAndResetIfNewDay();
        // Compute total global votes cast by this user across all songs today
        const allTracks = await DailyAux.find({});
        let totalVotesUsed = 0;
        allTracks.forEach(t => {
            const record = t.votedUsers.find(u => u.userId === userId);
            if (record) totalVotesUsed += record.count;
        });

        if (totalVotesUsed >= 10) {
            return res.status(400).json("Vote quota exhausted! You can only use up to 10 votes daily.");
        }

        // Find the target track to update
        const track = await DailyAux.findById(trackId);
        if (!track) return res.status(404).json("Track not found");

        const userVoteIndex = track.votedUsers.findIndex(u => u.userId === userId);
        if (userVoteIndex > -1) {
            track.votedUsers[userVoteIndex].count += 1;
        } else {
            track.votedUsers.push({ userId, count: 1 });
        }

        track.votes += 1;
        await track.save();
        res.json(track);
    } catch (err) {
        res.status(500).json({ error: "Could not register your upvote selection" });
    }
});

// Endpoint D: Custom Profile Vote Summary Breakdown
app.get("/api/daily-aux/user-status/:userId", async (req, res) => {
    try {
        await checkAndResetIfNewDay();
        const allTracks = await DailyAux.find({});
        let totalVotesUsed = 0;
        const votedSongsSummaryList = [];

        allTracks.forEach(t => {
            const match = t.votedUsers.find(u => u.userId === req.params.userId);
            if (match) {
                totalVotesUsed += match.count;
                votedSongsSummaryList.push({
                    title: t.title,
                    artist: t.artist,
                    votesContributed: match.count
                });
            }
        });

        res.json({
            votesUsed: totalVotesUsed,
            votesRemaining: Math.max(0, 10 - totalVotesUsed),
            votedTracks: votedSongsSummaryList
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to compile user vote breakdown telemetry" });
    }
});

// Endpoint E: Complete Leaderboard Clean Reset Functionality
app.post("/api/daily-aux/force-reset", async (req, res) => {
    try {
        await DailyAux.deleteMany({});
        console.log("♻️ Daily Aux Leaderboard has successfully reset for the next 24-hour window.");
        res.status(200).json({ message: "Leaderboard cleared successfully." });
    } catch (err) {
        res.status(500).json({ error: "CRITICAL: Failed to clean database records:" });
    }
});

// --- 10. SERVER START ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));