import * as SharedTypes from '@qc/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateQualityControlTestDto implements SharedTypes.CreateQualityControlTestDto {

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the QC test',
    example: 'pH Measurement',
    type: String,
    minLength: 1,
    maxLength: 100
  })
  testName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Type of the QC test',
    example: 'Chemical',
    required: false,
    type: String,
    maxLength: 50
  })
  testType?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the machine associated with this QC test',
    example: 42,
    type: Number,
    minimum: 1
  })
  machineId: number;
}

