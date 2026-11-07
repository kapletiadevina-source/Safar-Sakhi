const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', validate(authController.registerSchema), authController.register);
router.post('/login', validate(authController.loginSchema), authController.login);
router.post('/google-callback', authController.googleCallback);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);

router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validate(authController.profileUpdateSchema), authController.updateProfile);
router.put('/settings', authenticate, validate(authController.settingsUpdateSchema), authController.updateSettings);

module.exports = router;
