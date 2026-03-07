// apps/backend/src/database/seed.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sections, users, machines, qcTests, controlLots } from '@/drizzle/schema';
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
  const [machine] = await db.insert(machines).values({
    name: 'Sysmex XN-1000',
    hospCode: 'HEM-MAC-001',
    sectionId: hematologySection.id, // Mandatory reference
    currentStatus: 'IDLE',
    specialization: 'HEMATOLOGY'
  }).returning();

  console.log('✓ Machine created and linked to Hematology (ID: ' + machine.id + ')');

  // 5. Create QC Tests linked to the machine
  const [hgbTest] = await db.insert(qcTests).values({
    testName: 'Hemoglobin (HGB)',
    testType: 'HEMATOLOGY',
    machineId: machine.id,
  }).returning();

  const [wbcTest] = await db.insert(qcTests).values({
    testName: 'White Blood Cell (WBC)',
    testType: 'HEMATOLOGY',
    machineId: machine.id,
  }).returning();

  console.log('✓ QC Tests created: HGB (ID: ' + hgbTest.id + '), WBC (ID: ' + wbcTest.id + ')');

  // 6. Create Control Lots with realistic manufacturer values
  await db.insert(controlLots).values({
    testId: hgbTest.id,
    lotNumber: 'LOT-HGB-2026-A',
    expirationDate: new Date('2026-12-31'),
    targetValue: 14.0,
    mean: 14.0,
    standardDevi: 0.5,
    upperControlLimit: 15.5,  // mean + 3SD
    lowerControlLimit: 12.5,  // mean - 3SD
    upperWarningLimit: 15.0,  // mean + 2SD
    lowerWarningLimit: 13.0,  // mean - 2SD
  });

  await db.insert(controlLots).values({
    testId: wbcTest.id,
    lotNumber: 'LOT-WBC-2026-A',
    expirationDate: new Date('2026-12-31'),
    targetValue: 7.5,
    mean: 7.5,
    standardDevi: 0.8,
    upperControlLimit: 9.9,   // mean + 3SD
    lowerControlLimit: 5.1,   // mean - 3SD
    upperWarningLimit: 9.1,   // mean + 2SD
    lowerWarningLimit: 5.9,   // mean - 2SD
  });

  console.log('✓ Control Lots created for HGB and WBC tests');
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