const mongoose = require('mongoose')

const UsersSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profilePic: String // To store the base64 string
})

const UsersModel = mongoose.model("users", UsersSchema)
module.exports = UsersModel