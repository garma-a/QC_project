import { Test, TestingModule } from '@nestjs/testing';
import { QcTestsService } from './qc-tests.service';

describe('QcTestsService', () => {
  let service: QcTestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QcTestsService],
    }).compile();

    service = module.get<QcTestsService>(QcTestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
