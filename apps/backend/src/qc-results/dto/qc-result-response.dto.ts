import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QcResultResponseDto {
  @ApiProperty({ example: 1, description: 'Unique QC result identifier' })
  id: number;

  @ApiProperty({
    example: 14.5,
    description: 'The measured value from the lab instrument',
  })
  measuredValue: number;

  @ApiProperty({
    example: '2026-03-15T08:00:00.000Z',
    description: 'Date and time the measurement was taken',
  })
  testDate: Date;

  @ApiProperty({
    example: 'PASS',
    enum: ['PASS', 'FAIL', 'WARNING'],
    description: 'Auto-calculated status based on Z-Score evaluation',
  })
  status: string;

  @ApiPropertyOptional({
    example: 'Morning QC run',
    description: 'Technician comments or notes',
  })
  comments: string | null;

  @ApiProperty({
    example: 1,
    description: 'ID of the control lot this result belongs to',
  })
  lotId: number;

  @ApiProperty({
    example: 5,
    description: 'ID of the user who performed the measurement',
  })
  performedBy: number;

  @ApiProperty({ example: 1.4, description: 'Stored Z-Score at time of submission' })
  zScore: number;

  @ApiPropertyOptional({ example: '1_2s', description: 'Westgard rule that triggered this status, null if PASS' })
  violatedRule: string | null;
}

class LotSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'LOT-HGB-2026-A' })
  lotNumber: string;

  @ApiPropertyOptional({ example: 14.0 })
  mean: number | null;

  @ApiPropertyOptional({ example: 0.5 })
  standardDeviation: number | null;

  @ApiPropertyOptional({ example: 15.5 })
  upperControlLimit: number | null;

  @ApiPropertyOptional({ example: 12.5 })
  lowerControlLimit: number | null;

  @ApiPropertyOptional({ example: 15.0 })
  upperWarningLimit: number | null;

  @ApiPropertyOptional({ example: 13.0 })
  lowerWarningLimit: number | null;

  @ApiProperty({ example: 'Hemoglobin (HGB)' })
  testName: string;

  @ApiProperty({ example: 'Sysmex XN-1000' })
  machineName: string;
}

export class QcResultsWithLotResponseDto {
  @ApiProperty({
    type: () => LotSummaryDto,
    description: 'Control lot parameters and test/machine info',
  })
  lot: LotSummaryDto;

  @ApiProperty({
    type: () => [QcResultResponseDto],
    description: 'Array of QC results ordered by date descending',
  })
  results: QcResultResponseDto[];
}

class ControlLotInResultDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  testId: number;

  @ApiProperty({ example: 'LOT-HGB-2026-A' })
  lotNumber: string;

  @ApiProperty({ example: '2027-12-31T00:00:00.000Z' })
  expirationDate: Date;

  @ApiPropertyOptional({ example: 14.0 })
  targetValue: number | null;

  @ApiPropertyOptional({ example: 14.0 })
  mean: number | null;

  @ApiPropertyOptional({ example: 0.5 })
  standardDeviation: number | null;

  @ApiPropertyOptional({ example: 15.5 })
  upperControlLimit: number | null;

  @ApiPropertyOptional({ example: 12.5 })
  lowerControlLimit: number | null;

  @ApiPropertyOptional({ example: 15.0 })
  upperWarningLimit: number | null;

  @ApiPropertyOptional({ example: 13.0 })
  lowerWarningLimit: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;
}

export class QcResultDetailResponseDto extends QcResultResponseDto {
  @ApiProperty({
    type: () => ControlLotInResultDto,
    description: 'Full control lot data associated with this result',
  })
  controlLot: ControlLotInResultDto;

}

