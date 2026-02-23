import { Test, TestingModule } from '@nestjs/testing';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';

describe('MachinesController', () => {
  let controller: MachinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachinesController],
      providers: [
        MachinesService,
        {
          provide: require('./machines.service').DatabaseService || require('src/database/database.service').DatabaseService,
          useValue: { db: {} },
        },
      ],
    }).compile();

    controller = module.get<MachinesController>(MachinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
