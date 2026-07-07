import { Injectable } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QualityControlResultsService } from '@/quality-control-results/quality-control-results.service';
import { SectionsService } from '@/sections/sections.service';
import { DatabaseService } from '@/database/database.service';
import { DashboardBffResponseDto, DashboardMachineDto, DashboardCategoryDto, DashboardQcHistoryDto } from './dto/dashboard-bff.dto';
import { QcPageMachinesResponseDto, QcPageHistoryResponseDto, QcInteractiveHistoryEntryDto } from './dto/quality-control-bff.dto';

@Injectable()
export class BffService {
  constructor(
    private readonly machinesService: MachinesService,
    private readonly controlLotsService: ControlLotsService,
    private readonly qualityControlResultsService: QualityControlResultsService,
    private readonly sectionsService: SectionsService,
    private readonly databaseService: DatabaseService,
  ) { }

  private dashboardPromise: Promise<DashboardBffResponseDto> | null = null;
  private dashboardPromiseExpires = 0;

  private qcMachinesPromise: Promise<QcPageMachinesResponseDto> | null = null;
  private qcMachinesPromiseExpires = 0;

  async getDashboardData(): Promise<DashboardBffResponseDto> {
    const now = Date.now();
    if (this.dashboardPromise && now < this.dashboardPromiseExpires) {
      return this.dashboardPromise;
    }

    this.dashboardPromise = this._getDashboardData();
    this.dashboardPromiseExpires = now + 30000;
    
    this.dashboardPromise.catch(() => {
      this.dashboardPromise = null;
      this.dashboardPromiseExpires = 0;
    });

    return this.dashboardPromise;
  }

  private async _getDashboardData(): Promise<DashboardBffResponseDto> {
    const [fetchedMachines, allResultsResponse] = await Promise.all([
      this.databaseService.db.query.machines.findMany({
        // @ts-ignore: Drizzle ORM type resolution bug with Bun
        where: (machines, { eq }) => eq(machines.isActive, true),
        with: {
          section: true,
          qualityControlTests: {
            with: {
              controlLots: {
                // @ts-ignore: Drizzle ORM type resolution bug with Bun
                where: (controlLots, { eq }) => eq(controlLots.isActive, true),
              },
            },
          },
        },
      }),
      this.qualityControlResultsService.getRecentAll(),
    ]);

    const allResults = Array.isArray(allResultsResponse)
      ? allResultsResponse
      : (allResultsResponse as any).results || [];

    const categoriesMap = new Map<string, string>();
    
    // Group all results by machineId for O(1) access
    const machineQcData = new Map<number, { count: number, latestResult: any }>();
    for (const result of allResults) {
      if (!machineQcData.has(result.machineId)) {
        machineQcData.set(result.machineId, { count: 0, latestResult: result });
      }
      const data = machineQcData.get(result.machineId)!;
      data.count++;
      
      const currentLatestTime = new Date(data.latestResult.testDate).getTime();
      const newTime = new Date(result.testDate).getTime();
      if (newTime > currentLatestTime) {
        data.latestResult = result;
      }
    }

    const machines = fetchedMachines.map((machine: any) => {
      if (machine.section) {
        categoriesMap.set(machine.section.id.toString(), machine.section.name);
      }

      const tests: any[] = [];
      for (const qualityControlTest of machine.qualityControlTests) {
        for (const lot of qualityControlTest.controlLots) {
          tests.push({
            id: lot.testId.toString(),
            name: qualityControlTest.testName,
            category: qualityControlTest.testType ?? 'General',
            code: lot.testId.toString(),
            unit: 'unit',
            lowRange: lot.lowerControlLimit ?? 0,
            highRange: lot.upperControlLimit ?? 0,
            lotId: lot.id,
            level: lot.level ?? 1,
            lotNumber: lot.lotNumber,
            mean: lot.mean ?? 0,
            standardDeviation: lot.standardDeviation ?? 0,
            isActive: lot.isActive ?? true,
          });
        }
      }

      const qcData = machineQcData.get(machine.id);
      let lastQC: { date: string; status: string } | undefined = undefined;
      
      if (qcData?.latestResult) {
        const statusMap: Record<string, string> = {
          'PASS': 'pass',
          'WARNING': 'warning',
          'FAIL': 'fail'
        };
        lastQC = {
          date: new Date(qcData.latestResult.testDate as string).toLocaleString(),
          status: statusMap[qcData.latestResult.status] || 'fail',
        };
      }

      return {
        ...machine,
        id: machine.id.toString(),
        name: machine.name,
        category: machine.section?.id.toString() ?? '',
        model: machine.hospitalCode ?? '',
        testsToday: qcData?.count ?? 0,
        lastQC,
        tests,
      };
    });

    const categories = Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }));

    return {
      machines,
      categories,
      qcHistory: [], // Emptied out to prevent massive 7380+ record payload on initial dashboard load
    };
  }

  private dashboardHistoryCache = new Map<number, { promise: Promise<DashboardQcHistoryDto[]>, expires: number }>();

  async getDashboardMachineHistory(machineId: number): Promise<DashboardQcHistoryDto[]> {
    const now = Date.now();
    const cached = this.dashboardHistoryCache.get(machineId);
    if (cached && now < cached.expires) {
      return cached.promise;
    }

    const promise = this._getDashboardMachineHistory(machineId);
    this.dashboardHistoryCache.set(machineId, { promise, expires: now + 30000 });
    
    promise.catch(() => this.dashboardHistoryCache.delete(machineId));
    return promise;
  }

  private async _getDashboardMachineHistory(machineId: number): Promise<DashboardQcHistoryDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    // Limit to 500 records max for the machine over the last 30 days
    const paginatedResponse = await this.qualityControlResultsService.findAll(undefined, 500, 0, machineId, startDate, undefined);
    const allResults = Array.isArray(paginatedResponse) ? paginatedResponse : ('results' in paginatedResponse ? paginatedResponse.results : []);

    return allResults.map((result: any): DashboardQcHistoryDto => {
        const dateObj = new Date(result.testDate as string);
        const dateStr = !Number.isNaN(dateObj.getTime())
          ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'N/A N/A';

        return {
          ...result,
          level: result.lotLevel ?? 1,
          lotMean: result.lotMean ?? 0,
          lotSd: result.lotSd ?? 1,
          expectedRange: `${result.lowerControlLimit ?? 0} - ${result.upperControlLimit ?? 0}`,
          date: dateStr,
        };
    });
  }

  async getQcPageMachines(): Promise<QcPageMachinesResponseDto> {
    const now = Date.now();
    if (this.qcMachinesPromise && now < this.qcMachinesPromiseExpires) {
      return this.qcMachinesPromise;
    }

    this.qcMachinesPromise = this._getQcPageMachines();
    this.qcMachinesPromiseExpires = now + 30000;
    
    this.qcMachinesPromise.catch(() => {
      this.qcMachinesPromise = null;
      this.qcMachinesPromiseExpires = 0;
    });

    return this.qcMachinesPromise;
  }

  private async _getQcPageMachines(): Promise<QcPageMachinesResponseDto> {
    const fetchedMachines = await this.databaseService.db.query.machines.findMany({
      // @ts-ignore: Drizzle ORM type resolution bug with Bun
      where: (machines, { eq }) => eq(machines.isActive, true),
      with: {
        section: true,
        qualityControlTests: {
          with: {
            controlLots: {
              // @ts-ignore: Drizzle ORM type resolution bug with Bun
              where: (controlLots, { eq }) => eq(controlLots.isActive, true),
            },
          },
        },
      },
    });

    const categoriesMap = new Map<string, string>();

    const machines = fetchedMachines.map((machine: any) => {
      if (machine.section) {
        categoriesMap.set(machine.section.id.toString(), machine.section.name);
      }

      const tests: any[] = [];
      for (const qualityControlTest of machine.qualityControlTests) {
        for (const lot of qualityControlTest.controlLots) {
          tests.push({
            id: lot.testId.toString(),
            name: qualityControlTest.testName,
            category: qualityControlTest.testType ?? 'General',
            code: lot.testId.toString(),
            unit: 'unit',
            lowRange: lot.lowerControlLimit ?? 0,
            highRange: lot.upperControlLimit ?? 0,
            lotId: lot.id,
            level: lot.level ?? 1,
            lotNumber: lot.lotNumber,
            mean: lot.mean ?? 0,
            standardDeviation: lot.standardDeviation ?? 0,
            isActive: lot.isActive ?? true,
          });
        }
      }

      return {
        ...machine,
        id: machine.id.toString(),
        name: machine.name,
        category: machine.section?.id.toString() ?? '',
        model: machine.hospitalCode ?? '',
        tests,
      };
    });

    const categories = Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }));

    return { machines, categories };
  }

  private qcHistoryCache = new Map<string, { promise: Promise<QcPageHistoryResponseDto>, expires: number }>();

  async getQcHistory(limit: number, offset: number, machineId?: number): Promise<QcPageHistoryResponseDto> {
    const key = `${limit}-${offset}-${machineId || 'all'}`;
    const now = Date.now();
    const cached = this.qcHistoryCache.get(key);
    
    if (cached && now < cached.expires) {
      return cached.promise;
    }

    const promise = this._getQcHistory(limit, offset, machineId);
    this.qcHistoryCache.set(key, { promise, expires: now + 30000 });
    
    promise.catch(() => this.qcHistoryCache.delete(key));
    return promise;
  }

  private async _getQcHistory(limit: number, offset: number, machineId?: number): Promise<QcPageHistoryResponseDto> {
    const paginatedResponse = await this.qualityControlResultsService.findAll(undefined, limit, offset, machineId);

    const rawResults = Array.isArray(paginatedResponse) ? paginatedResponse : ('results' in paginatedResponse ? paginatedResponse.results : []);

    const formattedResults: QcInteractiveHistoryEntryDto[] = rawResults.map((entry: any) => {
      const dateObj = new Date(entry.testDate as string);
      const dateStr = !Number.isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'N/A N/A';

      const lowerLimit = entry.lowerControlLimit ?? 0;
      const upperLimit = entry.upperControlLimit ?? 0;

      return {
        id: entry.id.toString(),
        machineId: entry.machineId.toString(),
        testName: entry.testName,
        date: dateStr,
        rawDate: entry.testDate,
        performedBy: entry.performedByFirstName
          ? `${entry.performedByFirstName} ${entry.performedByLastName}`
          : 'User ' + (entry.performedBy || 'Unknown'),
        numericResult: entry.measuredValue ?? entry.numericResult,
        result: (entry.measuredValue ?? entry.numericResult)?.toString() ?? '',
        expectedRange: `${lowerLimit} - ${upperLimit}`,
        status: entry.status,
        notes: entry.comments || '',
        zScore: entry.zScore,
        violatedRule: entry.violatedRule,
        lotMean: entry.lotMean ?? 0,
        lotSd: entry.lotSd ?? 1,
      };
    });

    return {
      results: formattedResults,
      nextOffset: formattedResults.length === limit ? offset + limit : undefined,
    };
  }
}
