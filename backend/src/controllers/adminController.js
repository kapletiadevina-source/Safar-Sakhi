const { prisma, memoryStore } = require('../config/db');

const getAdminStats = async (req, res, next) => {
  try {
    if (memoryStore.isPostgresActive && prisma) {
      const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
      const activeJourneys = await prisma.journey.count({ where: { status: 'ACTIVE' } });
      const delayedJourneys = await prisma.journey.count({ where: { status: 'DELAYED' } });
      const completedJourneys = await prisma.journey.count({ where: { status: 'COMPLETED' } });
      const activeSOS = await prisma.sOSIncident.count({ where: { status: 'ACTIVE' } });
      const totalSOS = await prisma.sOSIncident.count();

      return res.json({
        success: true,
        stats: {
          totalUsers,
          activeJourneys,
          delayedJourneys,
          completedJourneys,
          activeSOS,
          totalSOS
        }
      });
    }

    const totalUsers = memoryStore.users.filter(u => u.role === 'USER').length;
    const activeJourneys = memoryStore.journeys.filter(j => j.status === 'ACTIVE').length;
    const delayedJourneys = memoryStore.journeys.filter(j => j.status === 'DELAYED').length;
    const completedJourneys = memoryStore.journeys.filter(j => j.status === 'COMPLETED').length;
    const activeSOS = memoryStore.sosIncidents.filter(s => s.status === 'ACTIVE').length;
    const totalSOS = memoryStore.sosIncidents.length;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeJourneys,
        delayedJourneys,
        completedJourneys,
        activeSOS,
        totalSOS
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    if (memoryStore.isPostgresActive && prisma) {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          _count: {
            select: { contacts: true, journeys: true, sosIncidents: true }
          }
        }
      });
      return res.json({ success: true, users });
    }

    const users = memoryStore.users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role,
      createdAt: u.createdAt,
      _count: {
        contacts: memoryStore.contacts.filter(c => c.userId === u.id).length,
        journeys: memoryStore.journeys.filter(j => j.userId === u.id).length,
        sosIncidents: memoryStore.sosIncidents.filter(s => s.userId === u.id).length
      }
    }));

    return res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const getAdminIncidents = async (req, res, next) => {
  try {
    if (memoryStore.isPostgresActive && prisma) {
      const incidents = await prisma.sOSIncident.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { fullName: true, phoneNumber: true, email: true }
          },
          journey: {
            select: { startLocation: true, destination: true, trackingToken: true }
          }
        }
      });
      return res.json({ success: true, incidents });
    }

    const incidents = memoryStore.sosIncidents
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(s => {
        const u = memoryStore.users.find(user => user.id === s.userId);
        const j = memoryStore.journeys.find(journey => journey.id === s.journeyId);
        return {
          ...s,
          user: u ? { fullName: u.fullName, phoneNumber: u.phoneNumber, email: u.email } : null,
          journey: j ? { startLocation: j.startLocation, destination: j.destination, trackingToken: j.trackingToken } : null
        };
      });

    return res.json({ success: true, incidents });
  } catch (error) {
    next(error);
  }
};

const resolveAdminIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const now = new Date();

    if (memoryStore.isPostgresActive && prisma) {
      await prisma.sOSIncident.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          resolutionNotes: resolutionNotes || 'Resolved by administrator'
        }
      });
    } else {
      const inc = memoryStore.sosIncidents.find(s => s.id === id);
      if (inc) {
        inc.status = 'RESOLVED';
        inc.resolvedAt = now;
        inc.resolutionNotes = resolutionNotes || 'Resolved by administrator';
      }
    }

    return res.json({ success: true, message: 'Incident resolved successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminIncidents,
  resolveAdminIncident
};

