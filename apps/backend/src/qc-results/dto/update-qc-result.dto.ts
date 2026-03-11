import { PartialType } from '@nestjs/swagger';
import { CreateQcResultDto } from './create-qc-result.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateQcResultDto {
    @IsString()
    @IsOptional()
    comments?: string;
}
