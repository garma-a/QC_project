import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto implements SharedTypes.UserResponseDto {
  @ApiProperty({ example: 1, description: 'Unique user identifier' })
  id: number;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  email: string;

  @ApiPropertyOptional({
    example: '+201234567890',
    description: 'Phone number',
  })
  phone: string | null;

  @ApiProperty({
    example: 'TECHNICIAN',
    enum: ['TECHNICIAN', 'ADMIN'],
    description: 'User role',
  })
  role: SharedTypes.Role;

  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
  })
  isActive: boolean;

  @ApiPropertyOptional({
    example: [1, 3],
    description: 'IDs of lab sections assigned to this user',
    type: [Number],
  })
  sectionIds: number[];

  @ApiPropertyOptional({
    example: ['Hematology', 'Chemistry'],
    description: 'Names of lab sections assigned to this user',
    type: [String],
  })
  sectionNames?: string[];

  @ApiProperty({
    example: '2026-03-15T10:30:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date | string;

  @ApiPropertyOptional({
    example: '2026-03-15T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date | string | null;
}

export class UserListItemDto implements SharedTypes.UserListItemDto {
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

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({
    example: [1, 3],
    description: 'IDs of lab sections assigned to this user',
    type: [Number],
  })
  sectionIds: number[];

  @ApiPropertyOptional({
    example: ['Hematology', 'Chemistry'],
    description: 'Names of lab sections assigned to this user',
    type: [String],
  })
  sectionNames: string[];
}

export class DeactivateUserResponseDto implements SharedTypes.DeactivateUserResponseDto {
  @ApiProperty({ example: 'User deactivated successfully' })
  message: string;
}
