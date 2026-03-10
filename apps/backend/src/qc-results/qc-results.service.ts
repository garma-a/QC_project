import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { controlLots, qcResults } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class QcResultsService {
  constructor(private readonly database: DatabaseService) { }

  async create(createQcResultDto: CreateQcResultDto, userId: number) {
    const [lot] = await this.database.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, createQcResultDto.lotId));

    if (!lot) throw new NotFoundException

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

  findAll() {
    return `This action returns all qcResults`;
  }

  findOne(id: number) {
    return `This action returns a #${id} qcResult`;
  }

  update(id: number, updateQcResultDto: UpdateQcResultDto) {
    return `This action updates a #${id} qcResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} qcResult`;
  }
}
