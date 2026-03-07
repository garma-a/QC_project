import { IsDateString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateControlLotDto {

    @IsDateString()
    @IsOptional()
    expirationDate?: string;

    @IsNumber()
    @IsOptional()
    targetValue?: number;

    @IsNumber()
    @IsOptional()
    mean?: number;

    @IsNumber()
    @IsOptional()
    standardDevi?: number;

    @IsNumber()
    @IsOptional()
    upperControlLimit?: number;

    @IsNumber()
    @IsOptional()
    lowerControlLimit?: number;

    @IsNumber()
    @IsOptional()
    upperWarningLimit?: number;

    @IsNumber()
    @IsOptional()
    lowerWarningLimit?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
