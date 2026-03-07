import { Test, TestingModule } from '@nestjs/testing';
import { ControlLotsController } from './control-lots.controller';

describe('ControlLotsController', () => {
  let controller: ControlLotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlLotsController],
    }).compile();

    controller = module.get<ControlLotsController>(ControlLotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
