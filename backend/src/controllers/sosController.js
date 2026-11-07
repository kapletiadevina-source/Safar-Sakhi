const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');
const sosService = require('../services/sosService');

const triggerSchema = z.object({
  journeyId: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  accuracy: z.number().optional().nullable(),
  triggerType: z.enum(['MANUAL', 'VOICE', 'DELAY_TRIGGERED']).default('MANUAL'),
  emergencyPhrase: z.string().optional().nullable()
});

const triggerSOS = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { journeyId, latitude, longitude, accuracy, triggerType, emergencyPhrase } = req.body;

    const incident = await sosService.triggerSOS({
      userId,
      journeyId,
      latitude,
      longitude,
      accuracy,
      triggerType,
      emergencyPhrase
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency SOS activated! All trusted contacts have been alerted with your location.',
      incident
    });
  } catch (error) {
    next(error);
  }
};

const cancelSOS = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const updated = await sosService.cancelSOS(id, userId, resolutionNotes || 'Accidental activation / cancelled by user');

    return res.json({
      success: true,
      message: 'Emergency SOS cancelled. Status updated.',
      incident: updated
    });
  } catch (error) {
    next(error);
  }
};

const getSOSHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (memoryStore.isPostgresActive && prisma) {
      const incidents = await prisma.sOSIncident.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { journey: true }
      });
      return res.json({ success: true, incidents });
    }

    const incidents = memoryStore.sosIncidents
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(s => ({
        ...s,
        journey: memoryStore.journeys.find(j => j.id === s.journeyId) || null
      }));

    return res.json({ success: true, incidents });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSOS,
  cancelSOS,
  getSOSHistory,
  triggerSchema
};

