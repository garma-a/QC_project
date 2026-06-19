import { Test, TestingModule } from '@nestjs/testing';
import { BffService } from './bff.service';

describe('BffService', () => {
  let service: BffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BffService],
    }).compile();

    service = module.get<BffService>(BffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
