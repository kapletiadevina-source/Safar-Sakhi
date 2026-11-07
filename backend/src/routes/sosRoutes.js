const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/', validate(sosController.triggerSchema), sosController.triggerSOS);
router.get('/', sosController.getSOSHistory);
router.put('/:id/cancel', sosController.cancelSOS);

module.exports = router;

