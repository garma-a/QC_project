import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import { like, or, inArray } from 'drizzle-orm';
import {
  users,
  machines,
  qcTests,
  controlLots,
  qcResults,
  qcRuns,
  alerts,
  usersToAlerts,
} from '@/drizzle/schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const db = databaseService.db;

  try {
    console.log('🧹 Starting cleanup of benchmark data...');

    // 1. Delete Users To Alerts for Benchmark Alerts
    const deletedUsersToAlerts = await db.delete(usersToAlerts).where(
      like(usersToAlerts.resolutionNote, '%benchmark%')
    ).returning();
    console.log(`Deleted ${deletedUsersToAlerts.length} benchmark users_to_alerts resolutions.`);

    // 2. Delete Benchmark QC Results
    const benchmarkResults = await db.delete(qcResults).where(
      or(
        like(qcResults.comments, '%Benchmark%'),
        like(qcResults.comments, '%benchmark%')
      )
    ).returning();
    console.log(`Deleted ${benchmarkResults.length} benchmark QC results.`);

    // 3. Delete Benchmark Control Lots
    const deletedLots = await db.delete(controlLots).where(
      like(controlLots.lotNumber, 'BNCH-LOT-%')
    ).returning();
    console.log(`Deleted ${deletedLots.length} benchmark control lots.`);

    // 4. Delete Benchmark QC Tests
    const deletedTests = await db.delete(qcTests).where(
      like(qcTests.testName, '%Bench%')
    ).returning();
    console.log(`Deleted ${deletedTests.length} benchmark QC tests.`);

    // 5. Delete Benchmark Machines
    const deletedMachines = await db.delete(machines).where(
      like(machines.name, 'Benchmark Auto-Analyzer%')
    ).returning();
    console.log(`Deleted ${deletedMachines.length} benchmark machines.`);

    // 6. Delete Benchmark Users
    const deletedUsers = await db.delete(users).where(
      or(
        like(users.email, 'newuser_%'),
        like(users.email, 'bench_%')
      )
    ).returning();
    console.log(`Deleted ${deletedUsers.length} benchmark users.`);

    console.log('✨ Benchmark data cleanup successfully completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
