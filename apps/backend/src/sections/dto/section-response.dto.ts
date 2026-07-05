import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SectionResponseDto implements SharedTypes.SectionResponseDto {
  @ApiProperty({ example: 1, description: 'Unique section identifier' })
  id: number;

  @ApiProperty({ example: 'Hematology', description: 'Name of the section' })
  name: string;

  @ApiPropertyOptional({ example: 'Room 204', description: 'Physical location of the section' })
  location?: string | null;

  @ApiPropertyOptional({
    example: 'HEMATOLOGY',
    enum: ['HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER'],
    description: 'Specialization category',
  })
  specialization?: SharedTypes.Specialization | null;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z', description: 'Creation timestamp' })
  createdAt: Date | string;

  @ApiPropertyOptional({ example: '2026-03-15T12:00:00.000Z', description: 'Last update timestamp' })
  updatedAt?: Date | string | null;
}
