import { DatabaseService } from '@/database/database.service';
import { controlLots, machines, qcResults, qcRuns, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { QcStatus } from './qc-results.types';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';

@Injectable()
export class QcResultsRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async getLotById(lotId: number) {
    const [lot] = await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, lotId))
      .limit(1);
    return lot;
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
    return await this.databaseService.db.transaction(async (tx) => {
      // 1. Insert the Run
      const [run] = await tx
        .insert(qcRuns)
        .values({
          machineId,
          performedBy: userId,
        })
        .returning();

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

  async getResultsByLotId(lotId: number) {
    const results = await this.databaseService.db
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
      })
      .from(qcResults)
      .innerJoin(qcRuns, eq(qcResults.runId, qcRuns.id))
      .where(eq(qcResults.lotId, lotId))
      .orderBy(desc(qcRuns.runDate));

    return results;
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

  async getRecentZScoresByLotId(lotId: number, limit: number): Promise<number[]> {
    // Returns last `limit` z-scores ordered newest-first
    // so they align with zScores[1], zScores[2], ... in the evaluator
    const rows = await this.databaseService.db
      .select({ zScore: qcResults.zScore })
      .from(qcResults)
      .innerJoin(qcRuns, eq(qcResults.runId, qcRuns.id))
      .where(eq(qcResults.lotId, lotId))
      .orderBy(desc(qcRuns.runDate))
      .limit(limit);
    return rows.map(r => r.zScore);
  }

}
