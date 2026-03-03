import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sections, users, machines } from '../drizzle/schema';
//import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const queryClient = postgres(databaseUrl);
const db = drizzle(queryClient);

// apps/backend/src/database/seed.ts

async function seedWithSection() {
const [defaultSection] = await db.insert(sections).values({
    name: 'General Laboratory',
    location: 'Main Floor - Block A' // Changed from 'description' to 'location'
  }).returning();

  console.log('✓ Section created (ID: ' + defaultSection.id + ')');

  // 2. Create the Admin (Section is optional here, but good to have)
  await db.insert(users).values({
    firstName: 'System',
    lastName: 'Admin',
    email: process.env.ADMIN_EMAIL!,
    passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD!),
    role: 'ADMIN',
    sectionId: defaultSection.id // Optional for Admin, but links them to the lab
  });

  // 3. Now you can safely seed a Machine!
await db.insert(machines).values({
  name: 'Sysmex XN-1000',
  sectionId: defaultSection.id, // Mandatory reference to the section
  currentStatus: 'IDLE',        // Changed from 'status' to 'currentStatus'
  hospCode: 'LAB-MAC-001',      // Optional: helps with your hospital tracking
  specialization: 'HEMATOLOGY'  // Optional: matches your specializationEnum
});


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
