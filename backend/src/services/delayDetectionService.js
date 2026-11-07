const { prisma, memoryStore } = require('../config/db');
const notificationService = require('./notificationService');

class DelayDetectionService {
  constructor() {
    this.io = null;
    this.intervalId = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  start(intervalMs = 30000) {
    if (this.intervalId) clearInterval(this.intervalId);
    console.log('⏱️ [DelayDetection] Delay monitor active (interval: 30s)');
    this.intervalId = setInterval(() => this.checkDelays(), intervalMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async checkDelays() {
    try {
      const now = new Date();

      if (memoryStore.isPostgresActive && prisma) {
        const delayedJourneys = await prisma.journey.findMany({
          where: {
            status: 'ACTIVE',
            expectedArrivalTime: { lt: now }
          }
        });

        for (const journey of delayedJourneys) {
          await prisma.journey.update({
            where: { id: journey.id },
            data: { status: 'DELAYED' }
          });

          await this.notifyDelay(journey);
        }
      } else {
        const delayedJourneys = memoryStore.journeys.filter(
          j => j.status === 'ACTIVE' && new Date(j.expectedArrivalTime) < now
        );

        for (const journey of delayedJourneys) {
          journey.status = 'DELAYED';
          await this.notifyDelay(journey);
        }
      }
    } catch (err) {
      console.error('[DelayDetection Error]', err.message);
    }
  }

  async notifyDelay(journey) {
    await notificationService.createNotification({
      userId: journey.userId,
      journeyId: journey.id,
      type: 'JOURNEY_DELAYED',
      title: '⏰ Expected Arrival Time Passed',
      message: `Your ETA for journey to "${journey.destination}" has passed. Please confirm if you are safe or update your ETA.`,
      metadata: { journeyId: journey.id, destination: journey.destination }
    });

    if (this.io) {
      const payload = {
        journeyId: journey.id,
        destination: journey.destination,
        expectedArrivalTime: journey.expectedArrivalTime,
        message: 'Your expected arrival time has passed. Are you safe?'
      };

      this.io.to(`user_${journey.userId}`).emit('journey_delayed', payload);
      this.io.to(`journey_${journey.id}`).emit('journey_delayed', payload);
    }
  }
}

module.exports = new DelayDetectionService();

