import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMachineDto implements SharedTypes.CreateMachineDto {
  @ApiProperty({
    description: 'The operational name of the machine. Must be at least 2 characters.',
    example: 'Cobas 6000',
    minLength: 2,
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Machine name is required' })
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Internal hospital code or asset tag. Optional field for tracking equipment.',
    example: 'LAB-EQ-001',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  hospCode?: string;

  @ApiProperty({
    description: 'The numeric ID of the section this machine belongs to. Must be an integer.',
    example: 1,
    type: Number,
    required: true,
  })
  @IsInt({ message: 'Section ID must be an integer' })
  @IsNotEmpty()
  sectionId: number;
}

