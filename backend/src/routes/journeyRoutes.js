const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Public/Family tracking link route (no login required, or optional)
router.get('/track/:trackingToken', optionalAuth, journeyController.trackJourneyByToken);

// Authenticated user journey routes
router.use(authenticate);

router.post('/', validate(journeyController.startJourneySchema), journeyController.startJourney);
router.get('/active', journeyController.getActiveJourney);
router.get('/analytics/summary', journeyController.getAnalytics);
router.get('/', journeyController.getJourneys);
router.get('/:id', journeyController.getJourneyById);

router.put('/:id/eta', journeyController.updateEta);
router.put('/:id/pause', journeyController.pauseJourney);
router.put('/:id/resume', journeyController.resumeJourney);
router.post('/:id/complete', journeyController.completeJourney);
router.post('/:id/cancel', journeyController.cancelJourney);
router.post('/:id/confirm-safe', journeyController.confirmSafe);

module.exports = router;

