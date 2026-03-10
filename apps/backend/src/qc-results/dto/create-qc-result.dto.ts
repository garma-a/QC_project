import { Optional } from "@nestjs/common";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateQcResultDto {
    @IsNotEmpty()
    @IsNumber()
    measuredValue: number;

    @IsInt()
    @IsNotEmpty()
    lotId: number;

    @IsString()
    @IsOptional()
    comments?: string;
}