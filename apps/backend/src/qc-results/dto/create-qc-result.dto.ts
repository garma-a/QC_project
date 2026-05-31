import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QcResultItemDto {
  @ApiProperty({
    description: 'The ID of the active control lot this measurement belongs to',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  lotId: number;

  @ApiProperty({
    description: 'The actual measured value obtained from the lab machine',
    example: 14.5,
  })
  @IsNotEmpty()
  @IsNumber()
  measuredValue: number;

  @ApiPropertyOptional({
    description: 'Optional comments/notes from the technician about this specific result',
    example: 'Machine recalibrated before run',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class CreateQcResultDto {
  @ApiProperty({
    description: 'The ID of the machine running this QC batch',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  machineId: number;

  @ApiProperty({
    description: 'Array of QC results for the different control levels in this run',
    type: [QcResultItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QcResultItemDto)
  @IsNotEmpty()
  results: QcResultItemDto[];
}
