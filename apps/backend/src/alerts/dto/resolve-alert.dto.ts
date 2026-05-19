import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveAlertDto {
  @ApiPropertyOptional({
    description: 'Optional note describing how the alert was resolved',
    example: 'Instrument recalibrated and control passed on rerun.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNote?: string;
}
