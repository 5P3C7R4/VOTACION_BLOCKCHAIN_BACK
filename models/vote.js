const {Schema, model} = require('mongoose')

const vote = new Schema({
    document: {
        type: Schema.Types.String,
        required: true
    },
    candidate: {
        type: Schema.Types.String,
        required: true
    }
})

module.exports = model("vote", vote);