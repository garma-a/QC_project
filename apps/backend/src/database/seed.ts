import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import * as argon2 from 'argon2';
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

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random(); // Converting [0,1) to (0,1]
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function getRandomDate(daysAgo: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour + (Math.random() * 2 - 1), Math.random() * 60, 0, 0); // +/- 1 hour
  return d;
}

function evaluateWestgard(zScore: number, previousZ: number) {
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let rule: string | null = null;
  const absZ = Math.abs(zScore);
  const absPrevZ = Math.abs(previousZ);

  if (absZ >= 3) {
    status = 'FAIL';
    rule = '1-3s';
  } else if (absZ >= 2 && absPrevZ >= 2 && Math.sign(zScore) === Math.sign(previousZ)) {
    status = 'FAIL';
    rule = '2-2s';
  } else if (absZ >= 2) {
    status = 'WARNING';
    rule = '1-2s';
  }
  return { status, rule };
}

async function batchInsert(db: any, table: any, data: any[], batchSize = 5000) {
  const results: any[] = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const inserted = await db.insert(table).values(batch).returning();
    results.push(...inserted);
  }
  return results;
}

async function clearDatabase(db: any) {
  console.log('🗑️  Wiping existing database records to start fresh...');
  await db.execute('TRUNCATE TABLE users_to_alerts, users_to_sections, alerts, quality_control_results, quality_control_runs, control_lots, quality_control_tests, machines, users, sections RESTART IDENTITY CASCADE');
  console.log('✨ Database wiped successfully!');
}

const labStructure = [
  {
    name: 'Hematology',
    spec: 'HEMATOLOGY',
    machines: [
      { prefix: 'Sysmex XN-9000', tests: ['WBC', 'RBC', 'HGB', 'PLT'] },
      { prefix: 'Sysmex XN-1000', tests: ['WBC', 'RBC', 'HGB', 'PLT'] },
      { prefix: 'Beckman Coulter DxH 900', tests: ['MCV', 'MCH', 'MCHC', 'RDW'] },
    ]
  },
  {
    name: 'Clinical Chemistry',
    spec: 'CHEMISTRY',
    machines: [
      { prefix: 'Cobas 8000', tests: ['Glucose', 'Cholesterol', 'Triglycerides', 'HDL'] },
      { prefix: 'Cobas 6000', tests: ['ALT', 'AST', 'ALP', 'Bilirubin'] },
      { prefix: 'Architect c8000', tests: ['BUN', 'Creatinine', 'Uric Acid', 'Calcium'] },
      { prefix: 'Beckman AU5800', tests: ['Sodium', 'Potassium', 'Chloride', 'Magnesium'] },
    ]
  },
  {
    name: 'Immunology',
    spec: 'IMMUNOLOGY',
    machines: [
      { prefix: 'Architect i2000SR', tests: ['TSH', 'Free T4', 'Free T3', 'FSH'] },
      { prefix: 'Cobas e601', tests: ['Ferritin', 'Vitamin B12', 'Folate', 'PSA'] },
      { prefix: 'Siemens Centaur XP', tests: ['Troponin I', 'CK-MB', 'Myoglobin', 'BNP'] },
    ]
  },
  {
    name: 'Microbiology',
    spec: 'MICROBIOLOGY',
    machines: [
      { prefix: 'VITEK 2', tests: ['Gram Positive ID', 'Gram Negative ID', 'AST-GP', 'AST-GN'] },
      { prefix: 'BACTEC FX', tests: ['Aerobic Blood Culture', 'Anaerobic Blood Culture'] },
    ]
  },
  {
    name: 'Coagulation',
    spec: 'OTHER',
    machines: [
      { prefix: 'Stago STA R Max', tests: ['PT', 'aPTT', 'Fibrinogen', 'D-Dimer'] },
      { prefix: 'Sysmex CS-5100', tests: ['PT', 'aPTT', 'Antithrombin III', 'Protein C'] },
    ]
  },
  {
    name: 'Urinalysis',
    spec: 'OTHER',
    machines: [
      { prefix: 'Iris iRICELL', tests: ['Specific Gravity', 'pH', 'Protein', 'Glucose'] },
      { prefix: 'Siemens Clinitek Novus', tests: ['Ketones', 'Bilirubin', 'Urobilinogen', 'Nitrite'] },
    ]
  },
  {
    name: 'Blood Bank',
    spec: 'OTHER',
    machines: [
      { prefix: 'Ortho Vision', tests: ['ABO/Rh', 'Antibody Screen', 'Crossmatch'] },
      { prefix: 'Echo Lumena', tests: ['ABO/Rh', 'Direct Antiglobulin Test', 'Phenotyping'] },
    ]
  },
  {
    name: 'Molecular Diagnostics',
    spec: 'OTHER',
    machines: [
      { prefix: 'Roche cobas 6800', tests: ['HIV Viral Load', 'HCV Viral Load', 'HBV Viral Load'] },
      { prefix: 'GeneXpert Infinity', tests: ['SARS-CoV-2', 'MRSA', 'C. difficile'] },
    ]
  },
  {
    name: 'Toxicology',
    spec: 'CHEMISTRY',
    machines: [
      { prefix: 'Agilent LC/MS', tests: ['Opiates', 'Amphetamines', 'Cocaine', 'Benzodiazepines'] },
      { prefix: 'Waters Xevo TQ-S', tests: ['Barbiturates', 'Methadone', 'Buprenorphine', 'PCP'] },
    ]
  }
];

function getTestParams(testName: string, level: number) {
  const hash = testName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseMean = (hash % 100) + 10; // 10 to 110
  const meanMultiplier = level === 1 ? 1 : level === 2 ? 2.5 : 5.0;
  const mean = baseMean * meanMultiplier;
  const sd = mean * 0.05; // 5% CV
  return { mean, sd };
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const db = databaseService.db;

  try {
    await clearDatabase(db);
    console.log('🏗️  Starting MASSIVE data seed for realistic UI (3 months simulation)...');

    // 1. Create Sections
    console.log('Inserting sections...');
    const sectionRows: any[] = labStructure.map(s => ({
      name: s.name,
      location: 'Main Hospital Lab Floor',
      specialization: s.spec as any,
    }));
    const insertedSections: any[] = await db.insert(sections).values(sectionRows).returning();

    // 2. Create Users
    console.log('Inserting users...');
    const plainTextPassword = 'Password123!';
    const hashedPassword = await argon2.hash(plainTextPassword, { timeCost: 3, memoryCost: 65536, parallelism: 4 });

    const [adminUser] = await db.insert(users).values({
      firstName: 'Lab', lastName: 'Director', email: 'admin@lab.local', passwordHash: hashedPassword, role: 'ADMIN',
    }).returning();

    const techNames = [
      'John Doe', 'Jane Smith', 'Ahmed Tarek', 'Sarah Connor', 'Michael Chang',
      'Emily Davis', 'Robert Wilson', 'Linda Martinez', 'William Taylor', 'Elizabeth Anderson',
      'David Thomas', 'Jennifer Jackson', 'Richard White', 'Maria Harris'
    ];

    const techsToInsert: any[] = techNames.map(name => {
      const [first, last] = name.split(' ');
      return {
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@lab.local`,
        passwordHash: hashedPassword,
        role: 'TECHNICIAN' as const,
      };
    });
    const allTechs: any[] = await db.insert(users).values(techsToInsert).returning();
    const allUsers: any[] = [adminUser, ...allTechs];

    // Assign users to sections randomly
    console.log('Assigning users to sections...');
    const userToSectionsRows: any[] = [];
    for (const u of allUsers) {
      if (u.role === 'ADMIN') {
        for (const s of insertedSections) {
          userToSectionsRows.push({ userId: u.id, sectionId: s.id });
        }
      } else {
        const numSections = Math.floor(Math.random() * 2) + 1; // 1 or 2 sections
        const shuffled = [...insertedSections].sort(() => 0.5 - Math.random());
        for (let i = 0; i < numSections; i++) {
          userToSectionsRows.push({ userId: u.id, sectionId: shuffled[i].id });
        }
      }
    }
    await batchInsert(db, usersToSections, userToSectionsRows);

    // 3. Create Machines, Tests, and Control Lots
    console.log('Inserting machines, tests, and control lots...');
    const allMachineTestsWithLots: any[] = [];
    let eqpCounter = 1000;

    for (const secConfig of labStructure) {
      const section = insertedSections.find(s => s.name === secConfig.name);
      if (!section) continue;

      for (const mConfig of secConfig.machines) {
        const [machine] = await db.insert(machines).values({
          name: mConfig.prefix,
          hospitalCode: `EQP-${eqpCounter++}`,
          sectionId: section.id,
          currentStatus: Math.random() < 0.1 ? 'MAINTENANCE' : 'IDLE',
        }).returning();

        for (const testName of mConfig.tests) {
          const [qualityControlTest] = await db.insert(qualityControlTests).values({
            testName: testName,
            testType: testName.toUpperCase().replace(/\s/g, '_'),
            machineId: machine.id,
          }).returning();

          const testLots: any[] = [];
          for (let level = 1; level <= 3; level++) {
            const params = getTestParams(testName, level);
            const expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            const [lot] = await db.insert(controlLots).values({
              testId: qualityControlTest.id,
              lotNumber: `L${level}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              level: level,
              expirationDate,
              targetValue: params.mean,
              mean: params.mean,
              standardDeviation: params.sd,
              upperControlLimit: params.mean + (3 * params.sd),
              lowerControlLimit: params.mean - (3 * params.sd),
              upperWarningLimit: params.mean + (2 * params.sd),
              lowerWarningLimit: params.mean - (2 * params.sd),
              isActive: true,
            }).returning();
            testLots.push(lot);
          }

          allMachineTestsWithLots.push({
            machineId: machine.id,
            testId: qualityControlTest.id,
            lots: testLots,
          });
        }
      }
    }

    // 4. Generate Runs and Results
    console.log('Generating 3 months (90 days) of QC Runs and Results in memory...');
    const runData: any[] = [];
    const runLotsMap: any[] = [];
    const previousZMap = new Map<number, number>();

    for (let day = 90; day >= 0; day--) {
      for (const testInfo of allMachineTestsWithLots) {
        for (const shiftHour of [8, 20]) {
          if (Math.random() < 0.1) continue;

          const runDate = getRandomDate(day, shiftHour);
          const performedBy = allUsers[Math.floor(Math.random() * allUsers.length)].id;

          runData.push({
            machineId: testInfo.machineId,
            testId: testInfo.testId,
            performedBy,
            runDate,
          });
          runLotsMap.push(testInfo.lots);
        }
      }
    }

    console.log(`Inserting ${runData.length} QC Runs...`);
    const insertedRuns = await batchInsert(db, qualityControlRuns, runData, 5000);

    console.log('Generating Results for the inserted runs...');
    const resultsData: any[] = [];
    for (let i = 0; i < insertedRuns.length; i++) {
      const run = insertedRuns[i];
      const lots: any[] = runLotsMap[i];

      for (const lot of lots) {
        const isAnomaly = Math.random() < 0.05;
        const anomalyMultiplier = isAnomaly ? (Math.random() > 0.5 ? (Math.random() * 1.5 + 2.5) : -(Math.random() * 1.5 + 2.5)) : 0;

        const measuredValue = isAnomaly
            ? gaussianRandom(lot.mean + (anomalyMultiplier * lot.standardDeviation), lot.standardDeviation * 0.6)
            : gaussianRandom(lot.mean, lot.standardDeviation * 0.8);

        const zScore = (measuredValue - lot.mean) / lot.standardDeviation;
        const previousZ = previousZMap.get(lot.id) || 0;

        const { status, rule } = evaluateWestgard(zScore, previousZ);
        previousZMap.set(lot.id, zScore);

        resultsData.push({
          runId: run.id,
          lotId: lot.id,
          measuredValue: parseFloat(measuredValue.toFixed(4)),
          zScore: parseFloat(zScore.toFixed(4)),
          status,
          violatedRule: rule,
          comments: isAnomaly ? 'Instrument drift detected. Recalibration might be required.' : null,
        });
      }
    }

    console.log(`Inserting ${resultsData.length} QC Results...`);
    const insertedResults = await batchInsert(db, qualityControlResults, resultsData, 5000);

    // 5. Generate Alerts
    console.log('Generating Alerts for deviations...');
    const alertRows: any[] = [];

    const runDateMap = new Map<number, Date>();
    for (const r of insertedRuns) {
      runDateMap.set(r.id, r.runDate);
    }

    for (const res of insertedResults) {
      if (res.status === 'FAIL' || res.status === 'WARNING') {
         alertRows.push({
            type: 'QC_DEVIATION',
            priority: res.status === 'FAIL' ? 'HIGH' : 'MEDIUM',
            message: `QC result for lot ID ${res.lotId} is ${res.status} (|Z|=${Math.abs(res.zScore).toFixed(2)}).`,
            ruleViolated: res.violatedRule,
            suggestedSolution: res.status === 'FAIL' ? 'Recalibrate and rerun.' : 'Monitor next run closely.',
            resultId: res.id,
            createdAt: runDateMap.get(res.runId) || new Date(),
         });
      }
    }
    console.log(`Inserting ${alertRows.length} Alerts...`);
    const insertedAlerts = await batchInsert(db, alerts, alertRows, 5000);

    console.log('Assigning Alerts to users...');
    const usersToAlertsRows: any[] = [];
    for (const alert of insertedAlerts) {
      usersToAlertsRows.push({ userId: adminUser.id, alertId: alert.id, status: 'UNSEEN' });
      const randomTech = allTechs[Math.floor(Math.random() * allTechs.length)];
      usersToAlertsRows.push({ userId: randomTech.id, alertId: alert.id, status: 'UNSEEN' });
    }
    await batchInsert(db, usersToAlerts, usersToAlertsRows, 5000);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('🔑 USER CREDENTIALS FOR LOGIN:');
    console.log(`All users share the same password:  ${plainTextPassword}`);
    console.log(` - Admin: ${adminUser.email} (ADMIN)`);
    console.log(` - Tech 1: ${allTechs[0].email} (TECHNICIAN)`);
    console.log(` - Tech 2: ${allTechs[1].email} (TECHNICIAN)`);
    console.log('...and more! Enjoy your massive simulation dataset.');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
