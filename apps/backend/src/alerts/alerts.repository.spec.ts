import { Test, TestingModule } from '@nestjs/testing';
import { AlertsRepository } from './alerts.repository';

describe('AlertsRepository', () => {
  let provider: AlertsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsRepository],
    }).compile();

    provider = module.get<AlertsRepository>(AlertsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
