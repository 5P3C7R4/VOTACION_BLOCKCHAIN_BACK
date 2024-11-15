const { Schema, model } = require('mongoose');

const models = {}

models.Candidate = model("candidate", new Schema({
    name: { type: Schema.Types.String, required: true },
    imageName: { type: Schema.Types.String, required: true },
    index: { type: Schema.Types.Number, unique: true }
}))

models.Vote = model("vote", new Schema({
    document: { type: Schema.Types.String, required: true },
    candidate: { type: Schema.Types.String, required: true }
}))

models.AllowedVoters = model("allowedVoters", new Schema({
    document: { type: Schema.Types.String, unique: true }
}))

module.exports = models;