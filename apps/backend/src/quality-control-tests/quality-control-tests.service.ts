import { Injectable, NotFoundException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { CreateQualityControlTestDto } from './dto/create-quality-control-test.dto';
import { UpdateQualityControlTestDto } from './dto/update-quality-control-test.dto';
import { QualityControlTestsRepository } from './quality-control-tests.repository';

@Injectable()
export class QualityControlTestsService {
  public testEvents$ = new Subject<any>();

  constructor(private readonly qualityControlTestsRepository: QualityControlTestsRepository) { }

  async create(createQualityControlTestDto: CreateQualityControlTestDto) {
    const machine = await this.qualityControlTestsRepository.getMachineById(createQualityControlTestDto.machineId);

    if (!machine) {
      throw new NotFoundException(`Cannot create test: Machine #${createQualityControlTestDto.machineId} not found`);
    }
    const newTest = await this.qualityControlTestsRepository.createQualityControlTest(createQualityControlTestDto);

    this.testEvents$.next({ type: 'create', data: newTest, sectionId: machine.sectionId });
    return newTest;
  }

  async getTestsByMachine(machineId: number, limit?: number, offset?: number) {
    const machine = await this.qualityControlTestsRepository.getMachineById(machineId);

    if (!machine) {
      throw new NotFoundException(`Machine #${machineId} not found`);
    }

    return await this.qualityControlTestsRepository.getTestsByMachine(machineId, limit, offset);
  }

  async update(testId: number, updateQualityControlTestDto: UpdateQualityControlTestDto) {
    const existing = await this.qualityControlTestsRepository.getQualityControlTestById(testId);

    if (!existing) {
      throw new NotFoundException(`QC Test #${testId} not found`);
    }

    // If the caller is moving this test to a different machine, verify the new machine exists
    if (updateQualityControlTestDto.machineId !== undefined) {
      const machine = await this.qualityControlTestsRepository.getMachineById(updateQualityControlTestDto.machineId);
      if (!machine) {
        throw new NotFoundException(`Machine #${updateQualityControlTestDto.machineId} not found`);
      }
    }

    const updatedTest = await this.qualityControlTestsRepository.updateQualityControlTest(testId, updateQualityControlTestDto);
    const updatedMachine = await this.qualityControlTestsRepository.getMachineById(updatedTest.machineId);
    this.testEvents$.next({ type: 'update', data: updatedTest, sectionId: updatedMachine?.sectionId });
    return updatedTest;
  }

  async getAll(limit?: number, offset?: number) {
    return this.qualityControlTestsRepository.getAllTests(limit, offset);
  }
}
