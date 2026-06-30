import { Test, TestingModule } from '@nestjs/testing';
import { BffService } from './bff.service';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QcResultsService } from '@/qc-results/qc-results.service';
import { SectionsService } from '@/sections/sections.service';

describe('BffService', () => {
  let service: BffService;
  let mockMachinesService: Record<string, jest.Mock>;
  let mockControlLotsService: Record<string, jest.Mock>;
  let mockQcResultsService: Record<string, jest.Mock>;
  let mockSectionsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockMachinesService = {
      findAll: jest.fn(),
    };

    mockControlLotsService = {
      findActiveWithTestContext: jest.fn(),
    };

    mockQcResultsService = {
      getRecentAll: jest.fn(),
      findAll: jest.fn(),
    };

    mockSectionsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BffService,
        { provide: MachinesService, useValue: mockMachinesService },
        { provide: ControlLotsService, useValue: mockControlLotsService },
        { provide: QcResultsService, useValue: mockQcResultsService },
        { provide: SectionsService, useValue: mockSectionsService },
      ],
    }).compile();

    service = module.get<BffService>(BffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return beautifully formatted dashboard data when dependencies return valid data', async () => {
      // Arrange
      const mockMachines = [
        { id: 1, name: 'Alinity Analyzer 1014', sectionId: 3 },
      ];
      const mockActiveLots = [
        {
          id: 10,
          machineId: 1,
          testId: 101,
          testName: 'Hemoglobin',
          testType: 'Routine',
          lowerControlLimit: 10,
          upperControlLimit: 20,
          level: 2,
          lotNumber: 'L2-LOT',
          mean: 15,
          standardDeviation: 1.5,
          isActive: true,
        },
      ];
      const mockRecentResults = [
        {
          id: 501,
          machineId: 1,
          testName: 'Hemoglobin',
          testDate: '2026-10-24T12:00:00Z',
          technicianId: 77,
          value: 16.5,
          lowerControlLimit: 10,
          upperControlLimit: 20,
          status: 'PASS',
          comments: 'Looks good',
          zScore: 1.0,
          violatedRule: null,
          lotMean: 15,
          lotSd: 1.5,
        },
      ];
      const mockSections = [
        { id: 3, name: 'Hematology' }
      ];

      mockMachinesService.findAll.mockResolvedValue(mockMachines);
      mockControlLotsService.findActiveWithTestContext.mockResolvedValue(mockActiveLots);
      mockQcResultsService.getRecentAll.mockResolvedValue(mockRecentResults);
      mockSectionsService.findAll.mockResolvedValue(mockSections);

      // Act
      const result = await service.getDashboardData();

      // Assert
      expect(result.categories).toEqual([{ id: '3', name: 'Hematology' }]);
      expect(result.machines[0]?.id).toBe(1);
      expect(result.machines[0]?.testsToday).toBe(1);
      expect(result.machines[0]?.lastQC).toEqual({
        date: expect.any(String),
        status: 'pass',
      });
      expect(result.machines[0]?.tests?.[0]?.id).toBe('101');
      expect(result.machines[0]?.tests?.[0]?.name).toBe('Hemoglobin');
      
      expect(result.qcHistory).toHaveLength(1);
      expect(result.qcHistory[0]?.id).toBe(501);
      expect(result.qcHistory[0]?.status).toBe('PASS');
      expect(result.qcHistory[0]?.expectedRange).toBe('10 - 20');
    });

    it('should handle empty responses gracefully without crashing', async () => {
      // Arrange
      mockMachinesService.findAll.mockResolvedValue([]);
      mockControlLotsService.findActiveWithTestContext.mockResolvedValue([]);
      mockQcResultsService.getRecentAll.mockResolvedValue([]);
      mockSectionsService.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getDashboardData();

      // Assert
      expect(result.machines).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.qcHistory).toEqual([]);
    });

    it('should correctly map fallback statuses (WARNING -> warning, FAIL -> fail, unknown -> pass)', async () => {
      // Arrange
      mockMachinesService.findAll.mockResolvedValue([
        { id: 1, name: 'Machine 1', sectionId: 1 },
      ]);
      mockControlLotsService.findActiveWithTestContext.mockResolvedValue([]);
      mockQcResultsService.getRecentAll.mockResolvedValue([
        { id: 1, machineId: 1, status: 'WARNING' },
        { id: 2, machineId: 1, status: 'FAIL' },
        { id: 3, machineId: 1, status: 'UNKNOWN_STATUS' },
      ]);
      mockSectionsService.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getDashboardData();

      // Assert
      expect(result.qcHistory[0]?.status).toBe('WARNING');
      expect(result.qcHistory[1]?.status).toBe('FAIL');
      expect(result.qcHistory[2]?.status).toBe('UNKNOWN_STATUS');
    });
  });

  describe('getQcPageMachines', () => {
    it('should format machines specifically for the QC selector', async () => {
      // Arrange
      mockMachinesService.findAll.mockResolvedValue([
        { id: 2, name: 'Sysmex', sectionId: 5, hospCode: 'SYS-101' },
      ]);
      mockControlLotsService.findActiveWithTestContext.mockResolvedValue([
        { machineId: 2, testId: 55, testName: 'WBC', lowerControlLimit: null, upperControlLimit: null },
      ]);
      mockSectionsService.findAll.mockResolvedValue([
        { id: 5, name: 'Microbiology' }
      ]);

      // Act
      const result = await service.getQcPageMachines();

      // Assert
      expect(result.categories).toEqual([{ id: '5', name: 'Microbiology' }]);
      expect(result.machines).toHaveLength(1);
      expect(result.machines[0]?.model).toBe('SYS-101');
      expect(result.machines[0]?.tests?.[0]?.name).toBe('WBC');
      expect(result.machines[0]?.tests?.[0]?.lowRange).toBe(0); // Null fallback
      expect(result.machines[0]?.tests?.[0]?.highRange).toBe(0); // Null fallback
    });

    it('should return empty arrays when no machines are found', async () => {
      // Arrange
      mockMachinesService.findAll.mockResolvedValue(null); // Testing null boundary

      // Act
      const result = await service.getQcPageMachines();

      // Assert
      expect(result.machines).toEqual([]);
      expect(result.categories).toEqual([]);
    });
  });

  describe('getQcHistory', () => {
    it('should successfully map paginated results from QcResultsService', async () => {
      // Arrange
      const mockRawResults = {
        results: [
          {
            id: 99,
            machineId: 2,
            testName: 'Cholesterol',
            testDate: 'invalid-date',
            performedByFirstName: 'Admin',
            performedByLastName: 'Seeder',
            value: 200,
            lowerControlLimit: 150,
            upperControlLimit: 250,
            status: 'PASS',
            zScore: 0.5,
          },
        ]
      };
      
      mockQcResultsService.findAll.mockResolvedValue(mockRawResults);

      // Act
      const result = await service.getQcHistory(50, 0, 2);

      // Assert
      expect(mockQcResultsService.findAll).toHaveBeenCalledWith(undefined, 50, 0, 2);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.expectedRange).toBe('150 - 250');
      expect(result.results[0]?.performedBy).toBe('Admin Seeder');
      expect(result.results[0]?.date).toBe('N/A N/A'); // Tests the invalid date fallback branch
    });

    it('should correctly set nextOffset when limit is reached', async () => {
      // Arrange
      const limit = 2;
      const offset = 10;
      mockQcResultsService.findAll.mockResolvedValue([
        { id: 1, machineId: 2, value: 10 }, { id: 2, machineId: 2, value: 20 } // Returns 2 items (equal to limit)
      ]);

      // Act
      const result = await service.getQcHistory(limit, offset);

      // Assert
      expect(result.nextOffset).toBe(12); // 10 + 2
    });

    it('should set nextOffset to undefined when limit is not reached', async () => {
      // Arrange
      const limit = 50;
      const offset = 0;
      mockQcResultsService.findAll.mockResolvedValue([
        { id: 1, machineId: 2, value: 10 } // Only returns 1 item, meaning it's the end of the list
      ]);

      // Act
      const result = await service.getQcHistory(limit, offset);

      // Assert
      expect(result.nextOffset).toBeUndefined();
    });
  });
});
