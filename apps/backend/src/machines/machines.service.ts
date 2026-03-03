import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMachineDto } from '@/machines/dto/create-machine.dto';
import { UpdateMachineDto } from '@/machines/dto/update-machine.dto';
import { DatabaseService } from '@/database/database.service';
import * as schema from "@/drizzle/schema";
import { eq } from 'drizzle-orm';

@Injectable()
export class MachinesService {

  constructor(private readonly databaseService: DatabaseService) { }
  async create(createMachineDto: CreateMachineDto) {
    try {
      const [newMachine] = await this.databaseService.db.insert(schema.machines).values({
        name: createMachineDto.name,
        hospCode: createMachineDto.hospCode,
        sectionId: createMachineDto.sectionId,
      }).returning();

      return newMachine;
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async findAll() {
    return await this.databaseService.db.select().from(schema.machines);
  }

  async findOne(id: number) {
    const result = await this.databaseService.db
      .select()
      .from(schema.machines)
      .where(eq(schema.machines.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Machine with ID #${id} not found`);
    }
    return result[0];
  }

  async update(id: number, updateMachineDto: UpdateMachineDto) {
    try {
      const [updatedMachine] = await this.databaseService.db
        .update(schema.machines)
        .set({
          ...updateMachineDto,
          updatedAt: new Date(),
        })
        .where(eq(schema.machines.id, id))
        .returning();
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
    const [deletedMachine] = await this.databaseService.db
      .delete(schema.machines)
      .where(eq(schema.machines.id, id))
      .returning();

    if (!deletedMachine) {
      throw new NotFoundException(`Machine with ID #${id} not found`);
    }

    return deletedMachine
  }
  private handleDbError(error: any) {
    if (error.code === '23503') {
      throw new BadRequestException('Invalid Section ID: The specified section does not exist.');
    }
    if (error.code === '23505') {
      throw new ConflictException('A machine with these details already exists.');
    }
    //console.error(error);
    throw new InternalServerErrorException('An unexpected database error occurred.');
  }
}
