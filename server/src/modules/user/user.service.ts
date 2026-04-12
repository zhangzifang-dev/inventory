import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({
        id: In(dto.roleIds),
      });
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResponseDto<User>> {
    const { page = 1, pageSize = 20, username, name, status } = query;

    const where: any = {};
    if (username) {
      where.username = Like(`%${username}%`);
    }
    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await this.userRepository.findAndCount({
      where,
      relations: ['roles'],
      select: ['id', 'username', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
      select: ['id', 'username', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }
    }

    Object.assign(user, dto);

    if (dto.roleIds !== undefined) {
      if (dto.roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({
          id: In(dto.roleIds),
        });
        user.roles = roles;
      } else {
        user.roles = [];
      }
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    await this.userRepository.remove(user);
  }

  async resetPassword(id: number, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.password = await bcrypt.hash(password, 10);
    await this.userRepository.save(user);
  }
}
