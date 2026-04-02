require('dotenv').config(); // MUST be the very first line
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const axios = require("axios"); 

// --- MODELS ---
const UsersModel = require('./models/users');
const JournalModel = require('./models/Journal'); 
const PublicMessageModel = require('./models/Message');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
// Pulls the connection string from your .env file
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// --- FIXED ITUNES SEARCH LOGIC ---
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
        console.error("Music Search Error:", err.message);
        res.status(500).json({ error: "Music search failed" });
    }
});

// --- PUBLIC MESSAGES (SEND A SONG) ---
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
        console.error("Post Message Error:", err.message);
        res.status(500).json(err);
    }
});

// --- JOURNAL LOGIC ---
app.post("/api/journals", async (req, res) => {
    try {
        console.log("Saving Entry for:", req.body.username);
        const newJournal = await JournalModel.create(req.body);
        res.status(201).json(newJournal);
    } catch (err) {
        console.error("Save Journal Error:", err.message);
        res.status(500).json({ error: "Failed to save journal", details: err.message });
    }
});

app.get("/api/journals", async (req, res) => {
    try {
        const journals = await JournalModel.find().sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch journals" });
    }
});

app.get("/api/journals/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const journals = await JournalModel.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user journals" });
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

// --- AUTH ---
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    UsersModel.findOne({email: email})
    .then(user => {
        if(user) {
            if(user.password === password) {
                res.json({ 
                    status: "Success", 
                    userId: user._id,
                    username: user.name 
                })
            } else {
                res.json("The password is incorrect")
            }
        } else {
            res.json("No record existed")
        }
    })
});

app.post('/register', (req, res) => {
    UsersModel.create(req.body)
    .then(users => res.json(users))
    .catch(err => res.json(err))
});

// --- SERVER START ---
// PORT is flexible for deployment (Render) or local testing (3001)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});