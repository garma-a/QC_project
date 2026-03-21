import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQcResultDto } from './create-qc-result.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateQcResultDto {
  @ApiPropertyOptional({
    description: 'Updated comments/notes from the technician',
    example: 'Sample was slightly hemolyzed',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
