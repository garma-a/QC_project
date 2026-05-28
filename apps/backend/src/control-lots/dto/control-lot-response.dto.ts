import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ControlLotResponseDto {
  @ApiProperty({ example: 1, description: 'Unique control lot identifier' })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the QC test this lot belongs to',
  })
  testId: number;

  @ApiProperty({
    example: 'LOT-HGB-2026-A',
    description: 'Manufacturer lot number',
  })
  lotNumber: string;

  @ApiProperty({
    example: '2027-12-31T00:00:00.000Z',
    description: 'Expiration date of the control material',
  })
  expirationDate: Date;

  @ApiPropertyOptional({
    example: 14.0,
    description: 'Manufacturer-specified target value',
  })
  targetValue: number | null;

  @ApiPropertyOptional({ example: 14.0, description: 'Established mean value' })
  mean: number | null;

  @ApiPropertyOptional({ example: 0.5, description: 'Standard deviation' })
  standardDeviation: number | null;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Upper control limit (mean + 3SD)',
  })
  upperControlLimit: number | null;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Lower control limit (mean - 3SD)',
  })
  lowerControlLimit: number | null;

  @ApiPropertyOptional({
    example: 15.0,
    description: 'Upper warning limit (mean + 2SD)',
  })
  upperWarningLimit: number | null;

  @ApiPropertyOptional({
    example: 13.0,
    description: 'Lower warning limit (mean - 2SD)',
  })
  lowerWarningLimit: number | null;

  @ApiProperty({
    example: true,
    description: 'Whether this control lot is currently active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2026-03-15T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of days since creation',
  })
  daysActive?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the lot is older than 10 days and needs checking',
  })
  needsChecking?: boolean;
}

export class ControlLotDeactivateResponseDto {
  @ApiProperty({ example: 'Control lot deactivated successfully' })
  message: string;

  @ApiProperty({
    type: () => ControlLotResponseDto,
    description: 'The deactivated control lot',
  })
  lot: ControlLotResponseDto;
}
