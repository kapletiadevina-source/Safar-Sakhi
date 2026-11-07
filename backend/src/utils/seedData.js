const bcrypt = require('bcryptjs');

function getInitialSeedData() {
  const hashedPassword = bcrypt.hashSync('Password@123', 10);
  const hashedAdminPassword = bcrypt.hashSync('Admin@123', 10);

  const adminUser = {
    id: 'user_admin_001',
    email: 'admin@safarsakhi.com',
    password: hashedAdminPassword,
    fullName: 'Ananya Sharma (Admin)',
    phoneNumber: '+91 98765 43210',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminProfile = {
    id: 'profile_admin_001',
    userId: adminUser.id,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    emergencyNotes: 'Authorized System Administrator',
    bloodGroup: 'O+',
    homeAddress: 'Sector 62, Noida, Uttar Pradesh',
    workAddress: 'Tech Boulevard, Noida',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const demoUser = {
    id: 'user_priya_001',
    email: 'priya@safarsakhi.com',
    password: hashedPassword,
    fullName: 'Priya Patel',
    phoneNumber: '+91 91234 56789',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const demoProfile = {
    id: 'profile_priya_001',
    userId: demoUser.id,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    emergencyNotes: 'Asthmatic, carries inhaler. Speaks Hindi and English.',
    bloodGroup: 'B+',
    homeAddress: 'B-402, Lotus Greens, Indirapuram, Ghaziabad',
    homeLatitude: 28.6369,
    homeLongitude: 77.3697,
    workAddress: 'Cyber City, DLF Phase 2, Gurugram',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const demoSettings = {
    id: 'settings_priya_001',
    userId: demoUser.id,
    emergencyPhrase: 'Sakhi Help',
    voiceTriggerEnabled: true,
    voiceFeedbackEnabled: true,
    delayGracePeriodMinutes: 5,
    locationIntervalMinutes: 5,
    shareWithAllContacts: true,
    pushNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Demo Family Member Account
  const demoFamilyUser = {
    id: 'user_family_sunita_001',
    email: 'sunita@safarsakhi.com',
    password: hashedPassword,
    fullName: 'Sunita Patel (Mother)',
    phoneNumber: '+91 98200 11223',
    role: 'FAMILY',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const demoFamilyProfile = {
    id: 'profile_family_sunita_001',
    userId: demoFamilyUser.id,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    emergencyNotes: 'Family Guardian / Mother of Priya Patel',
    bloodGroup: 'B+',
    homeAddress: 'Indirapuram, Ghaziabad',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Relationship between Priya (USER) and Sunita (FAMILY)
  const demoFamilyConnections = [
    {
      id: 'conn_priya_sunita_001',
      travelerId: demoUser.id,
      familyMemberId: demoFamilyUser.id,
      email: demoFamilyUser.email,
      name: 'Sunita Patel',
      relationship: 'Mother',
      status: 'ACCEPTED',
      invitationCode: 'invite-priya-sunita',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  const demoContacts = [
    {
      id: 'contact_001',
      userId: demoUser.id,
      name: 'Sunita Patel',
      phoneNumber: '+91 98200 11223',
      email: 'sunita@safarsakhi.com',
      relationship: 'Mother',
      isPrimary: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'contact_002',
      userId: demoUser.id,
      name: 'Rohan Patel',
      phoneNumber: '+91 98111 22334',
      email: 'rohan.patel@example.com',
      relationship: 'Brother',
      isPrimary: false,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'contact_003',
      userId: demoUser.id,
      name: 'Aarav Mehta',
      phoneNumber: '+91 99333 44556',
      email: 'aarav.mehta@example.com',
      relationship: 'Spouse/Partner',
      isPrimary: false,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  const demoJourneys = [
    {
      id: 'journey_demo_001',
      userId: demoUser.id,
      title: 'Commute from Cyber City to Home',
      startLocation: 'Cyber City, Gurugram',
      startLatitude: 28.4950,
      startLongitude: 77.0895,
      destination: 'Lotus Greens, Indirapuram',
      destinationLatitude: 28.6369,
      destinationLongitude: 77.3697,
      startTime: new Date(Date.now() - 3600000 * 2),
      endTime: new Date(Date.now() - 3600000 * 1),
      expectedArrivalTime: new Date(Date.now() - 3600000 * 1),
      originalEta: new Date(Date.now() - 3600000 * 1),
      status: 'COMPLETED',
      journeyType: 'CAB',
      notes: 'Uber Premier (White Dzire DL 1Y 9823)',
      trackingToken: 'safarsakhi-token-demo-completed',
      sharedContactIds: JSON.stringify(['contact_001', 'contact_002']),
      sharedFamilyIds: JSON.stringify([demoFamilyUser.id]),
      createdAt: new Date(Date.now() - 3600000 * 2),
      updatedAt: new Date(Date.now() - 3600000 * 1)
    }
  ];

  const demoNotifications = [
    {
      id: 'notif_welcome',
      userId: demoUser.id,
      type: 'SYSTEM',
      title: 'Welcome to Safar Sakhi!',
      message: 'Your personal AI safety and smart journey guardian is ready. Add trusted contacts and start your safe travel.',
      isRead: false,
      createdAt: new Date()
    },
    {
      id: 'notif_welcome_family',
      userId: demoFamilyUser.id,
      type: 'SYSTEM',
      title: 'Family Guardian Mode Active',
      message: 'Connected with Priya Patel. You will receive live journey alerts and emergency SOS notifications.',
      isRead: false,
      createdAt: new Date()
    }
  ];

  return {
    users: [adminUser, demoUser, demoFamilyUser],
    profiles: [adminProfile, demoProfile, demoFamilyProfile],
    settings: [demoSettings],
    contacts: demoContacts,
    familyConnections: demoFamilyConnections,
    journeys: demoJourneys,
    locations: [],
    sosIncidents: [],
    confirmations: [],
    notifications: demoNotifications
  };
}

module.exports = { getInitialSeedData };
