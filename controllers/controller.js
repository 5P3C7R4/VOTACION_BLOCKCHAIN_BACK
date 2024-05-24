const path = require('path')
const fs = require('fs')
const Candidate = require('../models/candidate')
const Vote = require('../models/vote')
const axios = require('axios')
require('dotenv').config()

const controller = {}
const candidateMap = {}

const urlBlockChain = "http://localhost:3001/"

controller.getCandidates = async (req, res) => {
    const candidates = await Candidate.find()
    if (candidates.length == 0) {
        res.sendStatus(404).send();
        return;
    }
    res.json(candidates);
    return;
}

controller.getImage = async (req, res) => {
    let imageName = req.query.imageName;
    if (!imageName.toString().endsWith(".jpg")) {
        res.status(400).send("La imagen no es del formato solicitado");
        return;
    }
    fs.readFile("./assets/" + imageName, (err, data) => {
        if (err) {
            console.log(err);
            res.status(404).send("Imagen no encontrada");
        } else {
            res.contentType('image/jpeg');
            res.send(data);
        }
    })
}

controller.postCandidates = async (req, res) => {
    try {
        const candidate = new Candidate(req.body)
        const saved = await candidate.save()
        res.send(saved);
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(500).send();
        return;
    }
}

controller.verifyDocument = async (req, res) => {
    try {
        const document = req.query.document;
        const votes = await Vote.find();
        if (votes.findIndex(el => el.document == document) != -1) {
            res.status(400).send("Este documento ya se ha usado para votar");
            return;
        } else if (JSON.parse(fs.readFileSync("./assets/voting/allowVoters.json")).voters.findIndex(el => el == document) == -1) {
            res.status(400).send("Este documento no está habilitado para votar");
            return;
        } else {
            res.status(200).send()
            return;
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500).send();
        return;
    }
}

controller.postVote = async (req, res) => {
    try {

        const count = await axios.get(urlBlockChain + "candidateCount")
        if (count.data) {
            for (let i = 0; i < count.data; i++) {
                const candidate = await axios.get(urlBlockChain + `getCandidateByIndex?index=${i}`)
                candidateMap[candidate.data] = i;
            }
        }

        const candidates = await Candidate.find();

        const document = req.body.document;
        // //Register Voter
        await axios.post(urlBlockChain + "vote", { candidateIndex: parseInt(candidateMap[candidates.find(el => el._id.toString() == req.body.candidate).name]), document })


        const voter = await Vote.find();
        if (voter.findIndex(el => el.document == document) != -1) {
            res.status(400).send("Ya se ha registrado un voto para este documento");
            return;
        }
        const vote = new Vote(req.body);
        const saved = await vote.save()
        res.send(saved);
    } catch (error) {
        if (error.response) {
            if (error.response.data == "Voting has ended") {
                res.status(401).send("Voting has ended");
            }
            if (error.response.data == "Voting has not started") {
                res.status(401).send("Voting has not started");
            }
        } else {
            console.log(error);
            res.status(401).send();
        }

    }
}

module.exports = controller;