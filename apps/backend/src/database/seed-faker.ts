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
  NUM_SECTIONS: 1000000,
  NUM_USERS: 1000000,
  NUM_MACHINES: 1000000,
  NUM_QC_TESTS: 1000000,
  NUM_CONTROL_LOTS: 1000000,
  NUM_QC_RUNS: 1000000,
  NUM_QC_RESULTS: 1000000,
  NUM_ALERTS: 1000000,
  BATCH_SIZE: 3000, // Kept to 3000 to avoid Postgres 65535 parameter limit
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

    const sectionIds: number[] = [];
    const userIds: number[] = [];
    const machineIds: number[] = [];
    const testIds: number[] = [];
    const lotIds: number[] = [];
    const runIds: number[] = [];

    // 1. Create Sections
    console.log(`Inserting ${CONFIG.NUM_SECTIONS} Sections in batches...`);
    for (let i = 0; i < CONFIG.NUM_SECTIONS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_SECTIONS - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => ({
        name: `Lab ${i + idx} ${faker.company.name()}`,
        location: `Loc ${i + idx}`,
        specialization: faker.helpers.arrayElement(['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER']),
      }));
      const returned = await db.insert(sections).values(batch).returning({ id: sections.id });
      sectionIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_SECTIONS}`);
    }
    console.log('');

    // 2. Create Users
    console.log(`Inserting ${CONFIG.NUM_USERS} Users in batches...`);
    const plainTextPassword = 'Password123!';
    const hashedPassword = await argon2.hash(plainTextPassword, { timeCost: 3, memoryCost: 65536, parallelism: 4 });
    
    for (let i = 0; i < CONFIG.NUM_USERS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_USERS - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => {
        const isFirst = (i === 0 && idx === 0);
        return {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: isFirst ? 'admin@fake.local' : `user_${i + idx}_${faker.internet.email()}`,
          passwordHash: hashedPassword,
          phone: faker.phone.number(),
          role: isFirst ? 'ADMIN' : faker.helpers.arrayElement(['TECHNICIAN', 'ADMIN']),
          isActive: faker.datatype.boolean({ probability: 0.9 }),
          emailNotificationsEnabled: faker.datatype.boolean(),
          subscribeToAllSections: faker.datatype.boolean(),
        };
      });
      const returned = await db.insert(users).values(batch).returning({ id: users.id });
      userIds.push(...returned.map(r => r.id));
      
      const userToSectionsRows = returned.map(u => ({
        userId: u.id,
        sectionId: faker.helpers.arrayElement(sectionIds)
      }));
      await db.insert(usersToSections).values(userToSectionsRows);
      
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_USERS}`);
    }
    console.log('');

    // 3. Create Machines
    console.log(`Inserting ${CONFIG.NUM_MACHINES} Machines in batches...`);
    for (let i = 0; i < CONFIG.NUM_MACHINES; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_MACHINES - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => ({
        name: `Machine ${i + idx} ${faker.science.chemicalElement().name}`,
        hospitalCode: `EQP-${i + idx}`,
        sectionId: faker.helpers.arrayElement(sectionIds),
        currentStatus: faker.helpers.arrayElement(['IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE', 'ERROR']),
        specialization: faker.helpers.arrayElement(['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER']),
      }));
      const returned = await db.insert(machines).values(batch).returning({ id: machines.id });
      machineIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_MACHINES}`);
    }
    console.log('');

    // 4. Create QC Tests
    console.log(`Inserting ${CONFIG.NUM_QC_TESTS} QC Tests in batches...`);
    for (let i = 0; i < CONFIG.NUM_QC_TESTS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_QC_TESTS - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => ({
        testName: `Test ${i + idx} ${faker.science.chemicalElement().name}`,
        testType: faker.lorem.word().toUpperCase(),
        machineId: faker.helpers.arrayElement(machineIds),
      }));
      const returned = await db.insert(qualityControlTests).values(batch).returning({ id: qualityControlTests.id });
      testIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_QC_TESTS}`);
    }
    console.log('');

    // 5. Create Control Lots
    console.log(`Inserting ${CONFIG.NUM_CONTROL_LOTS} Control Lots in batches...`);
    for (let i = 0; i < CONFIG.NUM_CONTROL_LOTS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_CONTROL_LOTS - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => {
        const globalIdx = i + idx;
        const mean = faker.number.float({ min: 10, max: 100 });
        const sd = mean * 0.05;
        return {
          testId: testIds[globalIdx % testIds.length],
          lotNumber: `LOT-${globalIdx}`,
          expirationDate: faker.date.future(),
          targetValue: mean,
          mean: mean,
          standardDeviation: sd,
          upperControlLimit: mean + 3 * sd,
          lowerControlLimit: mean - 3 * sd,
          upperWarningLimit: mean + 2 * sd,
          lowerWarningLimit: mean - 2 * sd,
          level: (globalIdx % 3) + 1,
          isActive: true,
        };
      });
      const returned = await db.insert(controlLots).values(batch).returning({ id: controlLots.id });
      lotIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_CONTROL_LOTS}`);
    }
    console.log('');

    // 6. Create QC Runs
    console.log(`Inserting ${CONFIG.NUM_QC_RUNS} QC Runs in batches...`);
    for (let i = 0; i < CONFIG.NUM_QC_RUNS; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.NUM_QC_RUNS - i);
      const batch = Array.from({ length: batchSize }).map(() => ({
        machineId: faker.helpers.arrayElement(machineIds),
        testId: faker.helpers.arrayElement(testIds),
        performedBy: faker.helpers.arrayElement(userIds),
        runDate: faker.date.recent({ days: 90 }),
      }));
      const returned = await db.insert(qualityControlRuns).values(batch).returning({ id: qualityControlRuns.id });
      runIds.push(...returned.map(r => r.id));
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_QC_RUNS}`);
    }
    console.log('');

    // 7. Create QC Results
    console.log(`Inserting ${CONFIG.NUM_QC_RESULTS} QC Results in batches...`);
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
          comments: 'Big Data Gen',
          runId: faker.helpers.arrayElement(runIds),
          lotId: faker.helpers.arrayElement(lotIds),
        };
      });
      const returned = await db.insert(qualityControlResults).values(batch).returning({ id: qualityControlResults.id, status: qualityControlResults.status });
      
      returned.forEach((r: any) => {
        if (r.status !== 'PASS') alertEligibleResultIds.push(r.id);
      });
      process.stdout.write(`\rProgress: ${i + batchSize} / ${CONFIG.NUM_QC_RESULTS}`);
    }
    console.log('');

    // 8. Create Alerts
    const totalAlertsToInsert = Math.min(CONFIG.NUM_ALERTS, alertEligibleResultIds.length);
    console.log(`Inserting ${totalAlertsToInsert} Alerts in batches...`);
    for (let i = 0; i < totalAlertsToInsert; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, totalAlertsToInsert - i);
      const batch = Array.from({ length: batchSize }).map((_, idx) => ({
        type: 'QC_DEVIATION',
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        message: 'Big Data Alert',
        ruleViolated: faker.helpers.arrayElement(['1-3s', '2-2s', '1-2s']),
        suggestedSolution: 'Check machine',
        resultId: alertEligibleResultIds[i + idx],
        createdAt: faker.date.recent(),
      }));
      const returnedAlerts = await db.insert(alerts).values(batch).returning({ id: alerts.id });
      
      const usersToAlertsRows: any[] = [];
      returnedAlerts.forEach((a: any) => {
        usersToAlertsRows.push({ userId: userIds[0], alertId: a.id, status: 'UNSEEN' });
        usersToAlertsRows.push({ userId: faker.helpers.arrayElement(userIds), alertId: a.id, status: 'UNSEEN' });
      });
      
      const uniqueU2A = Array.from(new Set(usersToAlertsRows.map(r => JSON.stringify(r)))).map(s => JSON.parse(s));
      await db.insert(usersToAlerts).values(uniqueU2A);
      
      process.stdout.write(`\rProgress: ${i + batchSize} / ${totalAlertsToInsert}`);
    }
    console.log('');

    console.log('\n🎉 Massive Data seeding (1 MILLION ACROSS THE BOARD) completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
