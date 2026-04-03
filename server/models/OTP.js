const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    userData: { 
        name: String, 
        password: String 
    },
    // Deletes automatically after 5 minutes
    createdAt: { type: Date, default: Date.now, expires: 300 } 
});

// Ensure the model name is OTPModel to match your index.js
const OTPModel = mongoose.model("otps", OtpSchema);
module.exports = OTPModel;