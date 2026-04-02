// models/Journal.js
const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    // Change this to String so it accepts "masaket" instead of an ObjectId
    username: { type: String, required: true }, 
    journalTitle: String,
    content: String,
    mood: String,
    songDetails: {
        title: String,
        artist: String,
        albumArt: String,
        previewUrl: String
    },
    date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() }
}, { timestamps: true });

module.exports = mongoose.model('journals', JournalSchema);