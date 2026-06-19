import { Injectable } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QcResultsService } from '@/qc-results/qc-results.service';
import { DashboardBffResponseDto, DashboardMachineDto, DashboardCategoryDto, DashboardQcHistoryDto } from './dto/dashboard-bff.dto';
import { QcPageMachinesResponseDto, QcPageHistoryResponseDto, QcInteractiveHistoryEntryDto } from './dto/qc-bff.dto';

@Injectable()
export class BffService {
  constructor(
    private readonly machinesService: MachinesService,
    private readonly controlLotsService: ControlLotsService,
    private readonly qcResultsService: QcResultsService,
  ) {}

  async getDashboardData(): Promise<DashboardBffResponseDto> {
    const [fetchedMachines, activeLotsResponse, allResultsResponse] = await Promise.all([
      this.machinesService.findAll(),
      this.controlLotsService.findActiveWithTestContext(),
      this.qcResultsService.getRecentAll(),
    ]);

    // Format activeLots based on response type (array or paginated object)
    const activeLots = Array.isArray(activeLotsResponse) 
      ? activeLotsResponse 
      : (activeLotsResponse as any).data || [];

    // Format allResults
    const allResults = Array.isArray(allResultsResponse)
      ? allResultsResponse
      : (allResultsResponse as any).results || [];

    let categories: DashboardCategoryDto[] = [];
    let qcHistory: DashboardQcHistoryDto[] = [];
    let machines: DashboardMachineDto[] = [];

    if (fetchedMachines && fetchedMachines.length > 0) {
      // Build section categories from machines
      const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
      categories = sectionIds.map((sid) => ({
        id: sid.toString(),
        name: `Section ${sid}`,
      }));

      // Build qcHistory directly from enriched results
      qcHistory = allResults.map((result: any): DashboardQcHistoryDto => {
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

      // Build machines array
      machines = fetchedMachines.map((machine: any) => {
        const machineResults = qcHistory
          .filter((entry) => entry.machineId === machine.id)
          .sort((a, b) => new Date(b.testDate as string).getTime() - new Date(a.testDate as string).getTime());
        
        const latestResult = machineResults[0];
        const machineLots = activeLots.filter((lot: any) => lot.machineId === machine.id);

        const tests = machineLots.map((lot: any) => ({
          id: lot.testId.toString(),
          name: lot.testName,
          category: lot.testType ?? 'General',
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
        }));

        let lastQC: { date: string; status: string } | undefined = undefined;
        if (latestResult) {
          const statusMap = {
            'PASS': 'pass',
            'WARNING': 'warning',
            'FAIL': 'fail'
          };
          lastQC = {
            date: new Date(latestResult.testDate as string).toLocaleString(),
            status: statusMap[latestResult.status] || 'fail',
          };
        }

        return {
          ...machine,
          testsToday: machineResults.length,
          lastQC,
          tests,
        };
      });
    }

    return {
      machines,
      categories,
      qcHistory,
    };
  }

  async getQcPageMachines(): Promise<QcPageMachinesResponseDto> {
    const [fetchedMachines, activeLotsResponse] = await Promise.all([
      this.machinesService.findAll(),
      this.controlLotsService.findActiveWithTestContext(),
    ]);

    const activeLots = Array.isArray(activeLotsResponse) 
      ? activeLotsResponse 
      : (activeLotsResponse as any).data || [];

    let categories: DashboardCategoryDto[] = [];
    
    if (!fetchedMachines || fetchedMachines.length === 0) {
      return { machines: [], categories: [] };
    }

    const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
    categories = sectionIds.map((sid) => ({
      id: sid.toString(),
      name: `Section ${sid}`,
    }));

    const machines = fetchedMachines.map((machine: any) => {
      const machineLots = activeLots.filter((lot: any) => lot.machineId === machine.id);

      const tests = machineLots.map((lot: any) => ({
        id: lot.testId.toString(),
        name: lot.testName,
        category: lot.testType ?? 'General',
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
      }));

      return {
        id: machine.id.toString(),
        name: machine.name,
        category: machine.sectionId.toString(),
        model: machine.hospCode ?? '',
        tests,
      };
    });

    return { machines, categories };
  }

  async getQcHistory(limit: number, offset: number, machineId?: number): Promise<QcPageHistoryResponseDto> {
    const paginatedResponse = await this.qcResultsService.findAll(undefined, limit, offset, machineId);
    
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
        performedBy: 'User ' + (entry.technicianId || 'Unknown'),
        numericResult: entry.value,
        result: entry.value?.toString() ?? '',
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
