import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMachineDto } from '@/machines/dto/create-machine.dto';
import { UpdateMachineDto } from '@/machines/dto/update-machine.dto';
import { MachinesRepository } from './machines.repository';

@Injectable()
export class MachinesService {
  constructor(private readonly machinesRepository: MachinesRepository) { }

  async create(createMachineDto: CreateMachineDto) {
    try {
      const newMachine = await this.machinesRepository.create({
        name: createMachineDto.name,
        hospCode: createMachineDto.hospCode,
        sectionId: createMachineDto.sectionId,
      });

      return newMachine;
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async findAll(limit?: number, offset?: number) {
    return await this.machinesRepository.findAll(limit, offset);
  }

  async findOne(id: number) {
    const machine = await this.machinesRepository.findById(id);

    if (!machine) {
      throw new NotFoundException(`Machine with ID #${id} not found`);
    }
    return machine;
  }

  async update(id: number, updateMachineDto: UpdateMachineDto) {
    try {
      const updatedMachine = await this.machinesRepository.update(
        id,
        updateMachineDto,
      );

      if (!updatedMachine) {
        throw new NotFoundException(`Machine with ID #${id} not found`);
      }
      return updatedMachine;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDbError(error);
    }
  }

  async remove(id: number) {
    const deletedMachine = await this.machinesRepository.delete(id);

    if (!deletedMachine) {
      throw new NotFoundException(`Machine with ID #${id} not found`);
    }

    return deletedMachine;
  }

  private handleDbError(error: any) {
    if (error.code === '23503') {
      throw new BadRequestException(
        'Invalid Section ID: The specified section does not exist.',
      );
    }
    if (error.code === '23505') {
      throw new ConflictException(
        'A machine with these details already exists.',
      );
    }
    throw new InternalServerErrorException(
      'An unexpected database error occurred.',
    );
  }
}
