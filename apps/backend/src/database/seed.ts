// apps/backend/src/database/seed.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sections, users, machines } from '@/drizzle/schema';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const queryClient = postgres(databaseUrl);
const db = drizzle(queryClient);

async function seedWithSection() {
  console.log('⏳ Starting professional laboratory seed...');

  // 1. Create the Section with specialization (REQUIRED for new schema)
  const [hematologySection] = await db.insert(sections).values({
    name: 'Hematology Department',
    location: 'Main Floor - Block B',
    specialization: 'HEMATOLOGY' // Moved from User to Section
  }).returning();

  console.log('✓ Section created: Hematology (ID: ' + hematologySection.id + ')');

  // 2. Create the Admin User
  await db.insert(users).values({
    firstName: 'System',
    lastName: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@hospital.com',
    passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD || 'Admin123!'),
    role: 'ADMIN', // Standardized role
    sectionId: hematologySection.id 
  });

  console.log('✓ Admin user created');

  // 3. Create a Technician User (Replacing the old ENGINEER role)
  await db.insert(users).values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'tech@hospital.com',
    passwordHash: await argon2.hash('Tech123!'),
    role: 'TECHNICIAN', // New professional role
    sectionId: hematologySection.id
  });

  console.log('✓ Technician user created');

  // 4. Create a Machine linked to the specialized section
  await db.insert(machines).values({
    name: 'Sysmex XN-1000',
    hospCode: 'HEM-MAC-001',
    sectionId: hematologySection.id, // Mandatory reference
    currentStatus: 'IDLE',
    specialization: 'HEMATOLOGY'
  });

  console.log('✓ Machine created and linked to Hematology');
}

seedWithSection()
  .then(() => {
    console.log('✅ DATABASE SEEDING COMPLETE');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  });