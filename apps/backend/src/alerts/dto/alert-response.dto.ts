import * as SharedTypes from '@qc/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority } from '@/alerts/alerts.types';

export class AlertResponseDto implements SharedTypes.AlertResponseDto {
  @ApiProperty({ example: 12, description: 'Unique alert identifier' })
  id: number;

  @ApiPropertyOptional({
    example: 'QC_DEVIATION',
    description: 'Alert category or type',
  })
  type: string | null;

  @ApiPropertyOptional({
    enum: AlertPriority,
    enumName: 'AlertPriority',
    example: AlertPriority.HIGH,
    description: 'Priority level assigned to this alert',
  })
  priority: AlertPriority | null;

  @ApiPropertyOptional({
    example: 'QC Result for Lot X123 triggered a FAIL. Z-score is 3.15.',
    description: 'Human-readable alert message',
  })
  message: string | null;

  @ApiPropertyOptional({
    example: '1_3s (Violation)',
    description: 'Specific QC rule that was violated',
  })
  ruleViolated: string | null;

  @ApiPropertyOptional({
    example:
      'Stop patient testing. Rerun control. If failure persists, recalibrate.',
    description: 'Suggested remediation for the alert',
  })
  suggestedSolution: string | null;

  @ApiProperty({
    example: 402,
    description: 'ID of the QC result linked to this alert',
  })
  resultId: number;

  @ApiPropertyOptional({
    example: '2026-03-15T10:30:00.000Z',
    description: 'Alert creation timestamp',
  })
  createdAt: Date | string | null;

  @ApiProperty({
    example: 'UNSEEN',
    enum: ['UNSEEN', 'SEEN', 'RESOLVED'],
    description: 'Current alert status for the authenticated user',
  })
  status: SharedTypes.UserAlertStatus;

  @ApiPropertyOptional({
    example: '2026-03-15T10:35:00.000Z',
    description: 'When the alert was first seen by the authenticated user',
  })
  seenAt: Date | string | null;

  @ApiPropertyOptional({
    example: '2026-03-15T11:05:00.000Z',
    description: 'When the alert was marked resolved by the authenticated user',
  })
  resolvedAt: Date | string | null;

  @ApiPropertyOptional({
    example: 'Instrument recalibrated and control passed on rerun.',
    description: 'Optional resolution note saved by the authenticated user',
  })
  resolutionNote: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the machine linked to this alert',
  })
  machineId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the test linked to this alert',
  })
  testId?: number;

  @ApiPropertyOptional({
    example: 'Machine A',
    description: 'Name of the machine linked to this alert',
  })
  machineName?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the section linked to this alert',
  })
  sectionId?: number | null;

  @ApiPropertyOptional({
    example: 'Hematology',
    description: 'Name of the section linked to this alert',
  })
  sectionName?: string | null;

  @ApiPropertyOptional({
    example: 'WBC',
    description: 'Name of the test linked to this alert',
  })
  testName?: string | null;
}

export class UserAlertStatusResponseDto implements SharedTypes.UserAlertStatusResponseDto {
  @ApiProperty({ example: 5, description: 'Recipient user ID' })
  userId: number;

  @ApiProperty({ example: 12, description: 'Related alert ID' })
  alertId: number;

  @ApiProperty({
    example: 'SEEN',
    enum: ['UNSEEN', 'SEEN', 'RESOLVED'],
    description: 'Per-user alert status',
  })
  status: SharedTypes.UserAlertStatus;

  @ApiPropertyOptional({
    example: '2026-03-15T10:35:00.000Z',
    description: 'When the alert was first seen by the user',
  })
  seenAt: Date | string | null;

  @ApiPropertyOptional({
    example: '2026-03-15T11:05:00.000Z',
    description: 'When the alert was marked resolved by the user',
  })
  resolvedAt: Date | string | null;

  @ApiPropertyOptional({
    example: 'Instrument recalibrated and control passed on rerun.',
    description: 'Optional note for how the alert was resolved',
  })
  resolutionNote: string | null;
}
