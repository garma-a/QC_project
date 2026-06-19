import { Injectable } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QcResultsService } from '@/qc-results/qc-results.service';
import { DashboardBffResponseDto, DashboardMachineDto, DashboardCategoryDto, DashboardQcHistoryDto } from './dto/dashboard-bff.dto';

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
}
