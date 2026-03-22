import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { QcResultsRepository } from './qc-results.repository';
import { QcStatus } from './qc-results.types';

@Injectable()
export class QcResultsService {
  constructor(private readonly qcResultsRepository: QcResultsRepository) { }

  async create(createQcResultDto: CreateQcResultDto, userId: number) {
    const lot = await this.qcResultsRepository.getLotById(
      createQcResultDto.lotId,
    );

    if (!lot) throw new NotFoundException('Control lot not found');

    if (lot.standardDeviation === null || lot.mean === null) {
      throw new BadRequestException(
        'Control lot is missing required statistical values (mean / standard deviation)',
      );
    }

    const zScore =
      (createQcResultDto.measuredValue - lot.mean) / lot.standardDeviation;
    let status = QcStatus.PASS;
    if (Math.abs(zScore) > 3) status = QcStatus.FAIL;
    else if (Math.abs(zScore) > 2) status = QcStatus.WARNING;

    const [result] = await this.qcResultsRepository.createQcResult(
      createQcResultDto,
      status,
      userId,
    );

    return result;
  }

  async findAll(lotId: number) {
    const lot = await this.qcResultsRepository.getLotById(lotId);
    if (!lot) throw new NotFoundException('Control lot not found');

    const results =
      await this.qcResultsRepository.getAllLotsTestsMachinesByLotId(lotId);

    return {
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        mean: lot.mean,
        standardDeviation: lot.standardDeviation,
        upperControlLimit: lot.upperControlLimit,
        lowerControlLimit: lot.lowerControlLimit,
        upperWarningLimit: lot.upperWarningLimit,
        lowerWarningLimit: lot.lowerWarningLimit,
        testName: results.qc_tests!.testName,
        machineName: results.machines!.name,
      },
      results,
    };
  }

  async findOne(id: number) {
    const result = await this.qcResultsRepository.getResultAndLotByResultId(id);

    if (!result) throw new NotFoundException('QC Result not found');

    if (
      result.control_lots!.mean === null ||
      result.control_lots!.standardDeviation === null
    ) {
      throw new BadRequestException(
        'Associated control lot is missing statistical data',
      );
    }

    return {
      ...result,
      zScore: Number(
        (
          (result.qc_results!.measuredValue - result.control_lots!.mean) /
          result.control_lots!.standardDeviation
        ).toFixed(2),
      ),
    };
  }
  async update(id: number, updateQcResultDto: UpdateQcResultDto) {
    const updated = await this.qcResultsRepository.updateQcResult(
      id,
      updateQcResultDto,
    );

    if (!updated)
      throw new NotFoundException(`QC Result with ID ${id} not found`);

    return this.findOne(id);
  }
}
