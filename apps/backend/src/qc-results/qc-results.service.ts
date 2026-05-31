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
import { QcResultItemDto } from './dto/create-qc-result.dto';
import { controlLots } from '@/drizzle/schema';

/** Typed shape of a fully evaluated result item before persisting */
interface EvaluatedResultItem {
  lot: typeof controlLots.$inferSelect;
  resultItem: QcResultItemDto;
  zScore: number;
  status: QcStatus;
  violatedRule: string | null;
  suggestedSolution: string;
}

@Injectable()
export class QcResultsService {
  constructor(
    private readonly qcResultsRepository: QcResultsRepository,
    private readonly alertsService: AlertsService,
    private readonly usersRepository: UsersRepository,
  ) { }

  async create(createQcResultDto: CreateQcResultDto, userId: number) {
    const evaluatedResults: EvaluatedResultItem[] = [];

    // 1. Loop through every result in the Run Payload
    for (const resultItem of createQcResultDto.results) {
      const lot = await this.qcResultsRepository.getLotById(resultItem.lotId);
      if (!lot) throw new NotFoundException(`Control lot ${resultItem.lotId} not found`);

      if (lot.standardDeviation === null || lot.mean === null) {
        throw new BadRequestException(
          `Control lot ${lot.lotNumber} is missing required statistical values`,
        );
      }

      if (!Number.isFinite(lot.mean) || !Number.isFinite(lot.standardDeviation) || lot.standardDeviation <= 0) {
        throw new BadRequestException(
          `Control lot ${lot.lotNumber} has invalid statistical values`,
        );
      }

      // 2. Compute the current z-score
      const zScore = (resultItem.measuredValue - lot.mean) / lot.standardDeviation;

      // 3. Fetch the last WESTGARD_HISTORY_SIZE z-scores, newest-first
      const priorZScores = await this.qcResultsRepository.getRecentZScoresByLotId(
        resultItem.lotId,
        WESTGARD_HISTORY_SIZE,
      );

      // 4. Build the window: current point first, then history
      const zScoreWindow = [zScore, ...priorZScores];

      // 5. Evaluate Westgard rules (Currently only Single-Lot, Multi-Lot coming soon!)
      const { status, violatedRule, suggestedSolution } = evaluateWestgardRules(zScoreWindow);

      evaluatedResults.push({
        lot,
        resultItem,
        zScore,
        status: status as QcStatus,
        violatedRule,
        suggestedSolution,
      });
    }

    // 6. Persist the entire RUN and all RESULTS in one atomic database transaction!
    const savedRunData = await this.qcResultsRepository.createQcRun(
      createQcResultDto.machineId,
      userId,
      evaluatedResults.map((e) => ({
        lotId: e.resultItem.lotId,
        measuredValue: e.resultItem.measuredValue,
        zScore: e.zScore,
        status: e.status,
        violatedRule: e.violatedRule ?? null,
        comments: e.resultItem.comments,
      })),
    );

    // 7. Fire alerts for any WARNING or FAIL results in this run
    for (let i = 0; i < evaluatedResults.length; i++) {
      const e = evaluatedResults[i];
      const savedResult = savedRunData.results[i]; // Matches index exactly

      if (e.status === QcStatus.WARNING || e.status === QcStatus.FAIL) {
        const absZScore = Number(Math.abs(e.zScore).toFixed(2));
        const alertPriority = e.status === QcStatus.FAIL ? AlertPriority.HIGH : AlertPriority.MEDIUM;

        const sectionId = await this.qcResultsRepository.getSectionIdByLotId(e.resultItem.lotId);
        const sectionUserIds = sectionId ? await this.usersRepository.getUserIdsBySectionId(sectionId) : [];

        await this.alertsService.createForUsers(
          {
            resultId: savedResult.id,
            type: 'QC_DEVIATION',
            priority: alertPriority,
            message: `QC result for lot ${e.lot.lotNumber} is ${e.status} (|Z|=${absZScore}).`,
            ruleViolated: e.violatedRule ?? undefined,
            suggestedSolution: e.suggestedSolution,
          },
          sectionUserIds,
        );
      }
    }

    return savedRunData;
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
