import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { eq } from 'drizzle-orm';
import { controlLots } from '../drizzle/schema.js';


@Injectable()
export class ControlLotsService {
    constructor(private readonly db: DatabaseService) { }

    async create(createControlLotDto: CreateControlLotDto) {
        const [newLot] = await this.db.db
            .insert(controlLots)
            .values({
                ...createControlLotDto,
                expirationDate: new Date(createControlLotDto.expirationDate),
            })
            .returning();
        return newLot;
    }

    async findAll() {
        return await this.db.db
            .select()
            .from(controlLots);
    }

    async findOne(id: number) {
        const [lot] = await this.db.db
            .select()
            .from(controlLots)
            .where(eq(controlLots.id, id));

        if (!lot) {
            throw new NotFoundException(`Control lot with ID ${id} not found`);
        }
        return lot;
    }

    async findByTestId(testId: number) {
        return await this.db.db
            .select()
            .from(controlLots)
            .where(eq(controlLots.testId, testId));
    }

    async update(id: number, updateControlLotDto: UpdateControlLotDto) {
        const [existingLot] = await this.db.db
            .select()
            .from(controlLots)
            .where(eq(controlLots.id, id));

        if (!existingLot) {
            throw new NotFoundException(`Control lot with ID ${id} not found`);
        }

        const updateData: Record<string, unknown> = { ...updateControlLotDto };
        if (updateControlLotDto.expirationDate) {
            updateData.expirationDate = new Date(updateControlLotDto.expirationDate);
        }

        const [updatedLot] = await this.db.db
            .update(controlLots)
            .set(updateData)
            .where(eq(controlLots.id, id))
            .returning();

        return updatedLot;
    }

    async remove(id: number) {
        const [lot] = await this.db.db
            .select()
            .from(controlLots)
            .where(eq(controlLots.id, id));

        if (!lot) {
            throw new NotFoundException(`Control lot with ID ${id} not found`);
        }

        const [deactivatedLot] = await this.db.db
            .update(controlLots)
            .set({ isActive: false })
            .where(eq(controlLots.id, id))
            .returning();

        return { message: 'Control lot deactivated successfully', lot: deactivatedLot };
    }
}

