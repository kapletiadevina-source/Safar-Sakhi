const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phoneNumber: z.string().min(8, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  relationship: z.string().min(2, 'Relationship is required'),
  isPrimary: z.boolean().optional()
});

const getContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (memoryStore.isPostgresActive && prisma) {
      const contacts = await prisma.trustedContact.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
      });
      return res.json({ success: true, contacts });
    }

    const contacts = memoryStore.contacts
      .filter(c => c.userId === userId)
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

    return res.json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

const addContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phoneNumber, email, relationship, isPrimary } = req.body;

    if (memoryStore.isPostgresActive && prisma) {
      // If setting as primary, unset other primaries
      if (isPrimary) {
        await prisma.trustedContact.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      const contact = await prisma.trustedContact.create({
        data: {
          userId,
          name,
          phoneNumber,
          email: email || null,
          relationship,
          isPrimary: !!isPrimary,
          isVerified: true
        }
      });

      return res.status(201).json({ success: true, message: 'Trusted contact added.', contact });
    }

    if (isPrimary) {
      memoryStore.contacts.forEach(c => {
        if (c.userId === userId) c.isPrimary = false;
      });
    }

    const newContact = {
      id: `contact_${Date.now()}`,
      userId,
      name,
      phoneNumber,
      email: email || null,
      relationship,
      isPrimary: !!isPrimary,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.contacts.push(newContact);
    return res.status(201).json({ success: true, message: 'Trusted contact added.', contact: newContact });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, phoneNumber, email, relationship, isPrimary } = req.body;

    if (memoryStore.isPostgresActive && prisma) {
      if (isPrimary) {
        await prisma.trustedContact.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      const updated = await prisma.trustedContact.updateMany({
        where: { id, userId },
        data: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
          ...(email !== undefined && { email }),
          ...(relationship && { relationship }),
          ...(isPrimary !== undefined && { isPrimary })
        }
      });

      if (updated.count === 0) {
        return res.status(404).json({ success: false, message: 'Contact not found or unauthorized.' });
      }

      const contact = await prisma.trustedContact.findUnique({ where: { id } });
      return res.json({ success: true, message: 'Contact updated.', contact });
    }

    const contact = memoryStore.contacts.find(c => c.id === id && c.userId === userId);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found or unauthorized.' });
    }

    if (isPrimary) {
      memoryStore.contacts.forEach(c => {
        if (c.userId === userId) c.isPrimary = false;
      });
    }

    if (name) contact.name = name;
    if (phoneNumber) contact.phoneNumber = phoneNumber;
    if (email !== undefined) contact.email = email;
    if (relationship) contact.relationship = relationship;
    if (isPrimary !== undefined) contact.isPrimary = isPrimary;
    contact.updatedAt = new Date();

    return res.json({ success: true, message: 'Contact updated.', contact });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (memoryStore.isPostgresActive && prisma) {
      const deleted = await prisma.trustedContact.deleteMany({
        where: { id, userId }
      });

      if (deleted.count === 0) {
        return res.status(404).json({ success: false, message: 'Contact not found or unauthorized.' });
      }

      return res.json({ success: true, message: 'Contact removed successfully.' });
    }

    const index = memoryStore.contacts.findIndex(c => c.id === id && c.userId === userId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Contact not found or unauthorized.' });
    }

    memoryStore.contacts.splice(index, 1);
    return res.json({ success: true, message: 'Contact removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  contactSchema
};

