import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMachineDto {
  @ApiProperty({
    description: 'The operational name of the machine',
    example: 'Cobas 6000',
  })
  @IsString()
  @IsNotEmpty({ message: 'Machine name is required' })
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Internal hospital code or asset tag',
    example: 'LAB-EQ-001',
  })
  @IsOptional()
  @IsString()
  hospCode?: string;

  @ApiProperty({
    description: 'The ID of the section this machine belongs to',
    example: 1,
  })
  @IsInt({ message: 'Section ID must be an integer' })
  @IsNotEmpty()
  sectionId: number;
}
