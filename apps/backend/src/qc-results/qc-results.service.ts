import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { QcResultsRepository } from './qc-results.repository';
import { QcStatus } from './qc-results.types';
import { AlertsService } from '@/alerts/alerts.service';
import { AlertPriority } from '@/alerts/alerts.types';
import { UsersRepository } from '@/users/users.repository';
import { evaluateWestgardRules, WESTGARD_HISTORY_SIZE, RunResultItem } from './westgard.utils';
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
  private readonly logger = new Logger(QcResultsService.name);
  public readonly qcResultEvents$ = new Subject<any>();

  constructor(
    private readonly qcResultsRepository: QcResultsRepository,
    private readonly alertsService: AlertsService,
    private readonly usersRepository: UsersRepository,
  ) { }

  async create(createQcResultDto: CreateQcResultDto, userId: number) {
    if (!createQcResultDto.results || createQcResultDto.results.length === 0) {
      throw new BadRequestException('A QC run must contain at least one result');
    }

    const evaluatedResults: EvaluatedResultItem[] = [];

    // Cache to avoid duplicate database lookups between passes
    const lotMap = new Map<number, typeof controlLots.$inferSelect>();
    const currentZScoreMap = new Map<number, number>();

    // 0. PRE-VALIDATION: Check that the run contains ALL active lots for the test
    const firstLot = await this.qcResultsRepository.getLotById(createQcResultDto.results[0].lotId);
    if (!firstLot) throw new NotFoundException(`Control lot ${createQcResultDto.results[0].lotId} not found`);
    const testId = firstLot.testId;

    // Validate that the run's machineId matches the machine owning this QC test
    const lotContext = await this.qcResultsRepository.getLotTestMachineByLotId(firstLot.id);
    const expectedMachineId = lotContext?.qc_tests?.machineId;
    if (!expectedMachineId) throw new NotFoundException(`QC test for lot ${firstLot.id} not found`);
    if (createQcResultDto.machineId !== expectedMachineId) {
      throw new BadRequestException(
        `Invalid QC Run: machineId ${createQcResultDto.machineId} does not match QC test machine ${expectedMachineId}.`,
      );
    }

    const activeLots = await this.qcResultsRepository.getActiveLotsByTestId(testId);
    // Ensure every active lot was submitted
    for (const activeLot of activeLots) {
      if (!createQcResultDto.results.some((r) => r.lotId === activeLot.id)) {
        throw new BadRequestException(
          `Incomplete QC Run: Missing result for active lot ${activeLot.lotNumber} (ID: ${activeLot.id}). All active lots must be run together.`
        );
      }
    }

    // Ensure no submitted result belongs to a DIFFERENT test
    for (const resultItem of createQcResultDto.results) {
      if (!activeLots.some((l) => l.id === resultItem.lotId)) {
        throw new BadRequestException(
          `Invalid QC Run: Lot ${resultItem.lotId} does not belong to the active lots for test ID ${testId}.`
        );
      }
    }

    // 1. FIRST PASS: Validate statistics and compute current Z-scores for ALL items.
    //    We must do this before any rule evaluation so that the complete run context
    //    exists before Level 1 is checked — otherwise Level 1 is evaluated blind to
    //    Level 2's z-score, making cross-material rules like R_4s clinically incorrect.
    const completeRunContext: RunResultItem[] = [];

    // BATCH FETCH ALL LOTS
    const lotIds = [...new Set(createQcResultDto.results.map((r) => r.lotId))];
    const lotsList = await this.qcResultsRepository.getLotsByIds(lotIds);
    for (const lot of lotsList) lotMap.set(lot.id, lot);

    for (const resultItem of createQcResultDto.results) {
      const lot = lotMap.get(resultItem.lotId);
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

      const zScore = (resultItem.measuredValue - lot.mean) / lot.standardDeviation;

      // Store in maps and complete batch context
      currentZScoreMap.set(resultItem.lotId, zScore);
      completeRunContext.push({ lotId: resultItem.lotId, zScore });
    }

    // 2. SECOND PASS: Run Westgard analysis using the complete run layout.
    //    Every lot now has full omniscient visibility of all other levels' z-scores.
    
    // BATCH FETCH ALL PREVIOUS Z-SCORES
    const allPriorZScoresMap = await this.qcResultsRepository.getRecentZScoresByLotIds(
      lotIds,
      WESTGARD_HISTORY_SIZE
    );

    for (const resultItem of createQcResultDto.results) {
      const lot = lotMap.get(resultItem.lotId)!;
      const zScore = currentZScoreMap.get(resultItem.lotId)!;

      // Fetch historical data for this specific lot over time from our batch map
      const priorZScores = allPriorZScoresMap.get(resultItem.lotId) ?? [];

      const zScoreWindow = [zScore, ...priorZScores];

      // Evaluate using the full, omniscient run context
      const { status, violatedRule, suggestedSolution } = evaluateWestgardRules(
        zScoreWindow,
        completeRunContext,
        resultItem.lotId,
      );

      evaluatedResults.push({
        lot,
        resultItem,
        zScore,
        status: status as QcStatus,
        violatedRule,
        suggestedSolution,
      });
    }

    // 3. THIRD PASS: Persist the entire RUN and all RESULTS atomically
    const savedRunData = await this.qcResultsRepository.createQcRun(
      createQcResultDto.machineId,
      evaluatedResults[0].lot.testId, // All lots in the run belong to the same test
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

    // 4. FOURTH PASS: Fire alerts for any WARNING or FAIL statuses
    try {
      for (let i = 0; i < evaluatedResults.length; i++) {
        const e = evaluatedResults[i];
        // Ensure we grab the exact inserted result by lotId, because PostgreSQL's INSERT...RETURNING 
        // does not guarantee the returned array is in the same order as the inserted array!
        const savedResult = savedRunData.results.find(r => r.lotId === e.resultItem.lotId);

        if (!savedResult) continue; // Safety check

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
    } catch (error) {
      this.logger.error('Non-fatal error: Failed to generate alerts for QC Run', error);
    }

    if (savedRunData?.results) {
      const sectionId = await this.qcResultsRepository.getSectionIdByLotId(savedRunData.results[0].lotId);
      for (const result of savedRunData.results) {
        this.qcResultEvents$.next({ type: 'create', data: result, sectionId });
      }
    }

    return savedRunData;
  }

  async findAll(lotId?: number, limit?: number, offset?: number, machineId?: number, startDate?: string, endDate?: string) {
    if (lotId) {
      const lot = await this.qcResultsRepository.getLotById(lotId);
      if (!lot) throw new NotFoundException('Control lot not found');

      const lotContext =
        await this.qcResultsRepository.getLotTestMachineByLotId(lotId);
      const results = await this.qcResultsRepository.getResultsByLotId(lotId, limit, offset, startDate, endDate);

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
    } else {
      const parsedLimit = limit ?? 50;
      const parsedOffset = offset ?? 0;
      const results = await this.qcResultsRepository.getPaginatedResults(parsedLimit, parsedOffset, machineId);
      return { lot: null, results };
    }
  }

  async getRecentAll() {
    const results = await this.qcResultsRepository.getRecentResultsAll();
    return { lot: null, results };
  }

  async findOne(id: number) {
    const result = await this.qcResultsRepository.getResultAndLotByResultId(id);

    if (!result) throw new NotFoundException('QC Result not found');

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

    const updatedResult = await this.findOne(id);
    const sectionId = await this.qcResultsRepository.getSectionIdByLotId(updatedResult.qc_results!.lotId);
    this.qcResultEvents$.next({ type: 'update', data: updatedResult, sectionId });
    return updatedResult;
  }
}
