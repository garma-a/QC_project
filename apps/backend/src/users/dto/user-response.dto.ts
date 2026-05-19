import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
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
  role: string;

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
  createdAt: Date;

  @ApiPropertyOptional({
    example: '2026-03-15T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date | null;
}

export class UserListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'TECHNICIAN', enum: ['TECHNICIAN', 'ADMIN'] })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({
    example: ['Hematology', 'Chemistry'],
    description: 'Names of lab sections assigned to this user',
    type: [String],
  })
  sectionNames: string[];
}

export class DeactivateUserResponseDto {
  @ApiProperty({ example: 'User deactivated successfully' })
  message: string;
}
