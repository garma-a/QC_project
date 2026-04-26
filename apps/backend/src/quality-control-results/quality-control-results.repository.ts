import { DatabaseService } from '@/database/database.service';
import {
  controlLots,
  machines,
  qualityControlResults,
  qualityControlRuns,
  qualityControlTests,
  users,
} from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { desc, eq, and, inArray, sql, gte, lte } from 'drizzle-orm';
import { QcStatus } from './quality-control-results.types';
import { UpdateQualityControlResultDto } from './dto/update-quality-control-result.dto';

@Injectable()
export class QualityControlResultsRepository {
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
      .innerJoin(qualityControlTests, eq(controlLots.testId, qualityControlTests.id))
      .innerJoin(machines, eq(qualityControlTests.machineId, machines.id))
      .where(eq(controlLots.id, lotId))
      .limit(1);

    return row?.sectionId;
  }

  async createQualityControlRun(
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
        .insert(qualityControlRuns)
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
        .insert(qualityControlResults)
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

  async updateQualityControlResult(resultId: number, updateQualityControlResultDto: UpdateQualityControlResultDto) {
    if (updateQualityControlResultDto.comments === undefined) {
      const [current] = await this.databaseService.db
        .select()
        .from(qualityControlResults)
        .where(eq(qualityControlResults.id, resultId))
        .limit(1);
      return current;
    }

    const [updated] = await this.databaseService.db
      .update(qualityControlResults)
      .set({ comments: updateQualityControlResultDto.comments })
      .where(eq(qualityControlResults.id, resultId))
      .returning();

    return updated;
  }

  async getLotTestMachineByLotId(lotId: number) {
    const [lot] = await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, lotId))
      .leftJoin(qualityControlTests, eq(controlLots.testId, qualityControlTests.id))
      .leftJoin(machines, eq(qualityControlTests.machineId, machines.id))
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
        id: qualityControlResults.id,
        measuredValue: qualityControlResults.measuredValue,
        zScore: qualityControlResults.zScore,
        violatedRule: qualityControlResults.violatedRule,
        status: qualityControlResults.status,
        comments: qualityControlResults.comments,
        runId: qualityControlResults.runId,
        lotId: qualityControlResults.lotId,
        testDate: qualityControlRuns.runDate,
        performedBy: qualityControlRuns.performedBy,
      })
      .from(qualityControlResults)
      .innerJoin(qualityControlRuns, eq(qualityControlResults.runId, qualityControlRuns.id))
      .$dynamic();

    const filters = [eq(qualityControlResults.lotId, lotId)];

    if (startDate) {
      filters.push(gte(qualityControlRuns.runDate, new Date(startDate)));
    }
    if (endDate) {
      filters.push(lte(qualityControlRuns.runDate, new Date(endDate)));
    }

    const results = await baseQuery
      .where(and(...filters))
      .orderBy(desc(qualityControlResults.id))
      .limit(safeLimit)
      .offset(safeOffset);

    return results;
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
        id: qualityControlResults.id,
        measuredValue: qualityControlResults.measuredValue,
        zScore: qualityControlResults.zScore,
        violatedRule: qualityControlResults.violatedRule,
        status: qualityControlResults.status,
        comments: qualityControlResults.comments,
        runId: qualityControlResults.runId,
        lotId: qualityControlResults.lotId,
        testDate: qualityControlRuns.runDate,
        performedBy: qualityControlRuns.performedBy,
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
        testId: qualityControlTests.id,
        testName: qualityControlTests.testName,
        machineId: machines.id,
      })
      .from(qualityControlResults)
      .innerJoin(qualityControlRuns, eq(qualityControlResults.runId, qualityControlRuns.id))
      .innerJoin(controlLots, eq(qualityControlResults.lotId, controlLots.id))
      .innerJoin(qualityControlTests, eq(controlLots.testId, qualityControlTests.id))
      .innerJoin(machines, eq(qualityControlTests.machineId, machines.id))
      .leftJoin(users, eq(qualityControlRuns.performedBy, users.id))
      .$dynamic();

    const filters: any[] = [];
    if (machineId) filters.push(eq(machines.id, machineId));
    if (startDate) filters.push(gte(qualityControlRuns.runDate, new Date(startDate)));
    if (endDate) filters.push(lte(qualityControlRuns.runDate, new Date(endDate)));

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    return query
      .orderBy(desc(qualityControlResults.id))
      .limit(safeLimit)
      .offset(safeOffset);
  }

  async getResultAndLotByResultId(resultId: number) {
    const [result] = await this.databaseService.db
      .select()
      .from(qualityControlResults)
      .where(eq(qualityControlResults.id, resultId))
      .leftJoin(controlLots, eq(qualityControlResults.lotId, controlLots.id))
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
      .select({ zScore: qualityControlResults.zScore })
      .from(qualityControlResults)
      .where(eq(qualityControlResults.lotId, lotId))
      .orderBy(desc(qualityControlResults.id))
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
        FROM quality_control_results
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
