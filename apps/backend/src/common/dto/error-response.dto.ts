import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: '2026-03-15T10:30:00.000Z',
    description: 'Timestamp of the error',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/resource',
    description: 'Request path that caused the error',
  })
  path: string;

  @ApiProperty({
    example: 'Descriptive error message',
    description: 'Human-readable error message',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'Bad Request',
    description: 'HTTP error type',
  })
  error?: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;

  @ApiProperty({
    example: ['email must be an email', 'password should not be empty'],
    description: 'Array of validation error messages',
    type: [String],
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;

  @ApiProperty({ example: 'You do not have permission to perform this action' })
  message: string;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource/999' })
  path: string;

  @ApiProperty({ example: 'Resource with ID 999 not found' })
  message: string;
}

export class ConflictResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;

  @ApiProperty({ example: 'A resource with these details already exists.' })
  message: string;
}
