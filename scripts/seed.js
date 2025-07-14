const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { supabaseId: 'test-user-123' },
    update: {},
    create: {
      supabaseId: 'test-user-123',
      email: 'test@example.com',
    },
  });

  // Create test listings with "mars" in location
  const listings = [
    {
      title: 'Cozy Apartment in Mars Colony',
      description: 'Beautiful apartment located in the heart of Mars Colony. Perfect for space explorers!',
      price: 1500,
      location: 'Mars Colony, Red Planet',
      amenities: JSON.stringify(['Furnished', 'Kitchen', 'Bathroom', 'Space View']),
      contactName: 'John Space',
      contactEmail: 'john@mars.com',
      contactPhone: '555-MARS-123',
      availableFrom: '2025-01-01',
      availableTo: '2025-12-31',
      userId: user.id,
    },
    {
      title: 'Modern Studio on Mars',
      description: 'Contemporary studio apartment with amazing views of the Martian landscape.',
      price: 1200,
      location: 'Downtown Mars, Red Planet',
      amenities: JSON.stringify(['Studio', 'Kitchenette', 'Bathroom', 'Martian Views']),
      contactName: 'Jane Martian',
      contactEmail: 'jane@mars.com',
      contactPhone: '555-MARS-456',
      availableFrom: '2025-02-01',
      availableTo: '2025-11-30',
      userId: user.id,
    },
    {
      title: 'Luxury Penthouse on Mars',
      description: 'Exclusive penthouse with panoramic views of the entire Mars landscape.',
      price: 3000,
      location: 'Mars Heights, Red Planet',
      amenities: JSON.stringify(['Penthouse', 'Full Kitchen', 'Master Bath', '360° Views']),
      contactName: 'Bob Red',
      contactEmail: 'bob@mars.com',
      contactPhone: '555-MARS-789',
      availableFrom: '2025-03-01',
      availableTo: '2025-10-31',
      userId: user.id,
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({
      data: listing,
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 