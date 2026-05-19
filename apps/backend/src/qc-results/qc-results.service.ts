import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { QcResultsRepository } from './qc-results.repository';
import { QcStatus } from './qc-results.types';
import { AlertsService } from '@/alerts/alerts.service';
import { AlertPriority } from '@/alerts/alerts.types';
import { UsersRepository } from '@/users/users.repository';

@Injectable()
export class QcResultsService {
  constructor(
    private readonly qcResultsRepository: QcResultsRepository,
    private readonly alertsService: AlertsService,
    private readonly usersRepository: UsersRepository,
  ) { }

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

    if (status === QcStatus.WARNING || status === QcStatus.FAIL) {

      const absZScore = Number(Math.abs(zScore).toFixed(2));
      const alertPriority =
        status === QcStatus.FAIL ? AlertPriority.HIGH : AlertPriority.MEDIUM;
      const ruleViolated =
        status === QcStatus.FAIL ? '1_3s (Violation)' : '1_2s (Warning)';
      const sectionId = await this.qcResultsRepository.getSectionIdByLotId(
        createQcResultDto.lotId,
      );
      //this should replace with suggestion from AI model based on historical data and root cause analysis, but for now we will hardcode some common suggestions based on the type of deviation
      const suggestedSolution =
        status === QcStatus.FAIL
          ? 'Stop patient testing. Rerun control. If failure persists, recalibrate and troubleshoot the analyzer before releasing patient results.'
          : 'Repeat QC run and monitor trend. If warning repeats, inspect reagents, calibration status, and instrument maintenance logs.';
      const sectionUserIds = sectionId
        ? await this.usersRepository.getUserIdsBySectionId(sectionId)
        : [];

      await this.alertsService.createForUsers(
        {
          resultId: result.id,
          type: 'QC_DEVIATION',
          priority: alertPriority,
          message: `QC result for lot ${lot.lotNumber} is ${status} (|Z|=${absZScore}).`,
          ruleViolated,
          suggestedSolution,
        },
        sectionUserIds,
      );
    }

    return result;
  }

  async findAll(lotId: number) {
    const lot = await this.qcResultsRepository.getLotById(lotId);
    if (!lot) throw new NotFoundException('Control lot not found');

    const lotContext =
      await this.qcResultsRepository.getLotTestMachineByLotId(lotId);
    const results = await this.qcResultsRepository.getResultsByLotId(lotId);

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
        testName: lotContext?.qc_tests?.testName ?? 'Unknown Test',
        machineName: lotContext?.machines?.name ?? 'Unknown Machine',
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
