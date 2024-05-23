const router = require('express').Router();
const controller = require('../controllers/controller')

router.get("/candidates", controller.getCandidates)
router.get("/getImage", controller.getImage)
router.get("/verifyDocument", controller.verifyDocument)
router.post("/candidates", controller.postCandidates)
router.post("/candidates/vote", controller.postVote)

module.exports = router;