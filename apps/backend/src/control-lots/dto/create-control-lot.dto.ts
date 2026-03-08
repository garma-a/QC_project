import { IsInt, IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateControlLotDto {

    @ApiProperty({
        description: 'The ID of the QC test this control lot belongs to',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    testId: number;

    @ApiProperty({
        description: 'The manufacturer lot number printed on the control material',
        example: 'LOT-HGB-2026-A',
    })
    @IsString()
    @IsNotEmpty()
    lotNumber: string;

    @ApiProperty({
        description: 'The expiration date of the control material (ISO 8601 format)',
        example: '2026-12-31',
    })
    @IsDateString()
    @IsNotEmpty()
    expirationDate: string;

    @ApiPropertyOptional({
        description: 'The manufacturer-specified target value for this control material',
        example: 14.0,
    })
    @IsNumber()
    @IsOptional()
    targetValue?: number;

    @ApiPropertyOptional({
        description: 'The established mean value from manufacturer or lab evaluation',
        example: 14.0,
    })
    @IsNumber()
    @IsOptional()
    mean?: number;

    @ApiPropertyOptional({
        description: 'The standard deviation — measures how spread out QC results are expected to be',
        example: 0.5,
    })
    @IsNumber()
    @IsOptional()
    standardDevi?: number;

    @ApiPropertyOptional({
        description: 'Upper control limit (mean + 3SD) — results above this are out of control',
        example: 15.5,
    })
    @IsNumber()
    @IsOptional()
    upperControlLimit?: number;

    @ApiPropertyOptional({
        description: 'Lower control limit (mean - 3SD) — results below this are out of control',
        example: 12.5,
    })
    @IsNumber()
    @IsOptional()
    lowerControlLimit?: number;

    @ApiPropertyOptional({
        description: 'Upper warning limit (mean + 2SD) — results above this trigger a warning',
        example: 15.0,
    })
    @IsNumber()
    @IsOptional()
    upperWarningLimit?: number;

    @ApiPropertyOptional({
        description: 'Lower warning limit (mean - 2SD) — results below this trigger a warning',
        example: 13.0,
    })
    @IsNumber()
    @IsOptional()
    lowerWarningLimit?: number;
}