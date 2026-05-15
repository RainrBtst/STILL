const mongoose = require('mongoose')

const UsersSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profilePic: String 
}, { timestamps: true }) // <-- ADD THIS LINE

const UsersModel = mongoose.model("users", UsersSchema)
module.exports = UsersModel