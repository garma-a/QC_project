import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedSectionDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Hematology' })
  name: string;
  @ApiPropertyOptional({ example: 'HEMATOLOGY' })
  specialization: string | null;
}

export class ProfileResponseDto implements SharedTypes.ProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'TECHNICIAN', enum: ['TECHNICIAN', 'ADMIN'] })
  role: SharedTypes.Role;

  @ApiPropertyOptional({ example: '+201234567890' })
  phone: string | null;

  @ApiProperty({ example: true })
  emailNotificationsEnabled: boolean;

  @ApiProperty({ example: false })
  subscribeToAllSections: boolean;

  @ApiProperty({ type: [AssignedSectionDto] })
  assignedSections: { id: number; name: string; specialization: string | null }[];

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date | string;
}

export class UpdateProfileDto implements SharedTypes.UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  phone?: string | null;

  @ApiPropertyOptional({ example: true })
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  subscribeToAllSections?: boolean;
}
