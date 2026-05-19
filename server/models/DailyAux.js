const mongoose = require('mongoose');

const DailyAuxSchema = new mongoose.Schema({
  songId: {
    type: String,
    required: true,
    unique: true // Prevents duplicate instances of the same song on the dashboard
  },
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  albumArt: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  previewUrl: {
    type: String,
    default: ''
  },
  votes: {
    type: Number,
    default: 1 // Automatically starts with 1 vote when first posted
  },
  // Tracks exactly how many votes a user added to this specific track
  votedUsers: [
    {
      userId: { type: String, required: true },
      count: { type: Number, default: 1 }
    }
  ],
  submittedBy: {
    userId: String,
    username: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DailyAux', DailyAuxSchema);