const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma, memoryStore } = require('../config/db');
const { generateToken } = require('../utils/token');

// Schemas
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
  role: z.enum(['USER', 'FAMILY', 'ADMIN']).default('USER'),
  emergencyNotes: z.string().optional(),
  homeAddress: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().min(8).optional(),
  avatar: z.string().optional(),
  emergencyNotes: z.string().optional(),
  bloodGroup: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
  homeLatitude: z.number().optional(),
  homeLongitude: z.number().optional()
});

const settingsUpdateSchema = z.object({
  emergencyPhrase: z.string().min(2).optional(),
  voiceTriggerEnabled: z.boolean().optional(),
  voiceFeedbackEnabled: z.boolean().optional(),
  delayGracePeriodMinutes: z.number().min(1).max(60).optional(),
  locationIntervalMinutes: z.number().min(1).max(30).optional(),
  shareWithAllContacts: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  smsNotificationsEnabled: z.boolean().optional()
});

// Controllers
const register = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, password, role = 'USER', emergencyNotes, homeAddress } = req.body;

    // Check if user already exists
    if (memoryStore.isPostgresActive && prisma) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          phoneNumber,
          password: hashedPassword,
          role: role || 'USER',
          profile: {
            create: {
              emergencyNotes: emergencyNotes || (role === 'FAMILY' ? 'Family Member Guardian' : ''),
              homeAddress: homeAddress || ''
            }
          },
          settings: {
            create: {
              emergencyPhrase: 'Sakhi Help',
              voiceTriggerEnabled: true,
              voiceFeedbackEnabled: true
            }
          }
        },
        include: { profile: true, settings: true }
      });

      // Link any pending family connections by email
      await prisma.familyConnection.updateMany({
        where: { email },
        data: { familyMemberId: user.id, status: 'ACCEPTED' }
      });

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const { password: _, ...userSafe } = user;

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to Safar Sakhi.',
        token,
        user: userSafe
      });
    }

    // In-memory fallback
    const exists = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newProfile = {
      id: `profile_${userId}`,
      userId,
      avatar: role === 'FAMILY' 
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      emergencyNotes: emergencyNotes || (role === 'FAMILY' ? 'Family Member Guardian' : ''),
      bloodGroup: 'B+',
      homeAddress: homeAddress || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newSettings = {
      id: `settings_${userId}`,
      userId,
      emergencyPhrase: 'Sakhi Help',
      voiceTriggerEnabled: true,
      voiceFeedbackEnabled: true,
      delayGracePeriodMinutes: 5,
      locationIntervalMinutes: 5,
      shareWithAllContacts: true,
      pushNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.users.push(newUser);
    memoryStore.profiles.push(newProfile);
    memoryStore.settings.push(newSettings);

    // Link any pending family connections by email
    memoryStore.familyConnections.forEach(fc => {
      if (fc.email.toLowerCase() === email.toLowerCase()) {
        fc.familyMemberId = userId;
        fc.status = 'ACCEPTED';
      }
    });

    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    const { password: _, ...userSafe } = newUser;
    userSafe.profile = newProfile;
    userSafe.settings = newSettings;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Safar Sakhi.',
      token,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = null;
    let profile = null;
    let settings = null;

    if (memoryStore.isPostgresActive && prisma) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true, settings: true }
      });
    } else {
      user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        profile = memoryStore.profiles.find(p => p.userId === user.id) || null;
        settings = memoryStore.settings.find(s => s.userId === user.id) || null;
        user = { ...user, profile, settings };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { password: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth Supabase Callback Controller
const googleCallback = async (req, res, next) => {
  try {
    const { email, fullName, avatar, role = 'USER', supabaseId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required from Google profile.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (memoryStore.isPostgresActive && prisma) {
      // 1. Look up user by authenticated Supabase ID first, or by normalized email
      if (supabaseId) {
        user = await prisma.user.findUnique({
          where: { id: supabaseId },
          include: { profile: true, settings: true }
        });
      }

      if (!user && normalizedEmail) {
        user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { profile: true, settings: true }
        });
      }

      if (user) {
        // 2. Existing user: PRESERVE existing database role (Traveler, Family, or Admin).
        // NEVER overwrite role on re-login to prevent privilege tampering or unintended role reset.
        if (fullName && fullName.trim() && fullName.trim() !== user.fullName) {
          await prisma.user.update({
            where: { id: user.id },
            data: { fullName: fullName.trim() }
          });
          user.fullName = fullName.trim();
        }

        // Save or update UserProfile with Google avatar
        if (user.profile) {
          if (avatar && avatar !== user.profile.avatar) {
            const updatedProfile = await prisma.userProfile.update({
              where: { userId: user.id },
              data: { avatar }
            });
            user.profile = updatedProfile;
          }
        } else {
          const newProfile = await prisma.userProfile.create({
            data: {
              userId: user.id,
              avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              emergencyNotes: user.role === 'FAMILY' ? 'Family Member Guardian' : 'Google Authenticated Traveler'
            }
          });
          user.profile = newProfile;
        }

        // Ensure user settings exist
        if (!user.settings) {
          const newSettings = await prisma.userSettings.create({
            data: {
              userId: user.id,
              emergencyPhrase: 'Sakhi Help',
              voiceTriggerEnabled: true,
              voiceFeedbackEnabled: true
            }
          });
          user.settings = newSettings;
        }
      } else {
        // 3. New User: Use authenticated Supabase user ID as unique identifier
        const targetId = supabaseId || crypto.randomUUID();
        // Preserve role selection (Traveler or Family), but NEVER assign Admin privileges automatically
        const safeRole = role === 'FAMILY' ? 'FAMILY' : 'USER';
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.user.create({
          data: {
            id: targetId,
            email: normalizedEmail,
            fullName: fullName?.trim() || normalizedEmail.split('@')[0],
            phoneNumber: '+91 00000 00000',
            password: hashedPassword,
            role: safeRole,
            profile: {
              create: {
                avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                emergencyNotes: safeRole === 'FAMILY' ? 'Family Member Guardian' : 'Google Authenticated Traveler'
              }
            },
            settings: {
              create: {
                emergencyPhrase: 'Sakhi Help',
                voiceTriggerEnabled: true,
                voiceFeedbackEnabled: true
              }
            }
          },
          include: { profile: true, settings: true }
        });

        // Link pending family connections
        await prisma.familyConnection.updateMany({
          where: { email: normalizedEmail },
          data: { familyMemberId: user.id, status: 'ACCEPTED' }
        });
      }
    } else {
      // Memory Store logic for development / fallback mode
      if (supabaseId) {
        user = memoryStore.users.find(u => u.id === supabaseId);
      }
      if (!user && normalizedEmail) {
        user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      }

      if (user) {
        // Existing user: preserve role, update details
        if (fullName && fullName.trim()) user.fullName = fullName.trim();
        let profile = memoryStore.profiles.find(p => p.userId === user.id);
        if (profile) {
          if (avatar) profile.avatar = avatar;
        } else {
          profile = {
            id: `profile_${user.id}`,
            userId: user.id,
            avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            emergencyNotes: user.role === 'FAMILY' ? 'Family Member Guardian' : 'Google Authenticated Traveler',
            bloodGroup: 'B+',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          memoryStore.profiles.push(profile);
        }

        let settings = memoryStore.settings.find(s => s.userId === user.id);
        if (!settings) {
          settings = {
            id: `settings_${user.id}`,
            userId: user.id,
            emergencyPhrase: 'Sakhi Help',
            voiceTriggerEnabled: true,
            voiceFeedbackEnabled: true,
            delayGracePeriodMinutes: 5,
            locationIntervalMinutes: 5,
            shareWithAllContacts: true,
            pushNotificationsEnabled: true,
            smsNotificationsEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          memoryStore.settings.push(settings);
        }

        user = { ...user, profile, settings };
      } else {
        // New user: use supabaseId as unique identifier
        const targetId = supabaseId || `user_${Date.now()}`;
        const safeRole = role === 'FAMILY' ? 'FAMILY' : 'USER';

        user = {
          id: targetId,
          email: normalizedEmail,
          fullName: fullName?.trim() || normalizedEmail.split('@')[0],
          phoneNumber: '+91 00000 00000',
          password: 'google_oauth_auth',
          role: safeRole,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const profile = {
          id: `profile_${targetId}`,
          userId: targetId,
          avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          emergencyNotes: safeRole === 'FAMILY' ? 'Family Member Guardian' : 'Google Authenticated Traveler',
          bloodGroup: 'B+',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const settings = {
          id: `settings_${targetId}`,
          userId: targetId,
          emergencyPhrase: 'Sakhi Help',
          voiceTriggerEnabled: true,
          voiceFeedbackEnabled: true,
          delayGracePeriodMinutes: 5,
          locationIntervalMinutes: 5,
          shareWithAllContacts: true,
          pushNotificationsEnabled: true,
          smsNotificationsEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        memoryStore.users.push(user);
        memoryStore.profiles.push(profile);
        memoryStore.settings.push(settings);

        user = { ...user, profile, settings };

        // Link pending family connections
        memoryStore.familyConnections.forEach(fc => {
          if (fc.email.toLowerCase() === normalizedEmail) {
            fc.familyMemberId = targetId;
            fc.status = 'ACCEPTED';
          }
        });
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { password: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Google authentication successful.',
      token,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = null;

    if (memoryStore.isPostgresActive && prisma) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, settings: true, contacts: true }
      });
    } else {
      const u = memoryStore.users.find(item => item.id === userId);
      if (u) {
        const profile = memoryStore.profiles.find(p => p.userId === userId) || null;
        const settings = memoryStore.settings.find(s => s.userId === userId) || null;
        const contacts = memoryStore.contacts.filter(c => c.userId === userId) || [];
        user = { ...u, profile, settings, contacts };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, avatar, emergencyNotes, bloodGroup, homeAddress, workAddress } = req.body;

    if (memoryStore.isPostgresActive && prisma) {
      if (fullName || phoneNumber) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(fullName && { fullName }),
            ...(phoneNumber && { phoneNumber })
          }
        });
      }

      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...(avatar !== undefined && { avatar }),
          ...(emergencyNotes !== undefined && { emergencyNotes }),
          ...(bloodGroup !== undefined && { bloodGroup }),
          ...(homeAddress !== undefined && { homeAddress }),
          ...(workAddress !== undefined && { workAddress })
        },
        create: {
          userId,
          avatar,
          emergencyNotes,
          bloodGroup,
          homeAddress,
          workAddress
        }
      });

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, settings: true }
      });
      const { password: _, ...userSafe } = updated;
      return res.json({ success: true, message: 'Profile updated successfully.', user: userSafe });
    }

    // In-memory fallback
    const u = memoryStore.users.find(item => item.id === userId);
    if (u) {
      if (fullName) u.fullName = fullName;
      if (phoneNumber) u.phoneNumber = phoneNumber;
    }

    let p = memoryStore.profiles.find(item => item.userId === userId);
    if (!p) {
      p = { id: `profile_${userId}`, userId, createdAt: new Date() };
      memoryStore.profiles.push(p);
    }
    if (avatar !== undefined) p.avatar = avatar;
    if (emergencyNotes !== undefined) p.emergencyNotes = emergencyNotes;
    if (bloodGroup !== undefined) p.bloodGroup = bloodGroup;
    if (homeAddress !== undefined) p.homeAddress = homeAddress;
    if (workAddress !== undefined) p.workAddress = workAddress;
    p.updatedAt = new Date();

    const settings = memoryStore.settings.find(s => s.userId === userId);
    const { password: _, ...userSafe } = { ...u, profile: p, settings };

    return res.json({ success: true, message: 'Profile updated successfully.', user: userSafe });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    if (memoryStore.isPostgresActive && prisma) {
      const updated = await prisma.userSettings.upsert({
        where: { userId },
        update: settingsData,
        create: { userId, ...settingsData }
      });
      return res.json({ success: true, message: 'Settings saved.', settings: updated });
    }

    let s = memoryStore.settings.find(item => item.userId === userId);
    if (!s) {
      s = { id: `settings_${userId}`, userId, createdAt: new Date(), ...settingsData };
      memoryStore.settings.push(s);
    } else {
      Object.assign(s, settingsData, { updatedAt: new Date() });
    }

    return res.json({ success: true, message: 'Settings saved.', settings: s });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  return res.json({
    success: true,
    message: `If an account exists for ${email}, a password reset verification link has been sent.`
  });
};

module.exports = {
  register,
  login,
  googleCallback,
  logout,
  getMe,
  updateProfile,
  updateSettings,
  forgotPassword,
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  settingsUpdateSchema
};
