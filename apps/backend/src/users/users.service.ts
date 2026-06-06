import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import * as argon2 from 'argon2';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user.dto';
import { Role } from '@/auth/auth.types';
import { UsersRepository } from './users.repository';
import { WorkerService } from '@/auth/workers/worker.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly workerService: WorkerService,
  ) {}

  private async validateSectionIds(
    sectionIds: number[] | undefined,
    context: 'create' | 'update',
  ) {
    if (sectionIds === undefined) return;

    const uniqueSectionIds = [...new Set(sectionIds)];
    if (uniqueSectionIds.length === 0) return;

    const existingSections =
      await this.usersRepository.findSectionsByIds(uniqueSectionIds);
    const existingIds = new Set(existingSections.map((s) => s.id));
    const missing = uniqueSectionIds.filter((id) => !existingIds.has(id));

    if (missing.length > 0) {
      const prefix =
        context === 'create'
          ? 'Laboratory section IDs do not exist:'
          : 'Cannot update user. Laboratory section IDs do not exist:';
      throw new BadRequestException(`${prefix} ${missing.join(', ')}`);
    }
  }

  async createUser(adminCreateUserDto: AdminCreateUserDto) {
    await this.validateSectionIds(adminCreateUserDto.sectionIds, 'create');

    const existing = await this.usersRepository.findByEmail(
      adminCreateUserDto.email,
    );

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.workerService.hashPassword(
      adminCreateUserDto.password,
    );

    const createdUser = await this.usersRepository.create({
      firstName: adminCreateUserDto.firstName,
      lastName: adminCreateUserDto.lastName,
      email: adminCreateUserDto.email,
      passwordHash: hashedPassword,
      role: adminCreateUserDto.role ?? 'TECHNICIAN',
      isActive: adminCreateUserDto.isActive ?? true,
    });

    await this.usersRepository.assignSections(
      createdUser.id,
      adminCreateUserDto.sectionIds ?? [],
    );

    const sectionIds = await this.usersRepository.getSectionIdsForUser(
      createdUser.id,
    );
    const createdWithSections = await this.usersRepository.findByIdWithSections(
      createdUser.id,
    );

    const { passwordHash, ...safeUser } = createdUser;
    return {
      ...safeUser,
      sectionIds,
      sectionNames: createdWithSections?.sectionNames ?? [],
    };
  }

  async deactivateUser(id: number, currentAdminId: number) {
    if (id === currentAdminId) {
      throw new BadRequestException(
        'You cannot deactivate your own administrator account.',
      );
    }
    const user = await this.usersRepository.deactivate(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deactivated successfully' };
  }

  async updateUser(id: number, adminUpdateUserDto: AdminUpdateUserDto) {
    const existingUser = await this.usersRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    if (adminUpdateUserDto.email) {
      const emailCollision = await this.usersRepository.findEmailCollision(
        adminUpdateUserDto.email,
        id,
      );

      if (emailCollision) {
        throw new ConflictException(
          `Email ${adminUpdateUserDto.email} is already in use by another staff member.`,
        );
      }
    }
    await this.validateSectionIds(adminUpdateUserDto.sectionIds, 'update');

    const { sectionIds: nextSectionIds, ...updatableUserFields } =
      adminUpdateUserDto;

    const updatedUser = await this.usersRepository.update(
      id,
      updatableUserFields,
    );

    if (nextSectionIds !== undefined) {
      await this.usersRepository.replaceUserSections(id, nextSectionIds);
    }

    const sectionIds = await this.usersRepository.getSectionIdsForUser(id);
    const updatedWithSections =
      await this.usersRepository.findByIdWithSections(id);

    const { passwordHash, ...safeUser } = updatedUser;
    return {
      ...safeUser,
      sectionIds,
      sectionNames: updatedWithSections?.sectionNames ?? [],
    };
  }

  async getUsers(roleFilter?: Role, limit?: number, offset?: number) {
    if (roleFilter && !Object.values(Role).includes(roleFilter)) {
      throw new BadRequestException(
        `"${roleFilter}" is not a valid user role.`,
      );
    }
    return await this.usersRepository.findAllWithSections(roleFilter, limit, offset);
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.findByIdWithSections(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}
