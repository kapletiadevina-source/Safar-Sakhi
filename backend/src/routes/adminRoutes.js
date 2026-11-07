const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAdminUsers);
router.get('/incidents', adminController.getAdminIncidents);
router.put('/incidents/:id/resolve', adminController.resolveAdminIncident);

module.exports = router;

