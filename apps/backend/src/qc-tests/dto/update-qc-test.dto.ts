import * as SharedTypes from '@qc/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateQcTestDto implements SharedTypes.UpdateQcTestDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated name of the QC test',
    example: 'pH Measurement',
  })
  testName?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated type/category of the QC test',
    example: 'Chemical',
  })
  testType?: string;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated machine ID to associate this test with',
    example: 3,
  })
  machineId?: number;
}
