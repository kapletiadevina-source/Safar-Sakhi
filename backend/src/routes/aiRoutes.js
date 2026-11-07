const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/chat', optionalAuth, validate(aiController.chatSchema), aiController.chatWithCompanion);
router.post('/safety-tips', optionalAuth, validate(aiController.safetyTipSchema), aiController.getCustomSafetyTips);

module.exports = router;
