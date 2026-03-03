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

  // 1. Create the Section with specialization
  const [hematologySection] = await db.insert(sections).values({
    name: 'Hematology Department',
    location: 'Main Floor - Block B',
    specialization: 'HEMATOLOGY'
  }).returning();

  console.log('✓ Section created: Hematology (ID: ' + hematologySection.id + ')');

  // 2. Create the Admin User
  await db.insert(users).values({
    firstName: 'System',
    lastName: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@hospital.com',
    passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD || 'Admin123!'),
    role: 'ADMIN',
    sectionId: hematologySection.id 
  });

  console.log('✓ Admin user created');

  // 3. Create a Technician User
  await db.insert(users).values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'tech@hospital.com',
    passwordHash: await argon2.hash('Tech123!'),
    role: 'TECHNICIAN',
    sectionId: hematologySection.id
  });

  console.log('✓ Technician user created');

  // 4. Create the Machine and capture the result in 'sysmex'
  const [sysmex] = await db.insert(machines).values({
    name: 'Sysmex XN-1000',
    hospCode: 'HEM-MAC-001',
    sectionId: hematologySection.id,
    currentStatus: 'IDLE',
    specialization: 'HEMATOLOGY'
  }).returning(); // .returning() is required to get the ID back

  console.log('✓ Machine created: ' + sysmex.name + ' (ID: ' + sysmex.id + ')');

  // 5. Create QC Tests linked to sysmex.id
  const [wbcTest] = await db.insert(qcTests).values({
    testName: 'White Blood Cell Count',
    testType: 'Complete Blood Count',
    machineId: sysmex.id,
  }).returning();

  const [hgbTest] = await db.insert(qcTests).values({
    testName: 'Hemoglobin',
    testType: 'Complete Blood Count',
    machineId: sysmex.id,
  }).returning();

  console.log('✓ QC Tests created for Sysmex');

  // 6. Create Control Lots for target values and ranges
  await db.insert(controlLots).values([
    {
      testId: wbcTest.id,
      lotNumber: 'WBC-2026-A',
      expirationDate: new Date('2027-01-01'),
      targetValue: 7.5,
      upperControlLimit: 11.0,
      lowerControlLimit: 4.0,
      isActive: true,
    },
    {
      testId: hgbTest.id,
      lotNumber: 'HGB-2026-A',
      expirationDate: new Date('2027-01-01'),
      targetValue: 14.5,
      upperControlLimit: 18.0,
      lowerControlLimit: 12.0,
      isActive: true,
    }
  ]);

  console.log('✓ Control Lots created with target ranges');
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