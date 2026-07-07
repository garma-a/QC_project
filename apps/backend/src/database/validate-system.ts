import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import {
  alerts,
  controlLots,
  machines,
  qualityControlResults,
  qualityControlTests,
  users,
  usersToAlerts,
  usersToSections,
} from '@/drizzle/schema';
import { QualityControlResultsService } from '@/quality-control-results/quality-control-results.service';
import { QualityControlResultsRepository } from '@/quality-control-results/quality-control-results.repository';
import { and, eq, isNotNull, sql } from 'drizzle-orm';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const db = app.get(DatabaseService).db;
    const qualityControlResultsService = app.get(QualityControlResultsService);
    const qualityControlResultsRepository = app.get(QualityControlResultsRepository);

    const [qcCount] = await db
      .select({ c: sql<number>`count(*)` })
      .from(qualityControlResults);
    const [alertCount] = await db
      .select({ c: sql<number>`count(*)` })
      .from(alerts);
    const [utaCount] = await db
      .select({ c: sql<number>`count(*)` })
      .from(usersToAlerts);
    const [utsCount] = await db
      .select({ c: sql<number>`count(*)` })
      .from(usersToSections);

    assert(Number(qcCount.c) > 0, 'No QC results found after seed.');
    assert(Number(alertCount.c) > 0, 'No alerts found after seed.');
    assert(
      Number(utaCount.c) > 0,
      'No user-alert assignments found after seed.',
    );
    assert(
      Number(utsCount.c) > 0,
      'No user-section assignments found after seed.',
    );

    const alertSectionRows = await db
      .select({
        alertId: alerts.id,
        sectionId: machines.sectionId,
      })
      .from(alerts)
      .innerJoin(qualityControlResults, eq(alerts.resultId, qualityControlResults.id))
      .innerJoin(controlLots, eq(qualityControlResults.lotId, controlLots.id))
      .innerJoin(qualityControlTests, eq(controlLots.testId, qualityControlTests.id))
      .innerJoin(machines, eq(qualityControlTests.machineId, machines.id));

    const userSectionRows = await db
      .select({
        userId: usersToSections.userId,
        sectionId: usersToSections.sectionId,
      })
      .from(usersToSections);

    const alertRecipientRows = await db
      .select({
        alertId: usersToAlerts.alertId,
        userId: usersToAlerts.userId,
      })
      .from(usersToAlerts);

    const alertToSection = new Map<number, number>();
    for (const row of alertSectionRows)
      alertToSection.set(row.alertId, row.sectionId);

    const sectionUsers = new Map<number, Set<number>>();
    for (const row of userSectionRows) {
      const current = sectionUsers.get(row.sectionId) ?? new Set<number>();
      current.add(row.userId);
      sectionUsers.set(row.sectionId, current);
    }

    const recipientsByAlert = new Map<number, Set<number>>();
    for (const row of alertRecipientRows) {
      const current = recipientsByAlert.get(row.alertId) ?? new Set<number>();
      current.add(row.userId);
      recipientsByAlert.set(row.alertId, current);
    }

    let badRecipientCount = 0;
    let wrongRecipientCountSize = 0;

    for (const [alertId, sectionId] of alertToSection.entries()) {
      const expectedUsers = sectionUsers.get(sectionId) ?? new Set<number>();
      const actualUsers = recipientsByAlert.get(alertId) ?? new Set<number>();

      for (const userId of actualUsers) {
        if (!expectedUsers.has(userId)) badRecipientCount += 1;
      }

      if (actualUsers.size !== expectedUsers.size) {
        wrongRecipientCountSize += 1;
      }
    }

    assert(
      badRecipientCount === 0,
      `Found ${badRecipientCount} alert recipients outside their section.`,
    );
    assert(
      wrongRecipientCountSize === 0,
      `Found ${wrongRecipientCountSize} alerts where recipient count != users in section.`,
    );

    const [targetLot] = await db
      .select({
        lotId: controlLots.id,
        mean: controlLots.mean,
        standardDeviation: controlLots.standardDeviation,
        sectionId: machines.sectionId,
        machineId: machines.id,
      })
      .from(controlLots)
      .innerJoin(qualityControlTests, eq(controlLots.testId, qualityControlTests.id))
      .innerJoin(machines, eq(qualityControlTests.machineId, machines.id))
      .where(
        and(
          isNotNull(controlLots.mean),
          isNotNull(controlLots.standardDeviation),
        ),
      )
      .limit(1);

    assert(
      !!targetLot,
      'Could not find a lot with mean/standardDeviation for smoke test.',
    );

    const [performer] = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(
        usersToSections,
        and(
          eq(usersToSections.userId, users.id),
          eq(usersToSections.sectionId, targetLot.sectionId),
        ),
      )
      .limit(1);

    assert(
      !!performer,
      'Could not find a performer user assigned to target lot section.',
    );

    const sectionRecipients =
      sectionUsers.get(targetLot.sectionId) ?? new Set<number>();
    assert(sectionRecipients.size > 0, 'Target section has no users assigned.');

    const beforeAlertCount = Number(
      (await db.select({ c: sql<number>`count(*)` }).from(alerts))[0].c,
    );
    const beforeUtaCount = Number(
      (await db.select({ c: sql<number>`count(*)` }).from(usersToAlerts))[0].c,
    );

    const measuredValue =
      Number(targetLot.mean) + Number(targetLot.standardDeviation) * 4;
    const createdResult = await qualityControlResultsService.create(
      {
        machineId: targetLot.machineId,
        results: [
          {
            lotId: targetLot.lotId,
            measuredValue,
            comments: 'System validation smoke test',
          }
        ]
      },
      performer.id,
    );

    assert(
      createdResult.results[0].status === 'FAIL',
      'Smoke test result should be FAIL for 4 SD deviation.',
    );

    const afterAlertCount = Number(
      (await db.select({ c: sql<number>`count(*)` }).from(alerts))[0].c,
    );
    const afterUtaCount = Number(
      (await db.select({ c: sql<number>`count(*)` }).from(usersToAlerts))[0].c,
    );

    assert(
      afterAlertCount === beforeAlertCount + 1,
      'Smoke test did not create exactly one alert.',
    );
    assert(
      afterUtaCount === beforeUtaCount + sectionRecipients.size,
      'Smoke test did not assign alert to all users in the section.',
    );

    const smokeSectionId = await qualityControlResultsRepository.getSectionIdByLotId(
      targetLot.lotId,
    );
    assert(
      smokeSectionId === targetLot.sectionId,
      'Section resolution by lot does not match expected section.',
    );

    console.log('VALIDATION_OK');
    console.log(
      JSON.stringify(
        {
          qualityControlResults: Number(qcCount.c),
          alerts: Number(alertCount.c),
          usersToAlerts: Number(utaCount.c),
          usersToSections: Number(utsCount.c),
          checkedAlerts: alertToSection.size,
          smokeTestSectionUsers: sectionRecipients.size,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('VALIDATION_FAILED');
  console.error(err);
  process.exit(1);
});
