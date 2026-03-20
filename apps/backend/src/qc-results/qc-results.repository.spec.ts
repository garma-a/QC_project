import { Test, TestingModule } from '@nestjs/testing';
import { QcResultsRepository } from './qc-results.repository';

describe('QcResultsRepository', () => {
  let provider: QcResultsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QcResultsRepository],
    }).compile();

    provider = module.get<QcResultsRepository>(QcResultsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
