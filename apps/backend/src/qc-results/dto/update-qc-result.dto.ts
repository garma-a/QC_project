import { PartialType } from '@nestjs/swagger';
import { CreateQcResultDto } from './create-qc-result.dto';

export class UpdateQcResultDto extends PartialType(CreateQcResultDto) {}
