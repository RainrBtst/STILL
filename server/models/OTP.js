const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    userData: { 
        name: String, 
        password: String 
    },
    // This automatically deletes the document after 5 minutes (300 seconds)
    createdAt: { type: Date, default: Date.now, expires: 300 } 
});

const OtpModel = mongoose.model("otps", OtpSchema);
module.exports = OtpModel;