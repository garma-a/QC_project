import { Test, TestingModule } from '@nestjs/testing';
import { QcResultsController } from './qc-results.controller';
import { QcResultsService } from './qc-results.service';

describe('QcResultsController', () => {
  let controller: QcResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QcResultsController],
      providers: [QcResultsService],
    }).compile();

    controller = module.get<QcResultsController>(QcResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
