const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');
const notificationService = require('../services/notificationService');

const startJourneySchema = z.object({
  startLocation: z.string().min(2, 'Start location is required'),
  startLatitude: z.number().optional().nullable(),
  startLongitude: z.number().optional().nullable(),
  destination: z.string().min(2, 'Destination is required'),
  destinationLatitude: z.number().optional().nullable(),
  destinationLongitude: z.number().optional().nullable(),
  expectedArrivalTime: z.string().or(z.date()),
  journeyType: z.string().default('CAB'),
  notes: z.string().optional().nullable(),
  sharedContactIds: z.array(z.string()).optional(),
  sharedFamilyIds: z.array(z.string()).optional()
});

const startJourney = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      startLocation,
      startLatitude,
      startLongitude,
      destination,
      destinationLatitude,
      destinationLongitude,
      expectedArrivalTime,
      journeyType,
      notes,
      sharedContactIds,
      sharedFamilyIds
    } = req.body;

    const etaDate = new Date(expectedArrivalTime);
    const trackingToken = `sakhi-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    const sharedIdsJson = JSON.stringify(sharedContactIds || []);
    const sharedFamJson = JSON.stringify(sharedFamilyIds || []);

    let journey = null;

    if (memoryStore.isPostgresActive && prisma) {
      journey = await prisma.journey.create({
        data: {
          userId,
          startLocation,
          startLatitude: startLatitude ? parseFloat(startLatitude) : null,
          startLongitude: startLongitude ? parseFloat(startLongitude) : null,
          destination,
          destinationLatitude: destinationLatitude ? parseFloat(destinationLatitude) : null,
          destinationLongitude: destinationLongitude ? parseFloat(destinationLongitude) : null,
          expectedArrivalTime: etaDate,
          originalEta: etaDate,
          startTime: new Date(),
          status: 'ACTIVE',
          journeyType: journeyType || 'CAB',
          notes: notes || '',
          trackingToken,
          sharedContactIds: sharedIdsJson,
        sharedFamilyIds: sharedFamJson,
          sharedFamilyIds: sharedFamJson
        }
      });

      // If initial GPS coordinates provided, record initial location
      if (startLatitude && startLongitude) {
        await prisma.journeyLocation.create({
          data: {
            journeyId: journey.id,
            userId,
            latitude: parseFloat(startLatitude),
            longitude: parseFloat(startLongitude),
            timestamp: new Date()
          }
        });
      }
    } else {
      journey = {
        id: `journey_${Date.now()}`,
        userId,
        startLocation,
        startLatitude: startLatitude ? parseFloat(startLatitude) : 28.5355,
        startLongitude: startLongitude ? parseFloat(startLongitude) : 77.3910,
        destination,
        destinationLatitude: destinationLatitude ? parseFloat(destinationLatitude) : 28.6139,
        destinationLongitude: destinationLongitude ? parseFloat(destinationLongitude) : 77.2090,
        expectedArrivalTime: etaDate,
        originalEta: etaDate,
        startTime: new Date(),
        endTime: null,
        status: 'ACTIVE',
        journeyType: journeyType || 'CAB',
        notes: notes || '',
        trackingToken,
        sharedContactIds: sharedIdsJson,
        sharedFamilyIds: sharedFamJson,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.journeys.unshift(journey);

      if (startLatitude && startLongitude) {
        memoryStore.locations.push({
          id: `loc_${Date.now()}`,
          journeyId: journey.id,
          userId,
          latitude: parseFloat(startLatitude),
          longitude: parseFloat(startLongitude),
          accuracy: 10,
          timestamp: new Date()
        });
      }
    }

    // Trigger Notification
    await notificationService.createNotification({
      userId,
      journeyId: journey.id,
      type: 'JOURNEY_STARTED',
      title: '🚀 Journey Started',
      message: `Active journey to ${destination}. Real-time tracking and safety monitoring started.`,
      metadata: { journeyId: journey.id, destination, trackingToken }
    });

    return res.status(201).json({
      success: true,
      message: 'Journey started successfully.',
      journey,
      trackingUrl: `/track/${journey.trackingToken}`
    });
  } catch (error) {
    next(error);
  }
};

const getActiveJourney = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let activeJourney = null;

    if (memoryStore.isPostgresActive && prisma) {
      activeJourney = await prisma.journey.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PAUSED', 'DELAYED', 'EMERGENCY'] }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          locations: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          sosIncidents: {
            where: { status: 'ACTIVE' }
          }
        }
      });
    } else {
      activeJourney = memoryStore.journeys.find(
        j => j.userId === userId && ['ACTIVE', 'PAUSED', 'DELAYED', 'EMERGENCY'].includes(j.status)
      );

      if (activeJourney) {
        const locations = memoryStore.locations
          .filter(l => l.journeyId === activeJourney.id)
          .slice(-20);
        const sosIncidents = memoryStore.sosIncidents.filter(
          s => s.journeyId === activeJourney.id && s.status === 'ACTIVE'
        );
        activeJourney = { ...activeJourney, locations, sosIncidents };
      }
    }

    return res.json({
      success: true,
      activeJourney: activeJourney || null
    });
  } catch (error) {
    next(error);
  }
};

const getJourneys = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, search, limit = 50 } = req.query;

    if (memoryStore.isPostgresActive && prisma) {
      const where = { userId };
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { destination: { contains: search, mode: 'insensitive' } },
          { startLocation: { contains: search, mode: 'insensitive' } }
        ];
      }

      const journeys = await prisma.journey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        include: {
          sosIncidents: true,
          safetyConfirmations: true
        }
      });

      return res.json({ success: true, journeys });
    }

    let journeys = memoryStore.journeys.filter(j => j.userId === userId);
    if (status && status !== 'ALL') {
      journeys = journeys.filter(j => j.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      journeys = journeys.filter(j => 
        j.destination.toLowerCase().includes(q) || j.startLocation.toLowerCase().includes(q)
      );
    }

    journeys = journeys.slice(0, parseInt(limit, 10)).map(j => ({
      ...j,
      sosIncidents: memoryStore.sosIncidents.filter(s => s.journeyId === j.id),
      safetyConfirmations: memoryStore.confirmations.filter(c => c.journeyId === j.id)
    }));

    return res.json({ success: true, journeys });
  } catch (error) {
    next(error);
  }
};

const getJourneyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    let journey = null;

    if (memoryStore.isPostgresActive && prisma) {
      journey = await prisma.journey.findUnique({
        where: { id },
        include: {
          user: {
            select: { fullName: true, phoneNumber: true, profile: true }
          },
          locations: {
            orderBy: { timestamp: 'asc' }
          },
          sosIncidents: true,
          safetyConfirmations: true
        }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.id === id);
      if (j) {
        const u = memoryStore.users.find(user => user.id === j.userId);
        const profile = u ? memoryStore.profiles.find(p => p.userId === u.id) : null;
        const locations = memoryStore.locations.filter(l => l.journeyId === id);
        const sosIncidents = memoryStore.sosIncidents.filter(s => s.journeyId === id);
        const safetyConfirmations = memoryStore.confirmations.filter(c => c.journeyId === id);

        journey = {
          ...j,
          user: u ? { fullName: u.fullName, phoneNumber: u.phoneNumber, profile } : null,
          locations,
          sosIncidents,
          safetyConfirmations
        };
      }
    }

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found.' });
    }

    return res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

// Public/Family tracking link endpoint
const trackJourneyByToken = async (req, res, next) => {
  try {
    const { trackingToken } = req.params;
    let journey = null;

    if (memoryStore.isPostgresActive && prisma) {
      journey = await prisma.journey.findUnique({
        where: { trackingToken },
        include: {
          user: {
            select: {
              fullName: true,
              phoneNumber: true,
              profile: {
                select: { avatar: true, bloodGroup: true, emergencyNotes: true }
              }
            }
          },
          locations: {
            orderBy: { timestamp: 'desc' },
            take: 30
          },
          sosIncidents: {
            where: { status: 'ACTIVE' }
          },
          safetyConfirmations: {
            orderBy: { confirmedAt: 'desc' },
            take: 5
          }
        }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.trackingToken === trackingToken);
      if (j) {
        const u = memoryStore.users.find(user => user.id === j.userId);
        const p = u ? memoryStore.profiles.find(prof => prof.userId === u.id) : null;
        const locations = memoryStore.locations
          .filter(l => l.journeyId === j.id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 30);
        const sosIncidents = memoryStore.sosIncidents.filter(s => s.journeyId === j.id && s.status === 'ACTIVE');
        const safetyConfirmations = memoryStore.confirmations
          .filter(c => c.journeyId === j.id)
          .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
          .slice(0, 5);

        journey = {
          ...j,
          user: u ? { fullName: u.fullName, phoneNumber: u.phoneNumber, profile: p } : null,
          locations,
          sosIncidents,
          safetyConfirmations
        };
      }
    }

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Shared tracking link is invalid or journey does not exist.'
      });
    }

    return res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

const updateEta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newEta } = req.body;
    const userId = req.user.id;

    const parsedEta = new Date(newEta);

    if (memoryStore.isPostgresActive && prisma) {
      const journey = await prisma.journey.updateMany({
        where: { id, userId },
        data: {
          expectedArrivalTime: parsedEta,
          status: 'ACTIVE' // Reset status to ACTIVE if it was DELAYED
        }
      });

      if (journey.count === 0) {
        return res.status(404).json({ success: false, message: 'Journey not found.' });
      }
    } else {
      const j = memoryStore.journeys.find(item => item.id === id && item.userId === userId);
      if (!j) {
        return res.status(404).json({ success: false, message: 'Journey not found.' });
      }
      j.expectedArrivalTime = parsedEta;
      if (j.status === 'DELAYED') j.status = 'ACTIVE';
      j.updatedAt = new Date();
    }

    await notificationService.createNotification({
      userId,
      journeyId: id,
      type: 'ETA_UPDATED',
      title: '⏱️ ETA Updated',
      message: `Updated expected arrival time to ${parsedEta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      metadata: { journeyId: id, newEta: parsedEta }
    });

    return res.json({ success: true, message: 'ETA updated successfully.', newEta: parsedEta });
  } catch (error) {
    next(error);
  }
};

const pauseJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.journey.updateMany({
        where: { id, userId },
        data: { status: 'PAUSED' }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.id === id && item.userId === userId);
      if (j) j.status = 'PAUSED';
    }

    return res.json({ success: true, message: 'Journey paused.' });
  } catch (error) {
    next(error);
  }
};

const resumeJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.journey.updateMany({
        where: { id, userId },
        data: { status: 'ACTIVE' }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.id === id && item.userId === userId);
      if (j) j.status = 'ACTIVE';
    }

    return res.json({ success: true, message: 'Journey resumed.' });
  } catch (error) {
    next(error);
  }
};

const completeJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date();

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.journey.updateMany({
        where: { id, userId },
        data: {
          status: 'COMPLETED',
          endTime: now
        }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.id === id && item.userId === userId);
      if (j) {
        j.status = 'COMPLETED';
        j.endTime = now;
      }
    }

    await notificationService.createNotification({
      userId,
      journeyId: id,
      type: 'JOURNEY_COMPLETED',
      title: '🎉 Journey Completed Safely',
      message: 'You have safely reached your destination. Location sharing has ended.',
      metadata: { journeyId: id }
    });

    return res.json({ success: true, message: 'Journey marked as completed. Safe travels!' });
  } catch (error) {
    next(error);
  }
};

const cancelJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date();

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.journey.updateMany({
        where: { id, userId },
        data: {
          status: 'CANCELLED',
          endTime: now
        }
      });
    } else {
      const j = memoryStore.journeys.find(item => item.id === id && item.userId === userId);
      if (j) {
        j.status = 'CANCELLED';
        j.endTime = now;
      }
    }

    return res.json({ success: true, message: 'Journey cancelled. Location sharing stopped.' });
  } catch (error) {
    next(error);
  }
};

const confirmSafe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, latitude, longitude } = req.body;
    const userId = req.user.id;
    const now = new Date();

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.safetyConfirmation.create({
        data: {
          journeyId: id,
          userId,
          confirmedAt: now,
          message: message || 'User confirmed they are safe.',
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null
        }
      });

      // Reset delayed status back to active
      await prisma.journey.updateMany({
        where: { id, status: 'DELAYED' },
        data: { status: 'ACTIVE' }
      });
    } else {
      memoryStore.confirmations.push({
        id: `conf_${Date.now()}`,
        journeyId: id,
        userId,
        confirmedAt: now,
        message: message || 'User confirmed they are safe.',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      });

      const j = memoryStore.journeys.find(item => item.id === id);
      if (j && j.status === 'DELAYED') j.status = 'ACTIVE';
    }

    await notificationService.createNotification({
      userId,
      journeyId: id,
      type: 'SAFETY_CONFIRMED',
      title: '✅ Safety Confirmed',
      message: 'You checked in as safe. Your family members have been notified.',
      metadata: { journeyId: id }
    });

    return res.json({ success: true, message: 'Safety check-in recorded. Thank you for confirming!' });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let journeys = [];
    let sosIncidents = [];

    if (memoryStore.isPostgresActive && prisma) {
      journeys = await prisma.journey.findMany({ where: { userId } });
      sosIncidents = await prisma.sOSIncident.findMany({ where: { userId } });
    } else {
      journeys = memoryStore.journeys.filter(j => j.userId === userId);
      sosIncidents = memoryStore.sosIncidents.filter(s => s.userId === userId);
    }

    const total = journeys.length;
    const completed = journeys.filter(j => j.status === 'COMPLETED').length;
    const delayed = journeys.filter(j => j.status === 'DELAYED').length;
    const sosCount = sosIncidents.length;

    // Type breakdown
    const typeMap = {};
    journeys.forEach(j => {
      const t = j.journeyType || 'CAB';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });

    const typeBreakdown = Object.keys(typeMap).map(name => ({
      name,
      count: typeMap[name]
    }));

    // Weekly/recent trend (last 7 days)
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { weekday: 'short' });
      trendMap[label] = { day: label, journeys: 0, completed: 0, alerts: 0 };
    }

    journeys.forEach(j => {
      const d = new Date(j.createdAt);
      const label = d.toLocaleDateString([], { weekday: 'short' });
      if (trendMap[label]) {
        trendMap[label].journeys += 1;
        if (j.status === 'COMPLETED') trendMap[label].completed += 1;
      }
    });

    return res.json({
      success: true,
      stats: {
        total,
        completed,
        delayed,
        sosCount,
        safetyScore: total > 0 ? Math.round((completed / total) * 100) : 100
      },
      typeBreakdown,
      trend: Object.values(trendMap)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startJourney,
  getActiveJourney,
  getJourneys,
  getJourneyById,
  trackJourneyByToken,
  updateEta,
  pauseJourney,
  resumeJourney,
  completeJourney,
  cancelJourney,
  confirmSafe,
  getAnalytics,
  startJourneySchema
};

