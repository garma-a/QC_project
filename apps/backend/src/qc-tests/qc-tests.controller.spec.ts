import { Test, TestingModule } from '@nestjs/testing';
import { QcTestsController } from './qc-tests.controller';

describe('QcTestsController', () => {
  let controller: QcTestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QcTestsController],
    }).compile();

    controller = module.get<QcTestsController>(QcTestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
