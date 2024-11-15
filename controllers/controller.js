const { readFileSync, existsSync } = require('node:fs');
const { Candidate, Vote, AllowedVoters } = require('../models/model.js')
const Joi = require('joi')
const dotenv = require('dotenv');

dotenv.config({ path: '.' })

const controller = {}

controller.getOwner = async (_req, res) => {
    const owner = await global.votingContract.methods.getOwner().call();
    res.send({ res: owner })
}

controller.getCandidates = async (_req, res) => {
    const dbCandidates = await Candidate.find()
    let bcCandidates = await global.votingContract.methods.getAllCandidates().call();
    bcCandidates = bcCandidates.map(el => ({ name: el.name, index: Number(el.index), voteCount: Number(el.voteCount) }));
    return res.json({ dbCandidates, bcCandidates });
}

controller.chargeAllowedVoters = async (req, res) => {
    try {
        const { error, value: data } = Joi.array().items(Joi.number().required().raw().label("document")).label("documents").required().validate(req.body.data);
        if (error)
            return res.status(400).send(error.message)

        const from = process.env.ADDRESS
        const tx = global.votingContract.methods.registerVoter(from);
        const gas = await tx.estimateGas({ from });
        const txData = { from, to: process.env.CONTRACT_ADDRESS, data: tx.encodeABI(), gas };
        await global.ganache.eth.sendTransaction(txData);
        await AllowedVoters.bulkSave(data.map(el => new AllowedVoters({ document: el })))

        res.send({ res: "Exitoso" })
    } catch (error) {
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1].replace(/\s(revert)\s/, ""))
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error)
        }
        return res.status(400).send({ res: "Error" })
    }
}

controller.getImage = async (req, res) => {
    try {
        const { error, value } = Joi.string().required().regex(/[\.jpg]$/).label("imageName").messages({ 'string.pattern.base': "imageName is not jpg" }).validate(req.query.imageName);
        if (error)
            return res.status(400).send(error.message)

        if (!existsSync("./assets/" + value))
            return res.status(400).send({ res: "No existe la imagen" })

        return res.send(readFileSync("./assets/" + value))
    } catch (error) {
        console.log("🚀 ~ controller.getImage= ~ error:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
        return res.status(400).send({ res: "Error" });
    }
}

controller.postCandidates = async (req, res) => {
    try {

        const { error, value: data } = Joi.array().items(Joi.object({ name: Joi.string().required().label("name"), imageName: Joi.string().required().label("imageName"), index: Joi.number().required().label("index") })).label("data").required().validate(req.body.data);
        for (const candidate of data) {
            const tx = global.votingContract.methods.addCandidate(candidate.name, candidate.index);
            const gas = await tx.estimateGas({ from: process.env.PRIVATE_OWNER });
            const txData = { from: process.env.PRIVATE_OWNER, to: process.env.CONTRACT_ADDRESS, data: tx.encodeABI(), gas };
            await global.ganache.eth.sendTransaction(txData)
        }

        if (error)
            return res.status(400).send(error.message)

        await Candidate.bulkSave(data.map(el => new Candidate({ ...el })));

        return res.send({ res: "Succesful load of data" });

    } catch (error) {
        // console.log("🚀 ~ controller.postCandidates= ~ error:", error)
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1].replace(/\s(revert)\s/, ""))
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error)
        }
        return res.status(400).send({ res: "Error" })
    }
}

controller.verifyDocument = async (req, res) => {
    try {
        const { error, value: document } = Joi.number().required().label("document").validate(req.query.document);
        if (error)
            return res.status(400).send(error.message)

        const vote = (await Vote.findOne({ document }));
        if (vote?.document)
            return res.status(400).send({ res: "Este documento ya se ha usado para votar" });

        const allowedVoter = (await AllowedVoters.findOne({ document }));
        if (!allowedVoter?.document) {
            return res.status(400).send({ res: "Este documento no está habilitado para votar" });
        }

        return res.status(200).send({ res: "Documento válido" })
    } catch (error) {
        console.log("🚀 ~ controller.verifyDocument= ~ error:", error)
        return res.status(400).send({ res: "Error" });
    }
}

controller.postVote = async (req, res) => {
    try {

        const { error, value: data } = Joi.object({ candidate: Joi.string().required().label("candidate"), document: Joi.number().required().raw().label("document") }).validate({ ...req.body });
        if (error)
            return res.status(400).send(error.message)

        // const count = await controller.getCandidatesCount();

        const candidate = await Candidate.findById(data.candidate);

        if (!candidate?.name)
            return res.status(400).send({ res: "Candidato inválido" });

        const voter = await Vote.findOne({ document: data.document });

        if (voter?.document)
            return res.status(400).send({ res: "Ya se ha registrado un voto para este documento" });

        // //Register Vote
        await controller.vote(candidate.index, data.document);

        //Register contingencia
        const saved = await (new Vote({ ...data })).save();

        return res.send(saved);
    } catch (error) {
        let msg = "Error";
        if (error?.innerError) {
            msg = error.innerError.message.split(":")[1];
            // if (msg.includes("revert")) {
            //     msg = msg.replace(/\s(revert)\s/, "")
            // }
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.postVote= ~ error:", error)
        }
        return res.status(400).send({ res: msg });

    }
}

// Rutas de la API BLOCKCHAIN

//Get number of candidates
controller.getCandidatesCount = async () => {
    try {
        return Number(await global.votingContract.methods.getCandidateCount().call({ from: global.account.address }));
    } catch (err) {
        console.log("🚀 ~ getCandidatesCount ~ err:", err)
        return null;
    }
    // const receipt = await getCandidatesCount();
    // res.send(receipt);
}

//Vote for some candidate
controller.vote = async (candidateIndex, document) => {
    try {
        const tx = global.votingContract.methods.vote(candidateIndex, document);
        const from = process.env.ADDRESS;
        const gas = await tx.estimateGas({ from });
        const data = tx.encodeABI();

        const txData = { from, to: process.env.CONTRACT_ADDRESS, data, gas };

        await global.ganache.eth.sendTransaction(txData);
    } catch (error) {
        console.log("🚀 ~ controller.vote= ~ error:", error.innerError)
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1])
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.vote= ~ error:", error)
        }
        throw error;
    }
};

//Initiate voting
controller.startVoting = async (req, res) => {
    try {
        const secret = req.body.secret_key
        if (secret != process.env.SECRET_KEY)
            return res.status(400).send('Bad secret key');

        const from = process.env.PRIVATE_OWNER
        const tx = global.votingContract.methods.startVoting();
        const gas = await tx.estimateGas({ from });
        const data = tx.encodeABI();

        const txData = { from, to: process.env.CONTRACT_ADDRESS, data: data, gas };
        await global.ganache.eth.sendTransaction(txData);
        res.send({ res: "Voting has started" })
    } catch (error) {
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1].replace(/\s(revert)\s/, ""))
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.vote= ~ error:", error)
        }
        return res.status(400).send({ res: "Error" });;
    }
};

//Terminate voting
controller.endVoting = async (req, res) => {
    try {
        const secret = req.body.secret_key
        if (secret != process.env.SECRET_KEY)
            return null
        const from = process.env.PRIVATE_OWNER
        const tx = global.votingContract.methods.endVoting();
        const gas = await tx.estimateGas({ from });
        const data = tx.encodeABI();

        const txData = { from, to: process.env.CONTRACT_ADDRESS, data: data, gas };

        await global.ganache.eth.sendTransaction(txData);
        res.send({ res: "Voting has ended" });
    } catch (error) {
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1].replace(/\s(revert)\s/, ""))
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.vote= ~ error:", error)
        }
        return res.status(400).send({ res: "Error" })
    }
};

controller.winner = async (req, res) => {
    try {
        const secret = req.body.secret_key
        if (secret != process.env.SECRET_KEY)
            return null


        let resp = await global.votingContract.methods.getWinner().call();
        resp = { winnerName: resp.winnerName, winnerVoteCount: Number(resp.winnerVoteCount) }
        console.log("🚀 ~ controller.winner= ~ resp:", resp)
        // res.send();
        res.send({ res: resp });
    } catch (error) {
        if (error?.innerError) {
            console.log("🚀 ~ controller.postCandidates= ~ error?.innerError:", error.innerError.message.split(":")[1].replace(/\s(revert)\s/, ""))
        } else if (error?.errorResponse) {
            console.log("🚀 ~ controller.postCandidates= ~ error:", error?.errorResponse?.message)
        } else {
            console.log("🚀 ~ controller.vote= ~ error:", error)
        }
        return res.status(400).send({ res: "Error" })
    }
}

module.exports = controller;