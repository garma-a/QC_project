import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AlertPriority } from '@/alerts/alerts.types';

export class CreateAlertDto {
  @ApiProperty({
    description: 'The ID of the QC result associated with this alert',
    example: 402,
  })
  @IsInt()
  @IsNotEmpty()
  resultId: number;

  @ApiProperty({
    description: 'The classification or type of the alert',
    example: 'QC_DEVIATION',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'The priority level of the alert',
    enum: AlertPriority,
    default: AlertPriority.MEDIUM,
  })
  @IsEnum(AlertPriority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH',
  })
  @IsOptional()
  priority?: AlertPriority;

  @ApiProperty({
    description: 'Detailed message explaining why the alert was generated',
    example: 'QC Result for Lot X123 triggered a FAIL. Z-score is 3.15.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'The specific QC rule that was violated, if applicable',
    example: '1_3s (Violation)',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50, {
    message: 'Rule violated string cannot exceed 50 characters',
  })
  @IsOptional()
  ruleViolated?: string;

  @ApiPropertyOptional({
    description: 'Suggested action or troubleshooting steps to resolve the alert',
    example: 'Stop patient testing. Rerun control. If failure persists, recalibrate.',
  })
  @IsString()
  @IsOptional()
  suggestedSolution?: string;
}
