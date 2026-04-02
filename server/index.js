const express = require("express")
const mongoose = require('mongoose')
const cors = require("cors")
const axios = require("axios") 

// --- MODELS ---
const UsersModel = require('./models/users')
const JournalModel = require('./models/Journal') 
const PublicMessageModel = require('./models/Message'); // Moved to top

const app = express()
app.use(express.json())
app.use(cors())

mongoose.connect("mongodb://localhost:27017/users")

// --- FIXED ITUNES SEARCH LOGIC ---
app.get("/music-search", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=6&entity=song`);
        
        // UPDATED: Mapping keys to match Home.js expectations (name, artist, albumArt)
        const tracks = response.data.results.map(track => ({
            id: track.trackId,
            name: track.trackName,         // Changed from trackName to name
            artist: track.artistName,      // Changed from artistName to artist
            albumArt: track.artworkUrl100.replace('100x100', '400x400'), // Changed from artworkUrl100 to albumArt
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
})

app.post('/register', (req, res) => {
    UsersModel.create(req.body)
    .then(users => res.json(users))
    .catch(err => res.json(err))
})

app.listen(3001, () => {
    console.log("server is running on port 3001")
})