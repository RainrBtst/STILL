const mongoose = require('mongoose'); // THIS IS THE MISSING LINE

const MessageSchema = new mongoose.Schema({
    recipient: String,
    message: String,
    song: String,
    albumArt: String,
    previewUrl: String, // <--- MAKE SURE THIS IS HERE
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('messages', MessageSchema);