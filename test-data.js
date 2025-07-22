const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

const testListings = [
  {
    title: "Cozy Downtown Apartment",
    description: "Beautiful 1-bedroom apartment in the heart of downtown. Recently renovated with modern amenities.",
    price: 1500,
    duration: "6 months",
    location: "Downtown",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    amenities: "WiFi,Kitchen,Laundry,Parking",
    contactName: "John Smith",
    contactEmail: "john@example.com",
    contactPhone: "555-0123",
    availableFrom: "September 1, 2024",
    firebaseId: "test-user-1"
  },
  {
    title: "Modern Studio Near Campus",
    description: "Furnished studio apartment perfect for students. Walking distance to university and shopping.",
    price: 1200,
    duration: "12 months",
    location: "University District",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    amenities: "Furnished,WiFi,Utilities Included",
    contactName: "Sarah Johnson",
    contactEmail: "sarah@example.com",
    contactPhone: "555-0456",
    availableFrom: "August 15, 2024",
    firebaseId: "test-user-1"
  },
  {
    title: "Luxury 2BR with City View",
    description: "Spacious 2-bedroom apartment with stunning city views. High-end finishes and amenities included.",
    price: 2800,
    duration: "3 months",
    location: "Midtown",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    amenities: "Gym,Pool,Doorman,Parking,Balcony",
    contactName: "Mike Davis",
    contactEmail: "mike@example.com",
    contactPhone: "555-0789",
    availableFrom: "October 1, 2024",
    firebaseId: "test-user-1"
  },
  {
    title: "Affordable Room in Shared House",
    description: "Private room in a shared house. Great for budget-conscious renters. Utilities included.",
    price: 800,
    duration: "6 months",
    location: "Suburbs",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    amenities: "Utilities Included,Shared Kitchen,Backyard",
    contactName: "Lisa Wilson",
    contactEmail: "lisa@example.com",
    contactPhone: "555-0321",
    availableFrom: "September 15, 2024",
    firebaseId: "test-user-1"
  },
  {
    title: "Waterfront Condo",
    description: "Luxurious waterfront condo with amazing views. Perfect for professionals or couples.",
    price: 3500,
    duration: "12 months",
    location: "Harbor District",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    amenities: "Waterfront View,Gym,Pool,Concierge,Parking",
    contactName: "David Brown",
    contactEmail: "david@example.com",
    contactPhone: "555-0654",
    availableFrom: "November 1, 2024",
    firebaseId: "test-user-1"
  }
];

async function createTestData() {
  try {
    // First, create a test user
    const user = await prisma.user.upsert({
      where: { firebaseId: "test-user-1" },
      update: {},
      create: {
        firebaseId: "test-user-1",
        email: "test@example.com"
      }
    });

    console.log("Created test user:", user.email);

    // Create test listings
    for (const listingData of testListings) {
      const { firebaseId, ...listingDataWithoutFirebaseId } = listingData;
      const listing = await prisma.listing.create({
        data: {
          ...listingDataWithoutFirebaseId,
          userId: user.id
        }
      });
      console.log(`Created listing: ${listing.title}`);
    }

    console.log("✅ Test data created successfully!");
  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData(); 