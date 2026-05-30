import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
import { UpdateQcTestDto } from './dto/update-qc-test.dto';
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

  async update(testId: number, updateQcTestDto: UpdateQcTestDto) {
    const existing = await this.qcTestsRepository.getQcTestById(testId);

    if (!existing) {
      throw new NotFoundException(`QC Test #${testId} not found`);
    }

    // If the caller is moving this test to a different machine, verify the new machine exists
    if (updateQcTestDto.machineId !== undefined) {
      const machine = await this.qcTestsRepository.getMachineById(updateQcTestDto.machineId);
      if (!machine) {
        throw new NotFoundException(`Machine #${updateQcTestDto.machineId} not found`);
      }
    }

    return this.qcTestsRepository.updateQcTest(testId, updateQcTestDto);
  }

  async getAll() {
    return this.qcTestsRepository.getAllTests();
  }
}
