const { prisma, memoryStore } = require('../config/db');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async createNotification({ userId, journeyId = null, type, title, message, metadata = {} }) {
    try {
      let notification = null;
      const metadataStr = typeof metadata === 'object' ? JSON.stringify(metadata) : metadata;

      if (memoryStore.isPostgresActive && prisma) {
        notification = await prisma.notification.create({
          data: {
            userId,
            journeyId,
            type,
            title,
            message,
            metadata: metadataStr,
            isRead: false
          }
        });
      } else {
        notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          journeyId,
          type,
          title,
          message,
          metadata: metadataStr,
          isRead: false,
          createdAt: new Date()
        };
        memoryStore.notifications.unshift(notification);
      }

      // Emit to real-time socket room if available
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification_received', {
          notification,
          timestamp: new Date()
        });
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService Error]', error.message);
      return null;
    }
  }

  async getUserNotifications(userId, limit = 50) {
    if (memoryStore.isPostgresActive && prisma) {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    return memoryStore.notifications
      .filter(n => n.userId === userId)
      .slice(0, limit);
  }

  async markAsRead(notificationId, userId) {
    if (memoryStore.isPostgresActive && prisma) {
      return await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true }
      });
    }

    const notif = memoryStore.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.isRead = true;
    }
    return { count: notif ? 1 : 0 };
  }

  async markAllAsRead(userId) {
    if (memoryStore.isPostgresActive && prisma) {
      return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    }

    memoryStore.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    return { count: memoryStore.notifications.filter(n => n.userId === userId).length };
  }
}

module.exports = new NotificationService();

