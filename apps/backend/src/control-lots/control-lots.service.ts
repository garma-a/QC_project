import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { ControlLotsRepository } from './control-lots.repository';

@Injectable()
export class ControlLotsService {
  constructor(private readonly controlLotsRepository: ControlLotsRepository) {}

  // Helper to compute age-based warning fields
  private computeAgeFlags<T extends { createdAt: Date | null }>(lot: T) {
    if (!lot.createdAt) {
      return { ...lot, daysActive: 0, needsChecking: false };
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const createdAtDate = typeof lot.createdAt === 'string' ? new Date(lot.createdAt) : lot.createdAt;
    const diffMs = Date.now() - createdAtDate.getTime();
    const daysActive = Math.max(0, Math.floor(diffMs / msPerDay));
    return {
      ...lot,
      daysActive,
      needsChecking: daysActive >= 10,
    };
  }

  async create(createControlLotDto: CreateControlLotDto) {
    const test = await this.controlLotsRepository.findTestById(
      createControlLotDto.testId,
    );

    if (!test) {
      throw new NotFoundException(
        `QC Test with ID ${createControlLotDto.testId} not found`,
      );
    }

    const newLot = await this.controlLotsRepository.createWithDeactivation(
      createControlLotDto.testId,
      {
        ...createControlLotDto,
        expirationDate: new Date(createControlLotDto.expirationDate),
      }
    );

    return this.computeAgeFlags(newLot);
  }

  async findAll(limit?: number, offset?: number) {
    const lots = await this.controlLotsRepository.findAll(limit, offset);
    return lots.map((lot) => this.computeAgeFlags(lot));
  }

  async findOne(id: number) {
    const lot = await this.controlLotsRepository.findById(id);

    if (!lot) {
      throw new NotFoundException(`Control lot with ID ${id} not found`);
    }
    return this.computeAgeFlags(lot);
  }

  async findByTestId(testId: number) {
    const lots = await this.controlLotsRepository.findByTestId(testId);
    return lots.map((lot) => this.computeAgeFlags(lot));
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

    return this.computeAgeFlags(updatedLot);
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
