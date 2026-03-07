import { IsInt, IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateControlLotDto {


    @IsInt()
    @IsNotEmpty()
    testId: number;

    @IsString()
    @IsNotEmpty()
    lotNumber: string;

    @IsDateString()
    @IsNotEmpty()
    expirationDate: string;

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
}