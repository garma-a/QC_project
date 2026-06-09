import { Injectable } from '@nestjs/common';
import { SectionsRepository } from './sections.repository';

@Injectable()
export class SectionsService {
  constructor(private readonly sectionsRepository: SectionsRepository) {}

  async findAll(limit?: number, offset?: number) {
    return this.sectionsRepository.findAll(limit, offset);
  }
}