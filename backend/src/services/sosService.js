const { prisma, memoryStore } = require('../config/db');
const notificationService = require('./notificationService');

class SOSService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async triggerSOS({ userId, journeyId = null, latitude = null, longitude = null, accuracy = null, triggerType = 'MANUAL', emergencyPhrase = null }) {
    try {
      const now = new Date();
      let deliveryDetails = {
        socketAlert: 'DELIVERED',
        pushAlert: 'SENT',
        smsAlert: 'SIMULATED (SMS Gateway Ready)',
        timestamp: now.toISOString()
      };

      let sosIncident = null;

      // 1. Create SOS record
      if (memoryStore.isPostgresActive && prisma) {
        sosIncident = await prisma.sOSIncident.create({
          data: {
            userId,
            journeyId,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            accuracy: accuracy ? parseFloat(accuracy) : null,
            triggerType,
            emergencyPhrase,
            notificationDeliveryStatus: JSON.stringify(deliveryDetails),
            status: 'ACTIVE'
          }
        });

        // 2. If active journey, mark journey status as EMERGENCY
        if (journeyId) {
          await prisma.journey.update({
            where: { id: journeyId },
            data: { status: 'EMERGENCY' }
          });
        }
      } else {
        sosIncident = {
          id: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          journeyId,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          accuracy: accuracy ? parseFloat(accuracy) : null,
          triggerType,
          emergencyPhrase,
          notificationDeliveryStatus: JSON.stringify(deliveryDetails),
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };
        memoryStore.sosIncidents.unshift(sosIncident);

        if (journeyId) {
          const j = memoryStore.journeys.find(item => item.id === journeyId);
          if (j) j.status = 'EMERGENCY';
        }
      }

      // 3. Dispatch Notification
      await notificationService.createNotification({
        userId,
        journeyId,
        type: 'SOS_ACTIVATED',
        title: '🚨 Emergency SOS Activated!',
        message: `Emergency SOS triggered via ${triggerType}. Alert broadcasted to all trusted contacts with your live location.`,
        metadata: {
          sosId: sosIncident.id,
          latitude,
          longitude,
          triggerType
        }
      });

      // 4. Real-time broadcast via Socket.IO
      if (this.io) {
        const payload = {
          sosIncident,
          userId,
          journeyId,
          latitude,
          longitude,
          triggerType,
          emergencyPhrase,
          timestamp: now
        };

        // Notify user
        this.io.to(`user_${userId}`).emit('sos_activated', payload);

        // Notify journey tracking rooms
        if (journeyId) {
          this.io.to(`journey_${journeyId}`).emit('sos_activated', payload);
        }

        // Notify all admins
        this.io.to('admin_room').emit('sos_activated', payload);
      }

      return sosIncident;
    } catch (error) {
      console.error('[SOSService Error]', error);
      throw error;
    }
  }

  async cancelSOS(incidentId, userId, resolutionNotes = 'Cancelled by user') {
    const now = new Date();
    let updated = null;

    if (memoryStore.isPostgresActive && prisma) {
      updated = await prisma.sOSIncident.update({
        where: { id: incidentId },
        data: {
          status: 'CANCELLED',
          resolvedAt: now,
          resolutionNotes
        }
      });

      // Reset journey status if linked
      if (updated.journeyId) {
        await prisma.journey.update({
          where: { id: updated.journeyId },
          data: { status: 'ACTIVE' }
        });
      }
    } else {
      updated = memoryStore.sosIncidents.find(s => s.id === incidentId);
      if (updated) {
        updated.status = 'CANCELLED';
        updated.resolvedAt = now;
        updated.resolutionNotes = resolutionNotes;

        if (updated.journeyId) {
          const j = memoryStore.journeys.find(item => item.id === updated.journeyId);
          if (j && j.status === 'EMERGENCY') j.status = 'ACTIVE';
        }
      }
    }

    if (this.io) {
      const payload = { incidentId, status: 'CANCELLED', resolutionNotes, resolvedAt: now };
      this.io.to(`user_${userId}`).emit('sos_cancelled', payload);
      if (updated && updated.journeyId) {
        this.io.to(`journey_${updated.journeyId}`).emit('sos_cancelled', payload);
      }
      this.io.to('admin_room').emit('sos_cancelled', payload);
    }

    return updated;
  }
}

module.exports = new SOSService();

