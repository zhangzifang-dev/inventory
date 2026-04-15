import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { code: dto.code },
    });

    if (existingRole) {
      throw new BadRequestException('角色编码已存在');
    }

    const role = this.roleRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({
        id: In(dto.permissionIds),
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    name?: string,
  ): Promise<PaginatedResponseDto<Role>> {
    const where: any = {};
    if (name) {
      where.name = Like(`%${name}%`);
    }

    const [list, total] = await this.roleRepository.findAndCount({
      where,
      relations: ['permissions'],
      select: ['id', 'code', 'name', 'description', 'createdAt'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
      select: ['id', 'code', 'name', 'description', 'createdAt'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    if (dto.permissionIds !== undefined) {
      if (dto.permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findBy({
          id: In(dto.permissionIds),
        });
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestException('该角色已分配给用户，无法删除');
    }

    await this.roleRepository.remove(role);
  }

  async assignPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds),
    });

    role.permissions = permissions;
    return this.roleRepository.save(role);
  }
}
