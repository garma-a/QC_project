import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MachineResponseDto {
  @ApiProperty({ example: 1, description: 'Unique machine identifier' })
  id: number;

  @ApiProperty({
    example: 'Cobas 6000',
    description: 'Operational name of the machine',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'LAB-EQ-001',
    description: 'Internal hospital code or asset tag',
  })
  hospCode: string | null;

  @ApiProperty({
    example: 1,
    description: 'ID of the section this machine belongs to',
  })
  sectionId: number;

  @ApiProperty({
    example: 'IDLE',
    enum: ['IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE', 'ERROR'],
    description: 'Current operational status of the machine',
  })
  currentStatus: string;

  @ApiPropertyOptional({
    example: '2026-03-15T08:00:00.000Z',
    description: 'Timestamp of the last QC run',
  })
  lastRunAt: Date | null;

  @ApiProperty({
    example: '2026-03-15T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    example: '2026-03-15T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date | null;

  @ApiPropertyOptional({
    example: 'HEMATOLOGY',
    enum: ['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER'],
    description: 'Machine specialization',
  })
  specialization: string | null;

  @ApiPropertyOptional({
    example: 12,
    description: 'Number of QC runs performed today',
  })
  testsToday?: number;
}
