const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');

const inviteSchema = z.object({
  email: z.string().email('Valid family email required'),
  name: z.string().min(2, 'Name is required'),
  relationship: z.string().min(2, 'Relationship is required')
});

const connectSchema = z.object({
  travelerEmail: z.string().email().optional(),
  invitationCode: z.string().optional()
});

const getFamilyConnections = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (memoryStore.isPostgresActive && prisma) {
      if (role === 'FAMILY') {
        // Return travelers connected to this family member
        const connections = await prisma.familyConnection.findMany({
          where: {
            OR: [
              { familyMemberId: userId },
              { email: req.user.email }
            ]
          },
          include: {
            traveler: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                profile: true
              }
            }
          }
        });
        return res.json({ success: true, connections });
      } else {
        // Return family members connected to this traveler
        const connections = await prisma.familyConnection.findMany({
          where: { travelerId: userId },
          include: {
            familyMember: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                profile: true
              }
            }
          }
        });
        return res.json({ success: true, connections });
      }
    }

    // In-memory fallback
    if (role === 'FAMILY') {
      const connections = memoryStore.familyConnections
        .filter(c => c.familyMemberId === userId || c.email.toLowerCase() === req.user.email.toLowerCase())
        .map(c => {
          const traveler = memoryStore.users.find(u => u.id === c.travelerId);
          const profile = traveler ? memoryStore.profiles.find(p => p.userId === traveler.id) : null;
          return {
            ...c,
            traveler: traveler ? { id: traveler.id, fullName: traveler.fullName, phoneNumber: traveler.phoneNumber, email: traveler.email, profile } : null
          };
        });
      return res.json({ success: true, connections });
    } else {
      const connections = memoryStore.familyConnections
        .filter(c => c.travelerId === userId)
        .map(c => {
          const fm = c.familyMemberId ? memoryStore.users.find(u => u.id === c.familyMemberId) : null;
          const profile = fm ? memoryStore.profiles.find(p => p.userId === fm.id) : null;
          return {
            ...c,
            familyMember: fm ? { id: fm.id, fullName: fm.fullName, phoneNumber: fm.phoneNumber, email: fm.email, profile } : null
          };
        });
      return res.json({ success: true, connections });
    }
  } catch (error) {
    next(error);
  }
};

const inviteFamilyMember = async (req, res, next) => {
  try {
    const travelerId = req.user.id;
    const { email, name, relationship } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const invitationCode = `invite-${Math.random().toString(36).substring(2, 9)}`;

    if (memoryStore.isPostgresActive && prisma) {
      // Check if family user already has account
      const existingFamilyUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      const connection = await prisma.familyConnection.create({
        data: {
          travelerId,
          email: normalizedEmail,
          name,
          relationship,
          familyMemberId: existingFamilyUser ? existingFamilyUser.id : null,
          status: 'ACCEPTED',
          invitationCode
        }
      });

      return res.status(201).json({
        success: true,
        message: `Family connection for ${name} (${relationship}) created successfully.`,
        connection
      });
    }

    // In-memory
    const existingFamilyUser = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    const newConn = {
      id: `conn_${Date.now()}`,
      travelerId,
      familyMemberId: existingFamilyUser ? existingFamilyUser.id : null,
      email: normalizedEmail,
      name,
      relationship,
      status: 'ACCEPTED',
      invitationCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.familyConnections.push(newConn);

    return res.status(201).json({
      success: true,
      message: `Family connection for ${name} (${relationship}) created successfully.`,
      connection: newConn
    });
  } catch (error) {
    next(error);
  }
};

const connectToTraveler = async (req, res, next) => {
  try {
    const familyMemberId = req.user.id;
    const familyEmail = req.user.email.toLowerCase();
    const { travelerEmail, invitationCode } = req.body;

    if (memoryStore.isPostgresActive && prisma) {
      let connection = null;

      if (invitationCode) {
        connection = await prisma.familyConnection.findUnique({
          where: { invitationCode }
        });
      } else if (travelerEmail) {
        const traveler = await prisma.user.findUnique({
          where: { email: travelerEmail.toLowerCase().trim() }
        });
        if (traveler) {
          connection = await prisma.familyConnection.findFirst({
            where: {
              travelerId: traveler.id,
              OR: [
                { email: familyEmail },
                { familyMemberId }
              ]
            }
          });

          // If no pre-invite, auto-create connection
          if (!connection) {
            connection = await prisma.familyConnection.create({
              data: {
                travelerId: traveler.id,
                familyMemberId,
                email: familyEmail,
                name: req.user.fullName || 'Family Guardian',
                relationship: 'Family Guardian',
                status: 'ACCEPTED'
              }
            });
          }
        }
      }

      if (!connection) {
        return res.status(404).json({ success: false, message: 'Could not find traveler matching details.' });
      }

      await prisma.familyConnection.update({
        where: { id: connection.id },
        data: { familyMemberId, status: 'ACCEPTED' }
      });

      return res.json({ success: true, message: 'Successfully connected with traveler!' });
    }

    // In-memory
    let conn = null;
    if (invitationCode) {
      conn = memoryStore.familyConnections.find(c => c.invitationCode === invitationCode);
    } else if (travelerEmail) {
      const traveler = memoryStore.users.find(u => u.email.toLowerCase() === travelerEmail.toLowerCase().trim());
      if (traveler) {
        conn = memoryStore.familyConnections.find(c => c.travelerId === traveler.id && (c.email.toLowerCase() === familyEmail || c.familyMemberId === familyMemberId));
        if (!conn) {
          conn = {
            id: `conn_${Date.now()}`,
            travelerId: traveler.id,
            familyMemberId,
            email: familyEmail,
            name: req.user.fullName || 'Family Guardian',
            relationship: 'Family Guardian',
            status: 'ACCEPTED',
            invitationCode: `invite-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          memoryStore.familyConnections.push(conn);
        }
      }
    }

    if (!conn) {
      return res.status(404).json({ success: false, message: 'Could not find traveler matching details.' });
    }

    conn.familyMemberId = familyMemberId;
    conn.status = 'ACCEPTED';

    return res.json({ success: true, message: 'Successfully connected with traveler!' });
  } catch (error) {
    next(error);
  }
};

// Family member gets journeys shared with them
const getSharedJourneys = async (req, res, next) => {
  try {
    const familyUserId = req.user.id;
    const familyEmail = req.user.email.toLowerCase();

    // 1. Get all connected travelers
    let travelerIds = [];

    if (memoryStore.isPostgresActive && prisma) {
      const connections = await prisma.familyConnection.findMany({
        where: {
          OR: [
            { familyMemberId: familyUserId },
            { email: familyEmail }
          ],
          status: 'ACCEPTED'
        },
        select: { travelerId: true }
      });
      travelerIds = connections.map(c => c.travelerId);

      // Find journeys by these travelers
      const journeys = await prisma.journey.findMany({
        where: {
          userId: { in: travelerIds }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { fullName: true, phoneNumber: true, email: true, profile: true }
          },
          locations: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          sosIncidents: {
            where: { status: 'ACTIVE' }
          },
          safetyConfirmations: {
            orderBy: { confirmedAt: 'desc' },
            take: 3
          }
        }
      });

      // Filter: only journeys explicitly shared with this family member
      const authorizedJourneys = journeys.filter(j => {
        if (!j.sharedFamilyIds) return false;
        try {
          const ids = typeof j.sharedFamilyIds === 'string' ? JSON.parse(j.sharedFamilyIds) : j.sharedFamilyIds;
          return Array.isArray(ids) && ids.includes(familyUserId);
        } catch {
          return false;
        }
      });

      return res.json({ success: true, journeys: authorizedJourneys });
    }

    // In-memory
    const conns = memoryStore.familyConnections.filter(c => 
      (c.familyMemberId === familyUserId || c.email.toLowerCase() === familyEmail) && c.status === 'ACCEPTED'
    );
    travelerIds = conns.map(c => c.travelerId);

    const journeys = memoryStore.journeys
      .filter(j => travelerIds.includes(j.userId))
      .filter(j => {
        if (!j.sharedFamilyIds) return false;
        try {
          const ids = typeof j.sharedFamilyIds === 'string' ? JSON.parse(j.sharedFamilyIds) : j.sharedFamilyIds;
          return Array.isArray(ids) && ids.includes(familyUserId);
        } catch {
          return false;
        }
      })
      .map(j => {
        const traveler = memoryStore.users.find(u => u.id === j.userId);
        const profile = traveler ? memoryStore.profiles.find(p => p.userId === traveler.id) : null;
        const locations = memoryStore.locations
          .filter(l => l.journeyId === j.id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 20);
        const sosIncidents = memoryStore.sosIncidents.filter(s => s.journeyId === j.id && s.status === 'ACTIVE');
        const safetyConfirmations = memoryStore.confirmations
          .filter(c => c.journeyId === j.id)
          .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
          .slice(0, 3);

        return {
          ...j,
          user: traveler ? { fullName: traveler.fullName, phoneNumber: traveler.phoneNumber, email: traveler.email, profile } : null,
          locations,
          sosIncidents,
          safetyConfirmations
        };
      });

    return res.json({ success: true, journeys });
  } catch (error) {
    next(error);
  }
};

const getSharedJourneyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const familyUserId = req.user.id;
    const familyEmail = req.user.email.toLowerCase();

    let journey = null;

    if (memoryStore.isPostgresActive && prisma) {
      journey = await prisma.journey.findUnique({
        where: { id },
        include: {
          user: {
            select: { fullName: true, phoneNumber: true, email: true, profile: true }
          },
          locations: {
            orderBy: { timestamp: 'asc' }
          },
          sosIncidents: true,
          safetyConfirmations: {
            orderBy: { confirmedAt: 'desc' }
          }
        }
      });

      if (!journey) {
        return res.status(404).json({ success: false, message: 'Journey not found.' });
      }

      // Verify connection authorization
      const connection = await prisma.familyConnection.findFirst({
        where: {
          travelerId: journey.userId,
          OR: [
            { familyMemberId: familyUserId },
            { email: familyEmail }
          ],
          status: 'ACCEPTED'
        }
      });

      if (!connection) {
        return res.status(403).json({ success: false, message: 'You do not have authorization to view this private journey.' });
      }

      // Verify explicit sharing authorization
      let allowedIds = [];
      if (journey.sharedFamilyIds) {
        try {
          allowedIds = typeof journey.sharedFamilyIds === 'string' ? JSON.parse(journey.sharedFamilyIds) : journey.sharedFamilyIds;
        } catch {
          allowedIds = [];
        }
      }

      if (!Array.isArray(allowedIds) || !allowedIds.includes(familyUserId)) {
        return res.status(403).json({ success: false, message: 'This journey has not been shared with your family account.' });
      }

      return res.json({ success: true, journey });
    }

    // In-memory
    const j = memoryStore.journeys.find(item => item.id === id);
    if (!j) {
      return res.status(404).json({ success: false, message: 'Journey not found.' });
    }

    const conn = memoryStore.familyConnections.find(c => 
      c.travelerId === j.userId && 
      (c.familyMemberId === familyUserId || c.email.toLowerCase() === familyEmail) &&
      c.status === 'ACCEPTED'
    );

    if (!conn) {
      return res.status(403).json({ success: false, message: 'You do not have authorization to view this private journey.' });
    }

    // Verify explicit sharing authorization
    let allowedIds = [];
    if (j.sharedFamilyIds) {
      try {
        allowedIds = typeof j.sharedFamilyIds === 'string' ? JSON.parse(j.sharedFamilyIds) : j.sharedFamilyIds;
      } catch {
        allowedIds = [];
      }
    }

    if (!Array.isArray(allowedIds) || !allowedIds.includes(familyUserId)) {
      return res.status(403).json({ success: false, message: 'This journey has not been shared with your family account.' });
    }

    const traveler = memoryStore.users.find(u => u.id === j.userId);
    const profile = traveler ? memoryStore.profiles.find(p => p.userId === traveler.id) : null;
    const locations = memoryStore.locations
      .filter(l => l.journeyId === id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const sosIncidents = memoryStore.sosIncidents.filter(s => s.journeyId === id);
    const safetyConfirmations = memoryStore.confirmations
      .filter(c => c.journeyId === id)
      .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt));

    journey = {
      ...j,
      user: traveler ? { fullName: traveler.fullName, phoneNumber: traveler.phoneNumber, email: traveler.email, profile } : null,
      locations,
      sosIncidents,
      safetyConfirmations
    };

    return res.json({ success: true, journey });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFamilyConnections,
  inviteFamilyMember,
  connectToTraveler,
  getSharedJourneys,
  getSharedJourneyById,
  inviteSchema,
  connectSchema
};
