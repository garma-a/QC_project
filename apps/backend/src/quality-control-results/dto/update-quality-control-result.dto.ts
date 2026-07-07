import * as SharedTypes from '@qc/shared';
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQualityControlResultDto } from './create-quality-control-result.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateQualityControlResultDto implements SharedTypes.UpdateQualityControlResultDto {
  @ApiPropertyOptional({
    description: 'Updated comments/notes from the technician',
    example: 'Sample was slightly hemolyzed',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
