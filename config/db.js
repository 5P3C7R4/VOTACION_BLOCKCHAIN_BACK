const mongoose = require('mongoose')
require('dotenv').config()

async function init() {
    await mongoose.connect(process.env.DB_URI)
}

module.exports = init;