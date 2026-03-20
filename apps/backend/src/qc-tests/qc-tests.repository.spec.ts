import { Test, TestingModule } from '@nestjs/testing';
import { QcTestsRepository } from './qc-tests.repository';

describe('QcTestsRepository', () => {
  let provider: QcTestsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QcTestsRepository],
    }).compile();

    provider = module.get<QcTestsRepository>(QcTestsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
