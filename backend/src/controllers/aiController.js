const { z } = require('zod');
const aiService = require('../services/aiService');
const { prisma, memoryStore } = require('../config/db');

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.object({
    activeJourneyId: z.string().optional().nullable(),
    currentLatitude: z.number().optional().nullable(),
    currentLongitude: z.number().optional().nullable()
  }).optional()
});

const safetyTipSchema = z.object({
  query: z.string().optional().default('solo women travel safety'),
  commuteType: z.string().optional(),
  timeOfDay: z.string().optional()
});

const chatWithCompanion = async (req, res, next) => {
  try {
    const { message, context = {} } = req.body;
    const userId = req.user ? req.user.id : null;

    let userName = 'Friend';
    let activeJourney = null;

    if (userId) {
      if (memoryStore.isPostgresActive && prisma) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true }
        });
        if (u) userName = u.fullName.split(' ')[0];

        activeJourney = await prisma.journey.findFirst({
          where: { userId, status: { in: ['ACTIVE', 'DELAYED', 'PAUSED', 'EMERGENCY'] } },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        const u = memoryStore.users.find(user => user.id === userId);
        if (u) userName = u.fullName.split(' ')[0];

        activeJourney = memoryStore.journeys.find(
          j => j.userId === userId && ['ACTIVE', 'DELAYED', 'PAUSED', 'EMERGENCY'].includes(j.status)
        );
      }
    }

    const aiResponse = await aiService.generateAIResponse(message, {
      userName,
      activeJourney,
      ...context
    });

    return res.json({
      success: true,
      reply: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

const getCustomSafetyTips = async (req, res, next) => {
  try {
    const { query = 'solo women travel safety', commuteType, timeOfDay } = req.body;
    const userId = req.user ? req.user.id : null;
    let userName = 'Traveler';

    if (userId) {
      if (memoryStore.isPostgresActive && prisma) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true }
        });
        if (u) userName = u.fullName.split(' ')[0];
      } else {
        const u = memoryStore.users.find(user => user.id === userId);
        if (u) userName = u.fullName.split(' ')[0];
      }
    }

    const tips = await aiService.generateSafetyTips(query, {
      userName,
      commuteType,
      timeOfDay
    });

    return res.json({
      success: true,
      tips,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithCompanion,
  chatSchema,
  getCustomSafetyTips,
  safetyTipSchema
};
