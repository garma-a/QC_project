import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QcTestResponseDto implements SharedTypes.QcTestResponseDto {
  @ApiProperty({ example: 1, description: 'Unique QC test identifier' })
  id: number;

  @ApiProperty({
    example: 'Complete Blood Count',
    description: 'Name of the QC test',
  })
  testName: string;

  @ApiPropertyOptional({
    example: 'Hematology',
    description: 'Type/category of the QC test',
  })
  testType: string | null;

  @ApiProperty({
    example: 1,
    description: 'ID of the machine this test is configured on',
  })
  machineId: number;

  @ApiPropertyOptional({
    example: '2026-03-15T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date | string | null;
}
