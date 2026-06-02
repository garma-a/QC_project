import { Injectable } from '@nestjs/common';
import { SectionsRepository } from './sections.repository';

@Injectable()
export class SectionsService {
  constructor(private readonly sectionsRepository: SectionsRepository) {}

  async findAll() {
    return this.sectionsRepository.findAll();
  }
}