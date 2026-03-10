import { Injectable } from '@nestjs/common';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';

@Injectable()
export class QcResultsService {
  create(createQcResultDto: CreateQcResultDto) {
    return 'This action adds a new qcResult';
  }

  findAll() {
    return `This action returns all qcResults`;
  }

  findOne(id: number) {
    return `This action returns a #${id} qcResult`;
  }

  update(id: number, updateQcResultDto: UpdateQcResultDto) {
    return `This action updates a #${id} qcResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} qcResult`;
  }
}
