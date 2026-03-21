import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { ControlLotsRepository } from './control-lots.repository';

@Injectable()
export class ControlLotsService {
  constructor(private readonly controlLotsRepository: ControlLotsRepository) {}

  async create(createControlLotDto: CreateControlLotDto) {
    const test = await this.controlLotsRepository.findTestById(
      createControlLotDto.testId,
    );

    if (!test) {
      throw new NotFoundException(
        `QC Test with ID ${createControlLotDto.testId} not found`,
      );
    }

    const newLot = await this.controlLotsRepository.create({
      ...createControlLotDto,
      expirationDate: new Date(createControlLotDto.expirationDate),
    });

    return newLot;
  }

  async findAll() {
    return await this.controlLotsRepository.findAll();
  }

  async findOne(id: number) {
    const lot = await this.controlLotsRepository.findById(id);

    if (!lot) {
      throw new NotFoundException(`Control lot with ID ${id} not found`);
    }
    return lot;
  }

  async findByTestId(testId: number) {
    return await this.controlLotsRepository.findByTestId(testId);
  }

  async update(id: number, updateControlLotDto: UpdateControlLotDto) {
    const existingLot = await this.controlLotsRepository.findById(id);

    if (!existingLot) {
      throw new NotFoundException(`Control lot with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = { ...updateControlLotDto };
    if (updateControlLotDto.expirationDate) {
      updateData.expirationDate = new Date(updateControlLotDto.expirationDate);
    }

    const updatedLot = await this.controlLotsRepository.update(id, updateData);

    return updatedLot;
  }

  async remove(id: number) {
    const lot = await this.controlLotsRepository.findById(id);

    if (!lot) {
      throw new NotFoundException(`Control lot with ID ${id} not found`);
    }

    const deactivatedLot = await this.controlLotsRepository.deactivate(id);

    return {
      message: 'Control lot deactivated successfully',
      lot: deactivatedLot,
    };
  }
}
