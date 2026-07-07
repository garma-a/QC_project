import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import * as argon2 from 'argon2';
import { faker } from '@faker-js/faker';
import {
  sections,
  users,
  machines,
  qualityControlTests,
  controlLots,
  qualityControlResults,
  qualityControlRuns,
  usersToSections,
  alerts,
  usersToAlerts,
} from '@/drizzle/schema';

// ==========================================
// ADJUST THE NUMBER OF ROWS HERE
// ==========================================
const CONFIG = {
  NUM_SECTIONS: 5,
  NUM_USERS: 10,
  NUM_MACHINES: 15,
  NUM_QC_TESTS: 30,
  NUM_CONTROL_LOTS: 50,
  NUM_QC_RUNS: 200,          // Try 1,000,000 here!
  NUM_QC_RESULTS: 1000000,       // Must be >= QC_RUNS
  NUM_ALERTS: 100,
  BATCH_SIZE: 5000,          // Number of rows to process at once before clearing memory
};
// ==========================================

async function clearDatabase(db: any) {
  console.log('🗑️  Wiping existing database records to start fresh...');
  await db.execute('TRUNCATE TABLE users_to_alerts, users_to_sections, email_logs, alerts, quality_control_results, quality_control_runs, control_lots, quality_control_tests, machines, whitelist_emails, users, sections RESTART IDENTITY CASCADE');
  console.log('✨ Database wiped successfully!');
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const db = databaseService.db;

  try {
    await clearDatabase(db);
    console.log(`🏗️  Starting MEMORY-EFFICIENT fake data generation...`);

    // 1. Create Users
    console.log(`Inserting ${CONFIG.NUM_USERS} users...`);
    const plainTextPassword = 'Password123!';
    const hashedPassword = await argon2.hash(plainTextPassword, { timeCost: 3, memoryCost: 65536, parallelism: 4 });

    const usersData = Array.from({ length: CONFIG.NUM_USERS }).map(() => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      passwordHash: hashedPassword,
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(['TECHNICIAN', 'ADMIN']),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      emailNotificationsEnabled: faker.datatype.boolean(),
      subscribeToAllSections: faker.datatype.boolean(),
    }));
    // Ensure we have one admin
    usersData[0].role = 'ADMIN';
    usersData[0].email = 'admin@fake.local';

    const insertedUsers = await db.insert(users).values(usersData as any).returning();
    const userIds = insertedUsers.map(u => u.id); // Only keep IDs in memory

    // 2. Create Sections
    console.log(`Inserting ${CONFIG.NUM_SECTIONS} sections...`);
    const sectionsData = Array.from({ length: CONFIG.NUM_SECTIONS }).map(() => ({
      name: faker.company.name() + ' Lab',
      location: faker.location.buildingNumber() + ' Floor',
      specialization: faker.helpers.arrayElement(['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER']),
    }));
    const insertedSections = await db.insert(sections).values(sectionsData as any).returning();
    const sectionIds = insertedSections.map(s => s.id);

    // Assign users to sections
    console.log('Assigning users to sections...');
    const userToSectionsRows = insertedUsers.map(user => ({
      userId: user.id,
      sectionId: faker.helpers.arrayElement(sectionIds),
    }));
    await db.insert(usersToSections).values(userToSectionsRows);

    // 3. Create Machines
    console.log(`Inserting ${CONFIG.NUM_MACHINES} machines...`);
    const machinesData = Array.from({ length: CONFIG.NUM_MACHINES }).map(() => ({
      name: faker.science.chemicalElement().name + ' Analyzer',
      hospitalCode: `EQP-${faker.string.alphanumeric(5).toUpperCase()}`,
      sectionId: faker.helpers.arrayElement(sectionIds),
      currentStatus: faker.helpers.arrayElement(['IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE', 'ERROR']),
      specialization: faker.helpers.arrayElement(['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER']),
    }));
    const insertedMachines = await db.insert(machines).values(machinesData as any).returning();
    const machineIds = insertedMachines.map(m => m.id);

    // 4. Create QC Tests
    console.log(`Inserting ${CONFIG.NUM_QC_TESTS} QC tests...`);
    const qualityControlTestsData = Array.from({ length: CONFIG.NUM_QC_TESTS }).map(() => ({
      testName: faker.science.chemicalElement().name,
      testType: faker.lorem.word().toUpperCase(),
      machineId: faker.helpers.arrayElement(machineIds),
    }));
    const insertedQualityControlTests = await db.insert(qualityControlTests).values(qualityControlTestsData as any).returning();
    const testIds = insertedQualityControlTests.map(t => t.id);

    // 5. Create Control Lots
    console.log(`Inserting ${CONFIG.NUM_CONTROL_LOTS} Control Lots...`);
    const controlLotsData = Array.from({ length: CONFIG.NUM_CONTROL_LOTS }).map(() => {
      const mean = faker.number.float({ min: 10, max: 100 });
      const sd = mean * 0.05;
      return {
        testId: faker.helpers.arrayElement(testIds),
        lotNumber: `LOT-${faker.string.alphanumeric(8).toUpperCase()}`,
        expirationDate: faker.date.future(),
        targetValue: mean,
        mean: mean,
        standardDeviation: sd,
        upperControlLimit: mean + 3 * sd,
        lowerControlLimit: mean - 3 * sd,
        upperWarningLimit: mean + 2 * sd,
        lowerWarningLimit: mean - 2 * sd,
        level: faker.helpers.arrayElement([1, 2, 3]),
        isActive: true,
      };
    });
    const insertedControlLots = await db.insert(controlLots).values(controlLotsData as any).returning();
    const lotIds = insertedControlLots.map(l => l.id);

    // =========================================================
    // MEMORY-EFFICIENT BATCH GENERATION FOR LARGE TABLES
    // =========================================================

    // 6. Create QC Runs (Batching)
    console.log(`Inserting ${CONFIG.NUM_QC_RUNS} QC Runs in batches of ${CONFIG.BATCH_SIZE}...`);
    let runIds: number[] = [];
    for (let i = 0; i < CONFIG.NUM_QC_RUNS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_QC_RUNS - i);
      const batch = Array.from({ length: batchSize }).map(() => ({
        machineId: faker.helpers.arrayElement(machineIds),
        testId: faker.helpers.arrayElement(testIds),
        performedBy: faker.helpers.arrayElement(userIds),
        runDate: faker.date.recent({ days: 90 }),
      }));
      // returning ONLY the id avoids crashing memory with large objects
      const returned = await db.insert(qualityControlRuns).values(batch).returning({ id: qualityControlRuns.id });
      runIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_QC_RUNS}`);
    }
    console.log(''); // Move to next line

    // 7. Create QC Results (Batching)
    console.log(`Inserting ${CONFIG.NUM_QC_RESULTS} QC Results in batches of ${CONFIG.BATCH_SIZE}...`);
    let alertEligibleResultIds: number[] = [];
    for (let i = 0; i < CONFIG.NUM_QC_RESULTS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_QC_RESULTS - i);
      const batch = Array.from({ length: batchSize }).map(() => {
        const status = faker.helpers.arrayElement(['PASS', 'FAIL', 'WARNING']);
        const zScore = status === 'FAIL' ? faker.number.float({ min: 3.1, max: 5 }) : (status === 'WARNING' ? faker.number.float({ min: 2.1, max: 2.9 }) : faker.number.float({ min: 0, max: 1.9 }));

        return {
          measuredValue: faker.number.float({ min: 10, max: 100 }),
          zScore: zScore,
          status: status as any,
          violatedRule: status !== 'PASS' ? faker.helpers.arrayElement(['1-3s', '2-2s', '1-2s']) : null,
          comments: faker.lorem.sentence(),
          runId: faker.helpers.arrayElement(runIds),
          lotId: faker.helpers.arrayElement(lotIds),
        };
      });
      // returning only what's needed for the next step
      const returned = await db.insert(qualityControlResults).values(batch).returning({ id: qualityControlResults.id, status: qualityControlResults.status });

      // Store IDs of failed/warning results for alerts
      returned.forEach((r: any) => {
        if (r.status !== 'PASS') {
          alertEligibleResultIds.push(r.id);
        }
      });
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_QC_RESULTS}`);
    }
    console.log('');

    // 8. Create Alerts (Batching)
    const totalAlertsToInsert = Math.min(CONFIG.NUM_ALERTS, alertEligibleResultIds.length);
    console.log(`Inserting ${totalAlertsToInsert} Alerts in batches of ${CONFIG.BATCH_SIZE}...`);

    for (let i = 0; i < totalAlertsToInsert; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, totalAlertsToInsert - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => {
        return {
          type: 'QC_DEVIATION',
          priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
          message: faker.lorem.sentence(),
          ruleViolated: faker.helpers.arrayElement(['1-3s', '2-2s', '1-2s']),
          suggestedSolution: faker.lorem.sentence(),
          resultId: alertEligibleResultIds[i + idx], // Take directly from the eligible pool
          createdAt: faker.date.recent(),
        };
      });

      const returnedAlerts = await db.insert(alerts).values(batch).returning({ id: alerts.id });

      // Immediately assign this batch of alerts to users and save
      const usersToAlertsRows: any[] = [];
      returnedAlerts.forEach((a: any) => {
        usersToAlertsRows.push({ userId: userIds[0], alertId: a.id, status: 'UNSEEN' }); // Admin
        usersToAlertsRows.push({ userId: faker.helpers.arrayElement(userIds), alertId: a.id, status: 'UNSEEN' }); // Tech
      });

      // Deduplicate before inserting to avoid constraint errors
      const uniqueU2A = Array.from(new Set(usersToAlertsRows.map(r => JSON.stringify(r)))).map(s => JSON.parse(s));
      await db.insert(usersToAlerts).values(uniqueU2A);

      process.stdout.write(`\rProgress: ${i + batchSize} / ${totalAlertsToInsert}`);
    }
    console.log('');

    console.log('\n🎉 Massive Data seeding completed successfully without crashing!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
