import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
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
}
