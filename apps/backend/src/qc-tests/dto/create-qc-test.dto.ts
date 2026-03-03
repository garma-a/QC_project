import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateQcTestDto {
  @IsString()
  @IsNotEmpty()
  testName: string;

  @IsString()
  @IsOptional()
  testType?: string;

  @IsInt()
  @IsNotEmpty()
  machineId: number;
}