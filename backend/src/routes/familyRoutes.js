const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/connections', familyController.getFamilyConnections);
router.post('/invite', validate(familyController.inviteSchema), familyController.inviteFamilyMember);
router.post('/connect', validate(familyController.connectSchema), familyController.connectToTraveler);
router.get('/journeys', familyController.getSharedJourneys);
router.get('/journeys/:id', familyController.getSharedJourneyById);

module.exports = router;

