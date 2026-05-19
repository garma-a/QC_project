import { DatabaseService } from '@/database/database.service';
import { controlLots, machines, qcResults, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
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

  async createQcResult(
    createQcResultDto: CreateQcResultDto,
    status: QcStatus,
    userId: number,
  ) {
    const res = this.databaseService.db
      .insert(qcResults)
      .values({
        measuredValue: createQcResultDto.measuredValue,
        status: status,
        comments: createQcResultDto.comments,
        lotId: createQcResultDto.lotId,
        performedBy: userId,
      })
      .returning();

    return res;
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
      .select()
      .from(qcResults)
      .where(eq(qcResults.lotId, lotId))
      .orderBy(desc(qcResults.testDate));

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
}
