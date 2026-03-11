import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { controlLots, qcResults, qcTests, machines } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class QcResultsService {
  constructor(private readonly database: DatabaseService) { }

  async create(createQcResultDto: CreateQcResultDto, userId: number) {
    const [lot] = await this.database.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, createQcResultDto.lotId));

    if (!lot) throw new NotFoundException('Control lot not found');


    if (lot.standardDevi === null || lot.mean === null) {
      throw new BadRequestException('Control lot is missing required statistical values (mean / standard deviation)');
    }

    const zScore = (createQcResultDto.measuredValue - lot.mean) / lot.standardDevi;
    let status = 'PASS';
    if (Math.abs(zScore) > 3) status = 'FAIL';
    else if (Math.abs(zScore) > 2) status = 'WARNING';

    const [result] = await this.database.db
      .insert(qcResults)
      .values({
        measuredValue: createQcResultDto.measuredValue,
        status: status as 'PASS' | 'FAIL' | 'WARNING',
        comments: createQcResultDto.comments,
        lotId: createQcResultDto.lotId,
        performedBy: userId,
      })
      .returning();

    return result;
  }

  async findAll(lotId: number) {

    const lot = await this.database.db.query.controlLots.findFirst({
      where: eq(controlLots.id, lotId),
      with: {
        qcTest: {
          with: {
            machine: true,
          },
        },
      },
    });

    if (!lot) throw new NotFoundException('Control lot not found');

    const results = await this.database.db
      .select()
      .from(qcResults)
      .where(eq(qcResults.lotId, lotId))
      .orderBy(desc(qcResults.testDate));

    return {
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        mean: lot.mean,
        standardDevi: lot.standardDevi,
        upperControlLimit: lot.upperControlLimit,
        lowerControlLimit: lot.lowerControlLimit,
        upperWarningLimit: lot.upperWarningLimit,
        lowerWarningLimit: lot.lowerWarningLimit,
        testName: lot.qcTest.testName,
        machineName: lot.qcTest.machine.name,
      },
      results,
    };
  }

  async findOne(id: number) {
    const result = await this.database.db.query.qcResults.findFirst({
      where: eq(qcResults.id, id),
      with: {
        controlLot: true,
      },
    });

    if (!result) throw new NotFoundException('QC Result not found');

    if (result.controlLot.mean === null || result.controlLot.standardDevi === null) {
      throw new BadRequestException('Associated control lot is missing statistical data');
    }

    return {
      ...result,

      zScore: Number(
        ((result.measuredValue - result.controlLot.mean) / result.controlLot.standardDevi).toFixed(2),
      ),
    };
  }
  async update(id: number, updateQcResultDto: UpdateQcResultDto) {
    const [updated] = await this.database.db
      .update(qcResults)
      .set({ comments: updateQcResultDto.comments })
      .where(eq(qcResults.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`QC Result with ID ${id} not found`);


    return this.findOne(id);
  }

}
