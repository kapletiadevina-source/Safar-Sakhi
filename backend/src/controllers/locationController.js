const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');

const locationSchema = z.object({
  journeyId: z.string().min(1, 'Journey ID is required'),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  accuracy: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  batteryLevel: z.number().optional().nullable(),
  timestamp: z.string().or(z.date()).optional()
});

const recordLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { journeyId, latitude, longitude, accuracy, speed, heading, batteryLevel, timestamp } = req.body;
    const locTime = timestamp ? new Date(timestamp) : new Date();

    let record = null;
    let trackingToken = null;

    if (memoryStore.isPostgresActive && prisma) {
      const journey = await prisma.journey.findUnique({
        where: { id: journeyId },
        select: { status: true, trackingToken: true, userId: true }
      });

      if (!journey || journey.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or invalid journey.' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
        return res.status(400).json({ success: false, message: 'Cannot record location for completed/cancelled journey.' });
      }

      trackingToken = journey.trackingToken;

      record = await prisma.journeyLocation.create({
        data: {
          journeyId,
          userId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : null,
          speed: speed ? parseFloat(speed) : null,
          heading: heading ? parseFloat(heading) : null,
          batteryLevel: batteryLevel ? parseFloat(batteryLevel) : null,
          timestamp: locTime
        }
      });
    } else {
      const journey = memoryStore.journeys.find(j => j.id === journeyId);
      if (!journey || journey.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized or invalid journey.' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(journey.status)) {
        return res.status(400).json({ success: false, message: 'Cannot record location for completed/cancelled journey.' });
      }

      trackingToken = journey.trackingToken;
      record = {
        id: `loc_${Date.now()}`,
        journeyId,
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        batteryLevel: batteryLevel ? parseFloat(batteryLevel) : null,
        timestamp: locTime
      };
      memoryStore.locations.push(record);
    }

    // Broadcast through socket if io instance is on req.app
    const io = req.app.get('io');
    if (io) {
      const payload = {
        journeyId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy,
        speed,
        timestamp: locTime
      };
      io.to(`journey_${journeyId}`).emit('location_updated', payload);
      if (trackingToken) {
        io.to(`tracking_${trackingToken}`).emit('location_updated', payload);
      }
    }

    return res.status(201).json({ success: true, location: record });
  } catch (error) {
    next(error);
  }
};

const getJourneyLocations = async (req, res, next) => {
  try {
    const { journeyId } = req.params;

    if (memoryStore.isPostgresActive && prisma) {
      const locations = await prisma.journeyLocation.findMany({
        where: { journeyId },
        orderBy: { timestamp: 'asc' }
      });
      return res.json({ success: true, locations });
    }

    const locations = memoryStore.locations
      .filter(l => l.journeyId === journeyId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({ success: true, locations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordLocation,
  getJourneyLocations,
  locationSchema
};

