import { Test, TestingModule } from '@nestjs/testing';
import { QcResultsService } from './qc-results.service';

describe('QcResultsService', () => {
  let service: QcResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QcResultsService],
    }).compile();

    service = module.get<QcResultsService>(QcResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
