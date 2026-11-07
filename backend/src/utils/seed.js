const { PrismaClient } = require('@prisma/client');
const { getInitialSeedData } = require('./seedData');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Safar Sakhi database...');
  const seed = await getInitialSeedData();

  for (const user of seed.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile: {
          create: seed.profiles.find(p => p.userId === user.id)
        },
        settings: seed.settings.find(s => s.userId === user.id) ? {
          create: seed.settings.find(s => s.userId === user.id)
        } : undefined
      }
    });
  }

  // Seed contacts for demo user
  for (const contact of seed.contacts) {
    const exists = await prisma.trustedContact.findFirst({
      where: { userId: contact.userId, phoneNumber: contact.phoneNumber }
    });
    if (!exists) {
      await prisma.trustedContact.create({
        data: contact
      });
    }
  }

  console.log('✅ Safar Sakhi database seeded successfully!');
  console.log('👤 Demo User: priya@safarsakhi.com / Password@123');
  console.log('🛡️ Admin User: admin@safarsakhi.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

