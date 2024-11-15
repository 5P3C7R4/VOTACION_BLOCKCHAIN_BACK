const express = require('express');
const controller = require('../controllers/controller.js');

const router = express.Router();

// Rutas de la API CONTINGENCIA

router.get('/owner', controller.getOwner)

//Get candidates
router.get("/candidates", controller.getCandidates)

//Get candidate image
router.get("/getImage", controller.getImage)

//Verify document
router.get("/verifyDocument", controller.verifyDocument)

//Charge allowed voters
router.post("/chargeAllowedVoters", controller.chargeAllowedVoters)

//Save new candidate
router.post("/candidates", controller.postCandidates)

//Vote candidate
router.post("/candidates/vote", controller.postVote)

//Initiate voting
router.post('/startVoting', controller.startVoting);

//Terminate voting
router.post('/endVoting', controller.endVoting);

//Terminate voting
router.post('/winner', controller.winner);

module.exports = router;