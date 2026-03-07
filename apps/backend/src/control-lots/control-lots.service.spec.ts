import { Test, TestingModule } from '@nestjs/testing';
import { ControlLotsService } from './control-lots.service';

describe('ControlLotsService', () => {
  let service: ControlLotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlLotsService],
    }).compile();

    service = module.get<ControlLotsService>(ControlLotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
