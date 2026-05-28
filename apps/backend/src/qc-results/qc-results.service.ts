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
import { evaluateWestgardRules, WESTGARD_HISTORY_SIZE } from './westgard.utils';

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

    // 1. Compute the current z-score
    const zScore = (createQcResultDto.measuredValue - lot.mean) / lot.standardDeviation;

    // 2. Fetch the last WESTGARD_HISTORY_SIZE z-scores, newest-first
    const priorZScores = await this.qcResultsRepository.getRecentZScoresByLotId(
      createQcResultDto.lotId,
      WESTGARD_HISTORY_SIZE,
    );

    // 3. Build the window: current point first, then history
    //    [z_current, z_prev1, z_prev2, ..., z_prev9]
    const zScoreWindow = [zScore, ...priorZScores];

    // 4. Evaluate all 6 Westgard rules
    const { status, violatedRule, suggestedSolution } = evaluateWestgardRules(zScoreWindow);

    // 5. Persist the result with zScore and violatedRule stored
    const [result] = await this.qcResultsRepository.createQcResult(
      createQcResultDto,
      status as QcStatus,
      userId,
      zScore,
      violatedRule,
    );

    // 6. Fire an alert for WARNING or FAIL
    if (status === QcStatus.WARNING || status === QcStatus.FAIL) {
      const absZScore = Number(Math.abs(zScore).toFixed(2));
      const alertPriority =
        status === QcStatus.FAIL ? AlertPriority.HIGH : AlertPriority.MEDIUM;

      const sectionId = await this.qcResultsRepository.getSectionIdByLotId(
        createQcResultDto.lotId,
      );
      const sectionUserIds = sectionId
        ? await this.usersRepository.getUserIdsBySectionId(sectionId)
        : [];

      await this.alertsService.createForUsers(
        {
          resultId: result.id,
          type: 'QC_DEVIATION',
          priority: alertPriority,
          message: `QC result for lot ${lot.lotNumber} is ${status} (|Z|=${absZScore}).`,
          ruleViolated: violatedRule ?? undefined,
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
      zScore: result.qc_results!.zScore,
      violatedRule: result.qc_results!.violatedRule,
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
