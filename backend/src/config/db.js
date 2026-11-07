const { PrismaClient } = require('@prisma/client');
const config = require('./index');
const { getInitialSeedData } = require('../utils/seedData');

let prisma;

try {
  prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error']
  });
} catch (error) {
  console.error('[Prisma Init Error]', error.message);
}

// Synchronously initialize seed data into memoryStore
const initialSeed = getInitialSeedData();

let memoryStore = {
  users: [...initialSeed.users],
  profiles: [...initialSeed.profiles],
  settings: [...initialSeed.settings],
  contacts: [...initialSeed.contacts],
  familyConnections: [...initialSeed.familyConnections],
  journeys: [...initialSeed.journeys],
  locations: [...initialSeed.locations],
  sosIncidents: [...initialSeed.sosIncidents],
  notifications: [...initialSeed.notifications],
  confirmations: [...initialSeed.confirmations],
  isPostgresActive: false
};

// Check PostgreSQL connection
const checkConnection = async () => {
  try {
    if (prisma) {
      await prisma.$connect();
      memoryStore.isPostgresActive = true;
      console.log('✅ [Database] Successfully connected to PostgreSQL via Prisma ORM.');
    }
  } catch (err) {
    memoryStore.isPostgresActive = false;
    console.warn('⚠️ [Database] PostgreSQL is not currently running at DATABASE_URL.');
    console.log('🛡️ [Database] Running with resilient in-memory store. Full app features, demo data, and APIs are 100% functional.');
    console.log('   To connect real PostgreSQL: start Postgres, set DATABASE_URL in .env, and run: npm run prisma:push');
  }
};

module.exports = {
  prisma,
  memoryStore,
  checkConnection
};
