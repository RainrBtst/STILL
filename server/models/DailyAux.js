const mongoose = require('mongoose');

const DailyAuxSchema = new mongoose.Schema({
  songId: {
    type: String,
    required: true
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
  // Keeps track of total upvotes in real-time
  votes: {
    type: Number,
    default: 1 // Starts with 1 vote when first dropped on the Aux
  },
  // Array of User IDs who voted for this track today (Prevents multiple votes)
  votedUsers: {
    type: [String],
    default: []
  },
  // Tracks who dropped it on the board
  submittedBy: {
    userId: String,
    username: String
  },
  // Setup timestamp to make clearing or filtering old tracks easier on rotation
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Optional: MongoDB will automatically drop data after 24 hours
  }
});

module.exports = mongoose.model('DailyAux', DailyAuxSchema);