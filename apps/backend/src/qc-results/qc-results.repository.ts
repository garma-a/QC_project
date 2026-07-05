import { DatabaseService } from '@/database/database.service';
import {
  controlLots,
  machines,
  qcResults,
  qcRuns,
  qcTests,
  users,
} from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { desc, eq, and, inArray, sql, gte, lte } from 'drizzle-orm';
import { QcStatus } from './qc-results.types';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';

@Injectable()
export class QcResultsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getLotById(lotId: number) {
    const [lot] = await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, lotId));
    return lot;
  }

  async getLotsByIds(lotIds: number[]) {
    if (lotIds.length === 0) return [];
    return this.databaseService.db
      .select()
      .from(controlLots)
      .where(inArray(controlLots.id, lotIds));
  }

  async getActiveLotsByTestId(testId: number) {
    return this.databaseService.db
      .select({ id: controlLots.id, lotNumber: controlLots.lotNumber })
      .from(controlLots)
      .where(
        and(eq(controlLots.testId, testId), eq(controlLots.isActive, true)),
      );
  }

  async getSectionIdByLotId(lotId: number) {
    const [row] = await this.databaseService.db
      .select({ sectionId: machines.sectionId })
      .from(controlLots)
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .innerJoin(machines, eq(qcTests.machineId, machines.id))
      .where(eq(controlLots.id, lotId))
      .limit(1);

    return row?.sectionId;
  }

  async createQcRun(
    machineId: number,
    testId: number,
    userId: number,
    results: {
      lotId: number;
      measuredValue: number;
      zScore: number;
      status: QcStatus;
      violatedRule: string | null;
      comments?: string;
    }[],
  ) {
    return this.databaseService.db.transaction(async (tx) => {
      // 1. Insert the Run
      const [run] = await tx
        .insert(qcRuns)
        .values({
          machineId,
          testId,
          performedBy: userId,
        })
        .returning();

      // 1.5 Update the Machine's lastRunAt timestamp
      if (run.runDate) {
        await tx
          .update(machines)
          .set({ lastRunAt: run.runDate })
          .where(eq(machines.id, machineId));
      }

      // 2. Insert all results tied to this Run
      const insertedResults = await tx
        .insert(qcResults)
        .values(
          results.map((r) => ({
            runId: run.id,
            lotId: r.lotId,
            measuredValue: r.measuredValue,
            zScore: r.zScore,
            status: r.status,
            violatedRule: r.violatedRule ?? undefined,
            comments: r.comments,
          })),
        )
        .returning();

      return { run, results: insertedResults };
    });
  }

  async updateQcResult(resultId: number, updateQcResultDto: UpdateQcResultDto) {
    if (updateQcResultDto.comments === undefined) {
      const [current] = await this.databaseService.db
        .select()
        .from(qcResults)
        .where(eq(qcResults.id, resultId))
        .limit(1);
      return current;
    }

    const [updated] = await this.databaseService.db
      .update(qcResults)
      .set({ comments: updateQcResultDto.comments })
      .where(eq(qcResults.id, resultId))
      .returning();

    return updated;
  }

  async getLotTestMachineByLotId(lotId: number) {
    const [lot] = await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, lotId))
      .leftJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .leftJoin(machines, eq(qcTests.machineId, machines.id))
      .limit(1);

    return lot;
  }

  async getResultsByLotId(
    lotId: number,
    limit?: number,
    offset?: number,
    startDate?: string,
    endDate?: string,
  ) {
    let safeLimit = limit ?? 100;

    // Safety constraint: If historical date range is requested, max out at 500 points to prevent crashes.
    if (startDate && endDate) {
      safeLimit = Math.max(1, Math.min(limit ?? 500, 500));
    } else {
      safeLimit = Math.max(1, Math.min(limit ?? 100, 500));
    }

    const safeOffset = Math.max(0, offset ?? 0);

    const baseQuery = this.databaseService.db
      .select({
        id: qcResults.id,
        measuredValue: qcResults.measuredValue,
        zScore: qcResults.zScore,
        violatedRule: qcResults.violatedRule,
        status: qcResults.status,
        comments: qcResults.comments,
        runId: qcResults.runId,
        lotId: qcResults.lotId,
        testDate: qcRuns.runDate,
        performedBy: qcRuns.performedBy,
      })
      .from(qcResults)
      .innerJoin(qcRuns, eq(qcResults.runId, qcRuns.id))
      .$dynamic();

    const filters = [eq(qcResults.lotId, lotId)];

    if (startDate) {
      filters.push(gte(qcRuns.runDate, new Date(startDate)));
    }
    if (endDate) {
      filters.push(lte(qcRuns.runDate, new Date(endDate)));
    }

    const results = await baseQuery
      .where(and(...filters))
      .orderBy(desc(qcResults.id))
      .limit(safeLimit)
      .offset(safeOffset);

    return results;
  }

  async getRecentResultsAll() {
    const query = sql`
      SELECT
        r.id as id,
        r.measured_value as "measuredValue",
        r.z_score as "zScore",
        r.violated_rule as "violatedRule",
        r.status as status,
        r.comments as comments,
        r.run_id as "runId",
        r.lot_id as "lotId",
        run.run_date as "testDate",
        run.performed_by as "performedBy",
        l.lot_number as "lotNumber",
        l.mean as "lotMean",
        l.standard_deviation as "lotSd",
        l.level as "lotLevel",
        l.lower_control_limit as "lowerControlLimit",
        l.upper_control_limit as "upperControlLimit",
        t.id as "testId",
        t.test_name as "testName",
        m.id as "machineId"
      FROM control_lots l
      CROSS JOIN LATERAL (
        SELECT id, measured_value, z_score, violated_rule, status, comments, run_id, lot_id
        FROM qc_results qr
        WHERE qr.lot_id = l.id
        ORDER BY qr.id DESC
        LIMIT 1
      ) r
      JOIN qc_runs run ON r.run_id = run.id
      JOIN qc_tests t ON l.test_id = t.id
      JOIN machines m ON t.machine_id = m.id
      ORDER BY run.run_date DESC
    `;
    const result: any = await this.databaseService.db.execute(query);
    return result.rows || result;
  }

  /**
   * Returns the latest QC results, enriched with lot/test/machine context via SQL JOINs.
   *
   * By embedding machineId, testName, lotNumber, mean, SD, etc. here, the frontend
   * no longer needs to cross-reference lots and tests — completely eliminating the
   * pagination bug that caused empty dashboards.
   *
   * Scalability cap: default 100 results, hard max 500 per call.
   * For 100K+ rows, this still returns only the latest 100/N rows \u2014 fast and lightweight.
   */
  async getPaginatedResults(
    limit?: number,
    offset?: number,
    machineId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const safeLimit = Math.max(1, Math.min(limit ?? 100, 500));
    const safeOffset = Math.max(0, offset ?? 0);
    let query = this.databaseService.db
      .select({
        // Core result fields
        id: qcResults.id,
        measuredValue: qcResults.measuredValue,
        zScore: qcResults.zScore,
        violatedRule: qcResults.violatedRule,
        status: qcResults.status,
        comments: qcResults.comments,
        runId: qcResults.runId,
        lotId: qcResults.lotId,
        testDate: qcRuns.runDate,
        performedBy: qcRuns.performedBy,
        performedByFirstName: users.firstName,
        performedByLastName: users.lastName,
        // Enriched: lot context
        lotNumber: controlLots.lotNumber,
        lotMean: controlLots.mean,
        lotSd: controlLots.standardDeviation,
        lotLevel: controlLots.level,
        lowerControlLimit: controlLots.lowerControlLimit,
        upperControlLimit: controlLots.upperControlLimit,
        // Enriched: test + machine context
        testId: qcTests.id,
        testName: qcTests.testName,
        machineId: machines.id,
      })
      .from(qcResults)
      .innerJoin(qcRuns, eq(qcResults.runId, qcRuns.id))
      .innerJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .innerJoin(machines, eq(qcTests.machineId, machines.id))
      .leftJoin(users, eq(qcRuns.performedBy, users.id))
      .$dynamic();

    const filters: any[] = [];
    if (machineId) filters.push(eq(machines.id, machineId));
    if (startDate) filters.push(gte(qcRuns.runDate, new Date(startDate)));
    if (endDate) filters.push(lte(qcRuns.runDate, new Date(endDate)));

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    return query
      .orderBy(desc(qcResults.id))
      .limit(safeLimit)
      .offset(safeOffset);
  }

  async getResultAndLotByResultId(resultId: number) {
    const [result] = await this.databaseService.db
      .select()
      .from(qcResults)
      .where(eq(qcResults.id, resultId))
      .leftJoin(controlLots, eq(qcResults.lotId, controlLots.id))
      .limit(1);
    return result;
  }

  async getRecentZScoresByLotId(
    lotId: number,
    limit: number,
  ): Promise<number[]> {
    // Returns last `limit` z-scores ordered newest-first
    // so they align with zScores[1], zScores[2], ... in the evaluator
    const rows = await this.databaseService.db
      .select({ zScore: qcResults.zScore })
      .from(qcResults)
      .where(eq(qcResults.lotId, lotId))
      .orderBy(desc(qcResults.id))
      .limit(limit);

    return rows.map((r) => r.zScore);
  }

  async getRecentZScoresByLotIds(
    lotIds: number[],
    limitPerLot: number,
  ): Promise<Map<number, number[]>> {
    if (lotIds.length === 0) return new Map<number, number[]>();

    const idsList = sql.join(lotIds, sql`, `);
    const query = sql`
      WITH RankedScores AS (
        SELECT lot_id as "lotId", z_score as "zScore",
               ROW_NUMBER() OVER(PARTITION BY lot_id ORDER BY id DESC) as rn
        FROM qc_results
        WHERE lot_id IN (${idsList})
      )
      SELECT "lotId", "zScore" FROM RankedScores WHERE rn <= ${limitPerLot} ORDER BY "lotId", rn ASC
    `;
    const result: any = await this.databaseService.db.execute(query);
    const rows = result.rows || result;

    const map = new Map<number, number[]>();
    for (const id of lotIds) map.set(id, []);
    for (const row of rows) {
      map.get(row.lotId)?.push(row.zScore);
    }
    return map;
  }
}
