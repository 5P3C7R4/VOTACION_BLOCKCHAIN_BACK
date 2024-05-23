const {Schema, model} = require('mongoose')

const candidate = new Schema({
    name: {
        type: Schema.Types.String,
        required: true
    },
    imageName: {
        type: Schema.Types.String,
        required: true
    }
})

module.exports = model("candidate", candidate);