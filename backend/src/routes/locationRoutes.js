const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/', validate(locationController.locationSchema), locationController.recordLocation);
router.get('/journey/:journeyId', locationController.getJourneyLocations);

module.exports = router;

