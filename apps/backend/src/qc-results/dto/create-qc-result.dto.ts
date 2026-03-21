import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQcResultDto {
  @ApiProperty({
    description: 'The actual measured value obtained from the lab machine',
    example: 14.5,
  })
  @IsNotEmpty()
  @IsNumber()
  measuredValue: number;

  @ApiProperty({
    description: 'The ID of the active control lot this measurement belongs to',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  lotId: number;

  @ApiPropertyOptional({
    description: 'Optional comments/notes from the technician about this result',
    example: 'Machine recalibrated before run',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
