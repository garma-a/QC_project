import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
import { QcTestsRepository } from './qc-tests.repository';

@Injectable()
export class QcTestsService {
  constructor(private readonly qcTestsRepository: QcTestsRepository) { }

  async create(createQcTestDto: CreateQcTestDto) {
    const machine = await this.qcTestsRepository.getMachineById(createQcTestDto.machineId);

    if (!machine) {
      throw new NotFoundException(`Cannot create test: Machine #${createQcTestDto.machineId} not found`);
    }
    const newTest = await this.qcTestsRepository.createQcTest(createQcTestDto);

    return newTest;
  }

  async getTestsByMachine(machineId: number) {
    const machine = await this.qcTestsRepository.getMachineById(machineId);

    if (!machine) {
      throw new NotFoundException(`Machine #${machineId} not found`);
    }

    return await this.qcTestsRepository.getTestsByMachine(machineId);
  }
}
