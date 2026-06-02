import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import * as argon2 from 'argon2';
import {
  sections,
  users,
  machines,
  qcTests,
  controlLots,
  qcResults,
  qcRuns,
  usersToSections,
} from '@/drizzle/schema';

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random(); // Converting [0,1) to (0,1]
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

// Helper to wipe the database cleanly
async function clearDatabase(db: any) {
  console.log('🗑️  Wiping existing database records to start fresh...');
  await db.execute('TRUNCATE TABLE users_to_alerts, users_to_sections, alerts, qc_results, qc_runs, control_lots, qc_tests, machines, users, sections CASCADE');
  console.log('✨ Database wiped successfully!');
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const db = databaseService.db;

  try {
    await clearDatabase(db);
    console.log('🏗️  Starting MASSIVE data seed for realistic UI...');

    // 1. Create Sections
    const sectionNames = ['Hematology', 'Clinical Chemistry', 'Immunology', 'Microbiology'];
    const insertedSections = await db.insert(sections).values(
      sectionNames.map(name => ({
        name,
        location: 'Main Lab Floor',
        specialization: (name === 'Hematology' ? 'HEMATOLOGY' : name === 'Clinical Chemistry' ? 'CHEMISTRY' : 'OTHER') as any,
      }))
    ).returning();

    // 2. Create Users
    const plainTextPassword = 'Password123!';
    const hashedPassword = await argon2.hash(plainTextPassword);

    const [adminUser] = await db.insert(users).values({
      firstName: 'Admin', lastName: 'Seeder', email: 'admin@lab.local', passwordHash: hashedPassword, role: 'ADMIN',
    }).returning();

    const techniciansToInsert = [
      { firstName: 'John', lastName: 'Doe', email: 'john.doe@lab.local', passwordHash: hashedPassword, role: 'TECHNICIAN' as const },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@lab.local', passwordHash: hashedPassword, role: 'TECHNICIAN' as const },
      { firstName: 'Ahmed', lastName: 'Tarek', email: 'ahmed.t@lab.local', passwordHash: hashedPassword, role: 'TECHNICIAN' as const },
      { firstName: 'Sarah', lastName: 'Connor', email: 'sarah.c@lab.local', passwordHash: hashedPassword, role: 'TECHNICIAN' as const },
    ];
    const insertedTechs = await db.insert(users).values(techniciansToInsert).returning();
    const allUsers = [adminUser, ...insertedTechs];

    // Map all users to all sections
    const userToSectionsRows: any[] = [];
    for (const u of allUsers) {
      for (const s of insertedSections) {
        userToSectionsRows.push({ userId: u.id, sectionId: s.id });
      }
    }
    await db.insert(usersToSections).values(userToSectionsRows);

    // 3. Create 15 Machines
    const machinePrefixes = ['Sysmex', 'Cobas', 'Architect', 'Beckman', 'Alinity'];
    const insertedMachines: any[] = [];
    for (let i = 0; i < 15; i++) {
      const sec = insertedSections[i % insertedSections.length];
      const prefix = machinePrefixes[i % machinePrefixes.length];
      const [m] = await db.insert(machines).values({
        name: `${prefix} Analyzer ${1000 + i}`,
        hospCode: `EQP-${1000 + i}`,
        sectionId: sec.id,
        currentStatus: i % 5 === 0 ? 'MAINTENANCE' : 'IDLE',
      }).returning();
      insertedMachines.push(m);
    }

    // 4. Create Tests and Control Lots
    const commonTests = ['Glucose', 'Cholesterol', 'Hemoglobin', 'WBC', 'RBC'];
    let totalResultsInserted = 0;

    for (const machine of insertedMachines) {
      // 3 Tests per machine
      for (let t = 0; t < 3; t++) {
        const testName = commonTests[(machine.id + t) % commonTests.length];
        const [qcTest] = await db.insert(qcTests).values({
          testName: `${testName} (Routine)`,
          testType: testName,
          machineId: machine.id,
        }).returning();

        // 3 Lots (Level 1, 2, 3) per Test
        const levels = [
          { level: 1, mean: 50, sd: 2.5 },
          { level: 2, mean: 120, sd: 5.0 },
          { level: 3, mean: 200, sd: 8.0 },
        ];

        for (const lvl of levels) {
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);

          const [lot] = await db.insert(controlLots).values({
            testId: qcTest.id,
            lotNumber: `L${lvl.level}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            level: lvl.level,
            expirationDate,
            targetValue: lvl.mean,
            mean: lvl.mean,
            standardDeviation: lvl.sd,
            upperControlLimit: lvl.mean + (3 * lvl.sd),
            lowerControlLimit: lvl.mean - (3 * lvl.sd),
            upperWarningLimit: lvl.mean + (2 * lvl.sd),
            lowerWarningLimit: lvl.mean - (2 * lvl.sd),
            isActive: true,
          }).returning();

          // Generate 30 days of historical data for this lot
          const runRows: any[] = [];
          const resultRows: any[] = [];
          let previousZ = 0;

          const now = new Date();
          for (let day = 30; day >= 0; day--) {
            const testDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
            
            // Introduce some random anomalies (10% chance)
            const isAnomaly = Math.random() < 0.1;
            const anomalyMultiplier = isAnomaly ? (Math.random() > 0.5 ? 3.2 : -3.2) : 0;
            
            // 90% normal, 10% anomaly
            let measuredValue = isAnomaly 
              ? gaussianRandom(lvl.mean + (anomalyMultiplier * lvl.sd), lvl.sd * 0.5)
              : gaussianRandom(lvl.mean, lvl.sd * 0.8);

            const zScore = (measuredValue - lvl.mean) / lvl.sd;
            let status = 'PASS';
            let violatedRule: string | null = null;

            // Simple Westgard rules logic for simulation
            if (Math.abs(zScore) >= 3) {
              status = 'FAIL';
              violatedRule = '1-3s';
            } else if (Math.abs(zScore) >= 2 && Math.abs(previousZ) >= 2 && (Math.sign(zScore) === Math.sign(previousZ))) {
              status = 'FAIL';
              violatedRule = '2-2s';
            } else if (Math.abs(zScore) >= 2) {
              status = 'WARNING';
              violatedRule = '1-2s';
            }

            previousZ = zScore;
            const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

            runRows.push({
              machineId: machine.id,
              testId: qcTest.id,
              performedBy: randomUser.id,
              runDate: testDate,
            });

            resultRows.push({
              lotId: lot.id,
              measuredValue,
              zScore,
              status,
              violatedRule,
              comments: isAnomaly ? 'Instrument calibration required' : null,
            });
          }

          // Insert runs and results (batching)
          const insertedRuns = await db.insert(qcRuns).values(runRows).returning();
          const finalResultRows = resultRows.map((r, i) => ({
            ...r,
            runId: insertedRuns[i].id,
          }));
          await db.insert(qcResults).values(finalResultRows);

          totalResultsInserted += finalResultRows.length;
        }
      }
    }

    console.log(`✅ Seeded 4 Sections, 15 Machines, 45 Tests, 135 Control Lots`);
    console.log(`✅ Inserted ${totalResultsInserted} Historical QC Results!`);
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('🔑 USER CREDENTIALS FOR LOGIN:');
    console.log(`All users share the same password:  ${plainTextPassword}`);
    allUsers.forEach((u) => console.log(` - ${u.email} (${u.role})`));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
