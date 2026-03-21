import { IsDateString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateControlLotDto {
  @ApiPropertyOptional({
    description:
      'Updated expiration date of the control material (ISO 8601 format)',
    example: '2027-06-30',
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Updated manufacturer target value',
    example: 14.2,
  })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({
    description: 'Updated mean value',
    example: 14.2,
  })
  @IsNumber()
  @IsOptional()
  mean?: number;

  @ApiPropertyOptional({
    description: 'Updated standard deviation',
    example: 0.6,
  })
  @IsNumber()
  @IsOptional()
  standardDeviation?: number;

  @ApiPropertyOptional({
    description: 'Updated upper control limit (mean + 3SD)',
    example: 16.0,
  })
  @IsNumber()
  @IsOptional()
  upperControlLimit?: number;

  @ApiPropertyOptional({
    description: 'Updated lower control limit (mean - 3SD)',
    example: 12.4,
  })
  @IsNumber()
  @IsOptional()
  lowerControlLimit?: number;

  @ApiPropertyOptional({
    description: 'Updated upper warning limit (mean + 2SD)',
    example: 15.4,
  })
  @IsNumber()
  @IsOptional()
  upperWarningLimit?: number;

  @ApiPropertyOptional({
    description: 'Updated lower warning limit (mean - 2SD)',
    example: 13.0,
  })
  @IsNumber()
  @IsOptional()
  lowerWarningLimit?: number;

  @ApiPropertyOptional({
    description:
      'Whether the control lot is currently active. Set to false to deactivate.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
